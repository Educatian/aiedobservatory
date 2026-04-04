import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyApprovalRouting, loadApprovalPolicy } from "./lib/approval-utils.mjs";
import { inferPolicyDomains } from "./lib/policy-extraction-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const canonicalPath = path.join(projectRoot, "data", "canonical", "policy-records.json");

async function main() {
  const approvalPolicy = await loadApprovalPolicy(projectRoot);
  const raw = await readFile(canonicalPath, "utf8");
  const records = JSON.parse(raw);

  for (const record of records) {
    record.policy_domains = [...new Set([...(record.policy_domains ?? []), ...inferPolicyDomains(record)])];
    applyApprovalRouting(record, approvalPolicy);
    record.updated_at = new Date().toISOString();
  }

  await writeFile(canonicalPath, JSON.stringify(records, null, 2), "utf8");
  console.log(`Routed ${records.length} canonical records using approval-policy.json.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
