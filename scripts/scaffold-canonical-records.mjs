import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(projectRoot, "data", "generated", "policy-source-manifest.json");
const canonicalDir = path.join(projectRoot, "data", "canonical");
const outputPath = path.join(canonicalDir, "policy-records.json");

function groupByState(rows) {
  const grouped = new Map();

  for (const row of rows) {
    if (!row.state_abbr) continue;
    const bucket = grouped.get(row.state_abbr) ?? [];
    bucket.push(row);
    grouped.set(row.state_abbr, bucket);
  }

  return grouped;
}

async function main() {
  const manifestRaw = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestRaw);
  const grouped = groupByState(manifest.filter((row) => !row.error));

  await mkdir(canonicalDir, { recursive: true });

  const records = [...grouped.entries()].map(([stateAbbr, rows]) => {
    const first = rows[0];

    return {
      record_id: `state-${stateAbbr.toLowerCase()}-v1`,
      jurisdiction_id: `state-${stateAbbr.toLowerCase()}`,
      jurisdiction_name: first.state_name,
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
      notes: "Auto-scaffolded from crawl manifest; awaiting extraction and review.",
      version: 1,
      updated_at: new Date().toISOString(),
      source_documents: rows.map((row) => ({
        url: row.url,
        title: row.title ?? null,
        raw_file: row.raw_file ?? null,
        published_date_guess: row.published_date_guess ?? null
      })),
      evidence_spans: []
    };
  });

  await writeFile(outputPath, JSON.stringify(records, null, 2), "utf8");
  console.log(`Scaffolded ${records.length} canonical records to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
