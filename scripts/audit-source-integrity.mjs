import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const releaseDir = path.join(projectRoot, "data", "release", "v0.1");
const rightsPath = path.join(releaseDir, "source-rights.json");
const outputPath = path.join(releaseDir, "source-integrity.json");

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function fetchSource(source) {
  const response = await fetch(source.url, {
    redirect: "follow",
    headers: { "user-agent": "AIED-Observatory-Integrity-Audit/0.2 (+https://github.com/Educatian/aiedobservatory)" }
  });
  const buffer = Buffer.from(await response.arrayBuffer());
  return {
    source_id: source.source_id,
    requested_url: source.url,
    final_url: response.url,
    checked_at: new Date().toISOString(),
    http_status: response.status,
    ok: response.ok,
    content_type: response.headers.get("content-type"),
    etag: response.headers.get("etag"),
    last_modified: response.headers.get("last-modified"),
    bytes: buffer.length,
    sha256: sha256(buffer)
  };
}

async function main() {
  const rights = JSON.parse(await readFile(rightsPath, "utf8"));
  const results = [];
  for (const source of rights.sources) {
    try {
      results.push(await fetchSource(source));
    } catch (error) {
      results.push({
        source_id: source.source_id,
        requested_url: source.url,
        final_url: null,
        checked_at: new Date().toISOString(),
        http_status: null,
        ok: false,
        error: error.message
      });
    }
  }

  const report = {
    release: rights.release,
    generated_at: new Date().toISOString(),
    all_sources_ok: results.every((item) => item.ok),
    source_count: results.length,
    results
  };
  await mkdir(releaseDir, { recursive: true });
  await writeFile(outputPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`Audited ${results.length} release sources; all_sources_ok=${report.all_sources_ok}`);
  if (!report.all_sources_ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
