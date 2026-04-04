import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const canonicalPath = path.join(projectRoot, "data", "canonical", "policy-records.json");
const publicDir = path.join(projectRoot, "public");
const outputPath = path.join(publicDir, "policy-records.json");

async function main() {
  const raw = await readFile(canonicalPath, "utf8");
  const records = JSON.parse(raw);
  const publishable = records.filter(
    (record) =>
      record.review_status === "approved" &&
      (record.approval_route === "auto_approve" ||
        record.approval_route === "sample_audit" ||
        record.audit_status === "completed")
  );
  await mkdir(publicDir, { recursive: true });
  await writeFile(outputPath, JSON.stringify(publishable, null, 2), "utf8");
  console.log(`Published ${publishable.length} canonical records to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
