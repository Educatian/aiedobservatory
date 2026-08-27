import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const recordsPath = path.join(root, "data", "canonical", "policy-records.json");

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (!argv[index].startsWith("--")) continue;
    args[argv[index].slice(2)] = argv[index + 1];
    index += 1;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const state = args.state?.toUpperCase();
  const reason = args.reason;
  if (!state || !reason) {
    throw new Error("Usage: npm run data:quarantine -- --state AL --reason <reason>");
  }
  const records = JSON.parse(await readFile(recordsPath, "utf8"));
  const record = records.find((item) => item.state_abbr === state);
  if (!record) throw new Error(`No canonical record for ${state}`);

  Object.assign(record, {
    review_status: "needs_revision",
    extraction_status: "draft_extracted",
    confidence: 0.1,
    policy_strength: 0,
    ai_use_allowed: null,
    assessment_policy: null,
    privacy_policy: null,
    teacher_pd_support: null,
    implementation_stage: null,
    policy_orientation: "unverified_source_integrity",
    notes: `Quarantined from public scoring pending source repair: ${reason}`,
    updated_at: new Date().toISOString(),
    evidence_spans: [],
    teacher_guidance: null,
    verification_status: "needs_review",
    verification_notes: reason,
    approval_route: "human_review",
    audit_status: "pending_human_review",
    source_authority: "unknown",
    routing_reasons: ["source_integrity_failure", "manual_source_repair_required"],
    deep_research_recommended: true,
    deep_research_reasons: [reason],
    source_integrity_status: "needs_review",
    source_integrity_checked_at: new Date().toISOString()
  });

  await writeFile(recordsPath, JSON.stringify(records, null, 2), "utf8");
  console.log(`Quarantined ${state}: ${record.record_id}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
