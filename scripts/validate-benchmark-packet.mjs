import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dir = path.join(root, "data", "benchmark", "v0.1");

function parseSheet(text) {
  const [header, ...rows] = text.trimEnd().split(/\r?\n/);
  if (header !== "decision_id,label,confidence,evidence_note,source_access_status,conflict_disclosure,completed_at") {
    throw new Error("Unexpected annotation sheet header");
  }
  return rows.map((row) => {
    const [decisionId, ...cells] = row.split(",");
    return { decisionId, cells };
  });
}

export async function validateBenchmarkPacket() {
  const [manifest, claims, sheetAText, sheetBText] = await Promise.all([
    readFile(path.join(dir, "benchmark-manifest.json"), "utf8").then(JSON.parse),
    readFile(path.join(root, "data/release/v0.1/policy-claims.json"), "utf8").then(JSON.parse),
    readFile(path.join(dir, "annotation-sheet-a.csv"), "utf8"),
    readFile(path.join(dir, "annotation-sheet-b.csv"), "utf8")
  ]);
  const decisions = manifest.blinded_decision_order;
  const claimIds = new Set(claims.claims.map((claim) => claim.claim_id));
  const criterionIds = new Set(manifest.criteria.map((criterion) => criterion.criterion_id));
  if (manifest.gold_labels_in_packet !== false) throw new Error("Benchmark packet must not expose gold labels");
  if (decisions.length !== 30 || manifest.decision_count !== 30) throw new Error("Benchmark must contain exactly 30 decisions");
  if (new Set(decisions.map((decision) => decision.decision_id)).size !== 30) throw new Error("Decision IDs must be unique");
  for (const decision of decisions) {
    if (!claimIds.has(decision.claim_id)) throw new Error(`Unknown claim ${decision.claim_id}`);
    if (!criterionIds.has(decision.criterion_id)) throw new Error(`Unknown criterion ${decision.criterion_id}`);
  }
  for (const claimId of claimIds) {
    const criteria = decisions.filter((decision) => decision.claim_id === claimId).map((decision) => decision.criterion_id);
    if (criteria.length !== 5 || new Set(criteria).size !== 5) throw new Error(`Claim ${claimId} does not have five unique decisions`);
  }
  const expectedIds = decisions.map((decision) => decision.decision_id).sort();
  for (const [name, text] of [["A", sheetAText], ["B", sheetBText]]) {
    const rows = parseSheet(text);
    if (rows.length !== 30) throw new Error(`Sheet ${name} must contain 30 rows`);
    if (JSON.stringify(rows.map((row) => row.decisionId).sort()) !== JSON.stringify(expectedIds)) {
      throw new Error(`Sheet ${name} decision IDs do not match the manifest`);
    }
    if (rows.some((row) => row.cells.some((cell) => cell.trim() !== ""))) {
      throw new Error(`Sheet ${name} contains prefilled labels or metadata`);
    }
  }
  return { ok: true, claim_count: claimIds.size, criteria_count: criterionIds.size, decision_count: decisions.length, blank_independent_sheets: 2 };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await validateBenchmarkPacket();
  console.log(`Benchmark packet valid: ${result.decision_count} decisions; ${result.blank_independent_sheets} blank sheets`);
}
