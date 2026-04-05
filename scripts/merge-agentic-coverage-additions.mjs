import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { appendPolicyEvents, buildPolicyEvent } from "./lib/policy-events-utils.mjs";

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
  const existingStates = new Set(canonicalRecords.map((record) => record.state_abbr));
  const existingSeedUrls = new Set(sourceSeeds.map((seed) => seed.url));
  const newSeedCandidates = (additions.source_seeds ?? []).filter(
    (seed) => !existingSeedUrls.has(seed.url)
  );

  const canonicalByState = new Map(
    canonicalRecords.map((record) => [record.state_abbr, record])
  );

  for (const record of additions.canonical_records ?? []) {
    record.updated_at = new Date().toISOString();
    canonicalByState.set(record.state_abbr, record);
  }

  const mergedCanonical = [...canonicalByState.values()].sort(sortByState);
  const mergedSeeds = [...sourceSeeds];

  for (const seed of newSeedCandidates) {
    if (existingSeedUrls.has(seed.url)) continue;
    mergedSeeds.push(seed);
    existingSeedUrls.add(seed.url);
  }

  mergedSeeds.sort(sortByState);

  await Promise.all([
    writeFile(canonicalPath, JSON.stringify(mergedCanonical, null, 2), "utf8"),
    writeFile(seedsPath, JSON.stringify(mergedSeeds, null, 2), "utf8")
  ]);

  const newRecordEvents = (additions.canonical_records ?? [])
    .filter((record) => !existingStates.has(record.state_abbr))
    .map((record) =>
      buildPolicyEvent({
        eventType: "record_created",
        stateAbbr: record.state_abbr,
        stateName: record.jurisdiction_name,
        occurredAt: record.updated_at ?? new Date().toISOString(),
        title: `${record.jurisdiction_name} added to canonical surveillance set`,
        description: `A new state record entered the framework with policy strength ${record.policy_strength ?? 0}/16.`,
        sourceUrl: record.source_documents?.[0]?.url ?? null,
        confidence: record.confidence ?? null,
        nextValue: record.policy_strength ?? null,
        changedFields: ["record_created", "policy_strength"]
      })
    );

  const newSeedEvents = newSeedCandidates
    .map((seed) =>
      buildPolicyEvent({
        eventType: "source_added",
        stateAbbr: seed.state_abbr,
        stateName: seed.state_name,
        occurredAt: new Date().toISOString(),
        title: `Source added for ${seed.state_name}`,
        description: `${seed.seed_type.replace(/_/g, " ")} source registered from ${seed.agency}.`,
        sourceUrl: seed.url,
        nextValue: seed.seed_type,
        changedFields: ["source_documents"]
      })
    );

  await appendPolicyEvents(projectRoot, [...newRecordEvents, ...newSeedEvents]);

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
