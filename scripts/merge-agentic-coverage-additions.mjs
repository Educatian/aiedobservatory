import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const additionsPath = path.join(projectRoot, "data", "generated", "agentic-coverage-additions.json");
const canonicalPath = path.join(projectRoot, "data", "canonical", "policy-records.json");
const seedsPath = path.join(projectRoot, "data", "source-seeds.json");

function sortByState(left, right) {
  return String(left.state_abbr ?? left.stateAbbr ?? "").localeCompare(
    String(right.state_abbr ?? right.stateAbbr ?? "")
  );
}

async function main() {
  const [additionsRaw, canonicalRaw, seedsRaw] = await Promise.all([
    readFile(additionsPath, "utf8"),
    readFile(canonicalPath, "utf8"),
    readFile(seedsPath, "utf8")
  ]);

  const additions = JSON.parse(additionsRaw);
  const canonicalRecords = JSON.parse(canonicalRaw);
  const sourceSeeds = JSON.parse(seedsRaw);

  const canonicalByState = new Map(
    canonicalRecords.map((record) => [record.state_abbr, record])
  );

  for (const record of additions.canonical_records ?? []) {
    record.updated_at = new Date().toISOString();
    canonicalByState.set(record.state_abbr, record);
  }

  const mergedCanonical = [...canonicalByState.values()].sort(sortByState);

  const existingSeedUrls = new Set(sourceSeeds.map((seed) => seed.url));
  const mergedSeeds = [...sourceSeeds];

  for (const seed of additions.source_seeds ?? []) {
    if (existingSeedUrls.has(seed.url)) continue;
    mergedSeeds.push(seed);
    existingSeedUrls.add(seed.url);
  }

  mergedSeeds.sort(sortByState);

  await Promise.all([
    writeFile(canonicalPath, JSON.stringify(mergedCanonical, null, 2), "utf8"),
    writeFile(seedsPath, JSON.stringify(mergedSeeds, null, 2), "utf8")
  ]);

  console.log(
    `Merged ${additions.canonical_records?.length ?? 0} coverage records and ${
      additions.source_seeds?.length ?? 0
    } source seeds.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
