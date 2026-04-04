import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const recordsPath = path.join(projectRoot, "data", "canonical", "policy-records.json");
const fieldBounds = {
  ai_use_allowed: [0, 3],
  assessment_policy: [0, 3],
  privacy_policy: [0, 3],
  teacher_pd_support: [0, 3],
  implementation_stage: [0, 4]
};

function validateRecord(record) {
  const issues = [];
  const required = [
    "record_id",
    "jurisdiction_id",
    "jurisdiction_name",
    "jurisdiction_type",
    "state_abbr",
    "review_status",
    "extraction_status",
    "version",
    "updated_at",
    "source_documents"
  ];

  for (const key of required) {
    if (!(key in record)) issues.push(`Missing required field: ${key}`);
  }

  if (!Array.isArray(record.source_documents) || record.source_documents.length === 0) {
    issues.push("Record must include at least one source document");
  }

  if (
    record.confidence != null &&
    (typeof record.confidence !== "number" || record.confidence < 0 || record.confidence > 1)
  ) {
    issues.push("Confidence must be null or a number between 0 and 1");
  }

  if (
    record.approval_route != null &&
    !["auto_approve", "sample_audit", "human_review"].includes(record.approval_route)
  ) {
    issues.push("approval_route must be null or one of auto_approve, sample_audit, human_review");
  }

  if (
    record.audit_status != null &&
    !["not_required", "pending_sample", "pending_human_review", "completed"].includes(record.audit_status)
  ) {
    issues.push(
      "audit_status must be null or one of not_required, pending_sample, pending_human_review, completed"
    );
  }

  for (const [field, [min, max]] of Object.entries(fieldBounds)) {
    const value = record[field];
    if (value == null) continue;
    if (!Number.isInteger(value) || value < min || value > max) {
      issues.push(`${field} must be null or an integer between ${min} and ${max}`);
    }
  }

  if (Array.isArray(record.evidence_spans)) {
    for (const span of record.evidence_spans) {
      if (!span.field || !span.quote || !span.source_url) {
        issues.push("Evidence spans must include field, quote, and source_url");
        break;
      }
    }
  }

  if (Array.isArray(record.routing_reasons) && record.routing_reasons.some((item) => typeof item !== "string")) {
    issues.push("routing_reasons must contain only strings");
  }

  return issues;
}

async function main() {
  const raw = await readFile(recordsPath, "utf8");
  const records = JSON.parse(raw);
  let totalIssues = 0;

  for (const record of records) {
    const issues = validateRecord(record);
    if (issues.length > 0) {
      totalIssues += issues.length;
      console.log(`\n${record.record_id}`);
      for (const issue of issues) console.log(`- ${issue}`);
    }
  }

  if (totalIssues === 0) {
    console.log(`Validated ${records.length} records with no issues.`);
    return;
  }

  console.error(`Found ${totalIssues} validation issues.`);
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
