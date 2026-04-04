import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { callGeminiJson, loadProjectEnv } from "./lib/gemini-utils.mjs";
import { applyApprovalRouting, loadApprovalPolicy } from "./lib/approval-utils.mjs";
import { parseJsonLines, pickTopChunksByField } from "./lib/policy-extraction-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const canonicalPath = path.join(projectRoot, "data", "canonical", "policy-records.json");
const chunksPath = path.join(projectRoot, "data", "generated", "chunks.jsonl");
const retrievalIndexPath = path.join(projectRoot, "data", "generated", "retrieval-index.json");

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    args[token.slice(2)] = argv[index + 1];
    index += 1;
  }
  return args;
}

const verificationSchema = {
  type: "object",
  properties: {
    supported: { type: "boolean" },
    confidence_adjustment: { type: "number" },
    review_status: { type: "string" },
    verification_notes: { type: ["string", "null"] }
  },
  required: ["supported", "confidence_adjustment", "review_status", "verification_notes"]
};

function buildPrompt(record, chunks) {
  const chunkText = chunks
    .map(
      (chunk, index) =>
        `[Chunk ${index + 1}]
field_hint: ${chunk.field_hint}
chunk_id: ${chunk.chunk_id}
source_url: ${chunk.source_url}
text: ${chunk.text}`
    )
    .join("\n\n");

  return `
You are verifying whether a previously extracted policy coding record is well-supported by the evidence.

Record:
${JSON.stringify(
    {
      jurisdiction_name: record.jurisdiction_name,
      state_abbr: record.state_abbr,
      ai_use_allowed: record.ai_use_allowed,
      assessment_policy: record.assessment_policy,
      privacy_policy: record.privacy_policy,
      teacher_pd_support: record.teacher_pd_support,
      implementation_stage: record.implementation_stage,
      policy_orientation: record.policy_orientation,
      confidence: record.confidence
    },
    null,
    2
  )}

Rules:
- Use only the chunks below.
- If the record appears overstated or weakly grounded, mark supported=false.
- confidence_adjustment should be between -0.35 and 0.15.
- review_status must be one of approved, pending_review, needs_revision.
- Keep verification_notes short.
- Return JSON only.

Evidence:
${chunkText}
  `.trim();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await loadProjectEnv(projectRoot);
  const approvalPolicy = await loadApprovalPolicy(projectRoot);

  const geminiApiKey = process.env.GEMINI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL ?? "gemini-2.5-pro";

  if (!geminiApiKey) {
    console.error("GEMINI_API_KEY is required for pipeline:verify:gemini");
    process.exitCode = 1;
    return;
  }

  const [recordsRaw, chunksRaw] = await Promise.all([
    readFile(canonicalPath, "utf8"),
    readFile(chunksPath, "utf8")
  ]);
  const retrievalIndex = JSON.parse(await readFile(retrievalIndexPath, "utf8"));

  const targetStates = new Set(
    (args.states ?? "")
      .split(",")
      .map((value) => value.trim().toUpperCase())
      .filter(Boolean)
  );

  const records = JSON.parse(recordsRaw);
  const allChunks = parseJsonLines(chunksRaw);

  for (const record of records) {
    if (targetStates.size > 0 && !targetStates.has(record.state_abbr)) continue;
    if (record.extraction_status === "not_extracted") continue;

    const chunks = pickTopChunksByField(record, allChunks, retrievalIndex, 3);
    if (chunks.length === 0) continue;

    const verification = await callGeminiJson({
      apiKey: geminiApiKey,
      model: geminiModel,
      schema: verificationSchema,
      prompt: buildPrompt(record, chunks),
      temperature: 0.1
    });

    const currentConfidence = typeof record.confidence === "number" ? record.confidence : 0.5;
    const adjustment = Math.max(-0.35, Math.min(0.15, Number(verification.confidence_adjustment) || 0));

    record.confidence = Math.max(0, Math.min(1, Number((currentConfidence + adjustment).toFixed(2))));
    record.verification_status = verification.supported ? "supported" : "needs_review";
    record.verification_notes = verification.verification_notes ?? null;
    if (verification.review_status === "needs_revision") {
      record.review_status = "needs_revision";
    }
    record.updated_at = new Date().toISOString();
    applyApprovalRouting(record, approvalPolicy);

    console.log(`Gemini verified ${record.jurisdiction_name}`);
  }

  await writeFile(canonicalPath, JSON.stringify(records, null, 2), "utf8");
  console.log(`Verified canonical records with Gemini using ${geminiModel}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
