import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(projectRoot, "data", "generated", "policy-source-manifest.json");
const canonicalPath = path.join(projectRoot, "data", "canonical", "policy-records.json");

function ensureRecord(records, manifestRow) {
  const existing = records.find((record) => record.state_abbr === manifestRow.state_abbr);
  if (existing) {
    return existing;
  }

  const record = {
    record_id: `state-${manifestRow.state_abbr.toLowerCase()}-v1`,
    jurisdiction_id: `state-${manifestRow.state_abbr.toLowerCase()}`,
    jurisdiction_name: manifestRow.state_name,
    jurisdiction_type: "state",
    parent_jurisdiction_id: null,
    state_abbr: manifestRow.state_abbr,
    year: null,
    effective_date: null,
    review_status: "pending_review",
    extraction_status: "not_extracted",
    coder_type: null,
    confidence: null,
    approval_route: "human_review",
    audit_status: "pending_human_review",
    source_authority: "unknown",
    routing_reasons: ["not_extracted"],
    deep_research_recommended: true,
    deep_research_reasons: ["coverage_gap"],
    policy_strength: null,
    policy_domains: [],
    ai_use_allowed: null,
    assessment_policy: null,
    privacy_policy: null,
    teacher_pd_support: null,
    implementation_stage: null,
    policy_orientation: null,
    notes: "Auto-created from merged crawl manifest; awaiting extraction and review.",
    version: 1,
    updated_at: new Date().toISOString(),
    source_documents: [],
    evidence_spans: []
  };

  records.push(record);
  return record;
}

async function main() {
  const [manifestRaw, canonicalRaw] = await Promise.all([
    readFile(manifestPath, "utf8"),
    readFile(canonicalPath, "utf8")
  ]);

  const manifest = JSON.parse(manifestRaw).filter((row) => !row.error);
  const records = JSON.parse(canonicalRaw);

  for (const row of manifest) {
    const record = ensureRecord(records, row);
    const dedupedSources = record.source_documents.filter((doc) => doc.url !== row.url);
    dedupedSources.push({
      url: row.url,
      title: row.title ?? null,
      raw_file: row.raw_file ?? null,
      published_date_guess: row.published_date_guess ?? null
    });
    record.source_documents = dedupedSources;
    record.updated_at = new Date().toISOString();
  }

  await writeFile(canonicalPath, JSON.stringify(records, null, 2), "utf8");
  console.log(`Merged manifest sources into ${records.length} canonical records.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
