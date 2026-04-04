import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { callGeminiJson, loadProjectEnv } from "./lib/gemini-utils.mjs";
import { applyApprovalRouting, loadApprovalPolicy } from "./lib/approval-utils.mjs";
import {
  clampInt,
  computePolicyStrength,
  fieldBounds,
  inferPolicyDomains,
  normalizeEvidenceSpans,
  parseJsonLines,
  pickTopChunksByField
} from "./lib/policy-extraction-utils.mjs";

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

const responseSchema = {
  type: "object",
  properties: {
    ai_use_allowed: { type: ["integer", "null"] },
    assessment_policy: { type: ["integer", "null"] },
    privacy_policy: { type: ["integer", "null"] },
    teacher_pd_support: { type: ["integer", "null"] },
    implementation_stage: { type: ["integer", "null"] },
    policy_orientation: { type: ["string", "null"] },
    notes: { type: ["string", "null"] },
    confidence: { type: "number" },
    evidence_spans: {
      type: "array",
      items: {
        type: "object",
        properties: {
          field: { type: "string" },
          quote: { type: "string" },
          source_url: { type: "string" },
          chunk_id: { type: ["string", "null"] }
        },
        required: ["field", "quote", "source_url", "chunk_id"]
      }
    }
  },
  required: [
    "ai_use_allowed",
    "assessment_policy",
    "privacy_policy",
    "teacher_pd_support",
    "implementation_stage",
    "policy_orientation",
    "notes",
    "confidence",
    "evidence_spans"
  ]
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
You are coding AI in Education policy variables for a research-grade surveillance dataset.

Jurisdiction:
- name: ${record.jurisdiction_name}
- type: ${record.jurisdiction_type}
- state: ${record.state_abbr}

Score rubric:
- ai_use_allowed: 0 none, 1 light mention, 2 conditional guidance, 3 strong explicit guidance
- assessment_policy: 0 none, 1 mention, 2 moderate policy guidance, 3 strong redesign/disclosure/integrity guidance
- privacy_policy: 0 none, 1 mention, 2 explicit student-data/privacy guidance, 3 strong governance/vendor/privacy controls
- teacher_pd_support: 0 none, 1 mention, 2 training/professional learning guidance, 3 strong educator capacity-building
- implementation_stage: 0 none, 1 early mention, 2 framework/recommendation stage, 3 released formal guidance, 4 operationalized recurring system

Rules:
- Use only the evidence chunks provided below.
- Do not infer facts not present in the chunks.
- Prefer lower scores when evidence is ambiguous.
- Every score above 0 should have at least one evidence span when possible.
- Keep evidence quotes short and representative.
- Return valid JSON only.

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
    console.error("GEMINI_API_KEY is required for pipeline:extract:gemini");
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

    const topChunks = pickTopChunksByField(record, allChunks, retrievalIndex, 4);
    if (topChunks.length === 0) continue;

    const extracted = await callGeminiJson({
      apiKey: geminiApiKey,
      model: geminiModel,
      schema: responseSchema,
      prompt: buildPrompt(record, topChunks),
      temperature: 0.1
    });

    for (const [field, [min, max]] of Object.entries(fieldBounds)) {
      record[field] = clampInt(extracted[field], min, max);
    }

    record.policy_strength = computePolicyStrength(record);
    record.policy_domains = inferPolicyDomains(record);
    record.policy_orientation = extracted.policy_orientation ?? "unclear";
    record.notes = extracted.notes ?? "Gemini extraction completed.";
    record.confidence =
      typeof extracted.confidence === "number"
        ? Math.max(0, Math.min(1, extracted.confidence))
        : null;
    record.coder_type = "hybrid";
    record.extraction_status = "validated";
    record.updated_at = new Date().toISOString();
    record.extraction_model = geminiModel;
    record.evidence_spans = normalizeEvidenceSpans(extracted.evidence_spans);
    applyApprovalRouting(record, approvalPolicy);

    console.log(`Gemini extracted ${record.jurisdiction_name}`);
  }

  await writeFile(canonicalPath, JSON.stringify(records, null, 2), "utf8");
  console.log(`Updated canonical records with Gemini extraction using ${geminiModel}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
