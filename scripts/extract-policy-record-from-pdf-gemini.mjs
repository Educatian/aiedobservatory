import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { callGeminiJson, loadProjectEnv } from "./lib/gemini-utils.mjs";
import {
  clampInt,
  computePolicyStrength,
  fieldBounds,
  normalizeEvidenceSpans
} from "./lib/policy-extraction-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(projectRoot, "data", "generated", "policy-source-manifest.json");
const canonicalPath = path.join(projectRoot, "data", "canonical", "policy-records.json");
const rawDir = path.join(projectRoot, "data", "generated", "raw");

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

function makeSlug(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureRecord(records, stateAbbr, stateName) {
  const existing = records.find((record) => record.state_abbr === stateAbbr);
  if (existing) return existing;

  const record = {
    record_id: `state-${stateAbbr.toLowerCase()}-v1`,
    jurisdiction_id: `state-${stateAbbr.toLowerCase()}`,
    jurisdiction_name: stateName,
    jurisdiction_type: "state",
    parent_jurisdiction_id: null,
    state_abbr: stateAbbr,
    year: null,
    effective_date: null,
    review_status: "pending_review",
    extraction_status: "not_extracted",
    coder_type: null,
    confidence: null,
    policy_strength: null,
    ai_use_allowed: null,
    assessment_policy: null,
    privacy_policy: null,
    teacher_pd_support: null,
    implementation_stage: null,
    policy_orientation: null,
    notes: "Auto-created from PDF extraction; awaiting review.",
    version: 1,
    updated_at: new Date().toISOString(),
    source_documents: [],
    evidence_spans: []
  };

  records.push(record);
  return record;
}

async function loadPdfBytes(args) {
  if (args.path) {
    return {
      bytes: await readFile(args.path),
      discoveredFrom: args.path,
      label: path.basename(args.path)
    };
  }

  if (args["download-url"]) {
    const response = await fetch(args["download-url"], {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to download PDF: HTTP ${response.status}`);
    }

    return {
      bytes: Buffer.from(await response.arrayBuffer()),
      discoveredFrom: args["download-url"],
      label: args["download-url"]
    };
  }

  throw new Error("Pass either --path <local-pdf> or --download-url <pdf-url>.");
}

function buildPrompt({ stateName, stateAbbr, title, sourceUrl }) {
  return `
You are coding AI in Education policy variables for a research-grade surveillance dataset from a policy PDF.

Jurisdiction:
- name: ${stateName}
- type: state
- state: ${stateAbbr}

Document:
- title: ${title}
- source_url: ${sourceUrl}

Score rubric:
- ai_use_allowed: 0 none, 1 light mention, 2 conditional guidance, 3 strong explicit guidance
- assessment_policy: 0 none, 1 mention, 2 moderate policy guidance, 3 strong redesign/disclosure/integrity guidance
- privacy_policy: 0 none, 1 mention, 2 explicit student-data/privacy guidance, 3 strong governance/vendor/privacy controls
- teacher_pd_support: 0 none, 1 mention, 2 training/professional learning guidance, 3 strong educator capacity-building
- implementation_stage: 0 none, 1 early mention, 2 framework/recommendation stage, 3 released formal guidance, 4 operationalized recurring system

Rules:
- Read only the PDF attached with this prompt.
- Return cautious scores if the language is ambiguous.
- Keep evidence quotes short and representative.
- In every evidence span, use source_url exactly as: ${sourceUrl}
- chunk_id should be null for PDF extraction.
- Return valid JSON only.
  `.trim();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await loadProjectEnv(projectRoot);

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-pro";
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required.");
  }

  const stateAbbr = args.state?.toUpperCase();
  const stateName = args["state-name"];
  const agency = args.agency;
  const sourceUrl = args.url ?? `local://${makeSlug(`${stateAbbr}-${args.title ?? "ai-framework-pdf"}`)}`;
  const title = args.title ?? "AI policy PDF";
  const seedType = args["seed-type"] ?? "local_pdf";
  const publishedDateGuess = args["published-date"] ?? null;

  if (!stateAbbr || !stateName || !agency) {
    throw new Error(
      "Usage: node scripts/extract-policy-record-from-pdf-gemini.mjs --state <abbr> --state-name <name> --agency <agency> [--path <local-pdf> | --download-url <pdf-url>] [--title <title>] [--url <source-url>]"
    );
  }

  const pdf = await loadPdfBytes(args);
  await mkdir(rawDir, { recursive: true });
  const rawFile = path.join(rawDir, `${stateAbbr}-${makeSlug(seedType)}.pdf`);
  await writeFile(rawFile, pdf.bytes);

  const extracted = await callGeminiJson({
    apiKey,
    model,
    schema: responseSchema,
    temperature: 0.1,
    parts: [
      { text: buildPrompt({ stateName, stateAbbr, title, sourceUrl }) },
      {
        inlineData: {
          mimeType: "application/pdf",
          data: pdf.bytes.toString("base64")
        }
      }
    ]
  });

  const [manifestRaw, canonicalRaw] = await Promise.all([
    readFile(manifestPath, "utf8"),
    readFile(canonicalPath, "utf8")
  ]);

  const manifest = JSON.parse(manifestRaw).filter((entry) => entry.url !== sourceUrl);
  manifest.push({
    state_abbr: stateAbbr,
    state_name: stateName,
    agency,
    region_type: "state",
    seed_type: seedType,
    url: sourceUrl,
    title,
    published_date_guess: publishedDateGuess,
    fetched_at: new Date().toISOString(),
    raw_file: path.relative(projectRoot, rawFile).replaceAll("\\", "/"),
    notes: `Imported from PDF source: ${pdf.label}`,
    snippet: null,
    content_kind: "pdf",
    content_type: "application/pdf",
    discovered_from: pdf.discoveredFrom,
    discovery_anchor_text: null,
    local_source: Boolean(args.path)
  });
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

  const records = JSON.parse(canonicalRaw);
  const record = ensureRecord(records, stateAbbr, stateName);

  for (const [field, [min, max]] of Object.entries(fieldBounds)) {
    record[field] = clampInt(extracted[field], min, max);
  }

  record.policy_strength = computePolicyStrength(record);
  record.policy_orientation = extracted.policy_orientation ?? "unclear";
  record.notes = extracted.notes ?? "Gemini PDF extraction completed.";
  record.confidence =
    typeof extracted.confidence === "number"
      ? Math.max(0, Math.min(1, extracted.confidence))
      : null;
  record.coder_type = "hybrid";
  record.extraction_status = "validated";
  record.review_status =
    record.confidence != null && record.confidence >= 0.85 ? "approved" : "pending_review";
  record.extraction_model = model;
  record.updated_at = new Date().toISOString();
  record.source_documents = record.source_documents.filter((doc) => doc.url !== sourceUrl);
  record.source_documents.push({
    url: sourceUrl,
    title,
    raw_file: path.relative(projectRoot, rawFile).replaceAll("\\", "/"),
    published_date_guess: publishedDateGuess
  });
  record.evidence_spans = normalizeEvidenceSpans(extracted.evidence_spans).map((item) => ({
    ...item,
    source_url: sourceUrl,
    chunk_id: null
  }));

  await writeFile(canonicalPath, JSON.stringify(records, null, 2), "utf8");
  console.log(`Extracted PDF-backed policy record for ${stateName} using ${model}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
