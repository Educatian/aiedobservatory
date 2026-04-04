import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadApprovalPolicy } from "./lib/approval-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const canonicalPath = path.join(projectRoot, "data", "canonical", "policy-records.json");

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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const state = args.state?.toUpperCase();
  const approvalPolicy = await loadApprovalPolicy(projectRoot);

  if (!state) {
    throw new Error(
      "Usage: node scripts/apply-review-decision.mjs --state <abbr> [--review-status approved] [--verification-status supported] [--verification-notes <text>] [--confidence <0-1>]"
    );
  }

  const raw = await readFile(canonicalPath, "utf8");
  const records = JSON.parse(raw);
  const record = records.find((item) => item.state_abbr === state);

  if (!record) {
    throw new Error(`No canonical record found for ${state}.`);
  }

  if (args["review-status"]) {
    record.review_status = args["review-status"];
  }

  if (args["verification-status"]) {
    record.verification_status = args["verification-status"];
  }

  if (args["verification-notes"]) {
    record.verification_notes = args["verification-notes"];
  }

  if (args.confidence != null) {
    const confidence = Math.max(0, Math.min(1, Number(args.confidence)));
    if (!Number.isNaN(confidence)) {
      record.confidence = confidence;
    }
  }

  if (record.review_status === "approved" || record.review_status === "needs_revision") {
    record.approval_route = "human_review";
    record.audit_status = "completed";
    record.routing_reasons = ["manual_review_completed"];
    record.deep_research_recommended = false;
    record.deep_research_reasons = [];
  } else {
    record.approval_route = "human_review";
    record.audit_status = "pending_human_review";
  }

  if (!record.source_authority) {
    const fallbackAuthority = approvalPolicy.routing_policy.auto_approve.requires_strong_primary_source
      ? "unknown"
      : null;
    record.source_authority = fallbackAuthority;
  }

  record.updated_at = new Date().toISOString();

  await writeFile(canonicalPath, JSON.stringify(records, null, 2), "utf8");
  console.log(`Applied review decision to ${state}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
