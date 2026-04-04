import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const recordsPath = path.join(projectRoot, "data", "canonical", "policy-records.json");
const outputDir = path.join(projectRoot, "data", "canonical");
const outputPath = path.join(outputDir, "review-queue.json");

async function main() {
  const raw = await readFile(recordsPath, "utf8");
  const records = JSON.parse(raw);
  await mkdir(outputDir, { recursive: true });

  const queue = records
    .filter(
      (record) =>
        (record.approval_route === "human_review" && record.audit_status !== "completed") ||
        record.audit_status === "pending_sample" ||
        record.verification_status === "needs_review"
    )
    .map((record) => ({
      review_id: `review-${record.record_id}`,
      record_id: record.record_id,
      jurisdiction_name: record.jurisdiction_name,
      queue_type: record.audit_status === "pending_sample" ? "sample_audit" : "human_review",
      priority:
        record.audit_status === "pending_sample"
          ? "low"
          : record.confidence == null || record.confidence < 0.5
            ? "high"
            : "medium",
      reason:
        record.extraction_status === "not_extracted"
          ? "Awaiting extraction"
          : record.verification_status === "needs_review"
            ? "Verifier flagged weak grounding"
            : record.audit_status === "pending_sample"
              ? "Selected for sampling audit"
              : "Requires human review under approval policy",
      routing_reasons: record.routing_reasons ?? [],
      deep_research_recommended: record.deep_research_recommended ?? false,
      deep_research_reasons: record.deep_research_reasons ?? [],
      status: "open",
      created_at: new Date().toISOString()
    }));

  await writeFile(outputPath, JSON.stringify(queue, null, 2), "utf8");
  console.log(`Built ${queue.length} review queue items at ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
