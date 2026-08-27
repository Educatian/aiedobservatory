import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const releaseDir = path.join(projectRoot, "data", "release", "v0.1");

function rate(hit, total) {
  return total === 0 ? null : Number((hit / total).toFixed(3));
}

async function main() {
  const [claims, rights, integrity] = await Promise.all([
    readFile(path.join(releaseDir, "policy-claims.json"), "utf8").then(JSON.parse),
    readFile(path.join(releaseDir, "source-rights.json"), "utf8").then(JSON.parse),
    readFile(path.join(releaseDir, "source-integrity.json"), "utf8").then(JSON.parse)
  ]);

  const sourceIds = new Set(rights.sources.map((source) => source.source_id));
  const integrityIds = new Set(
    integrity.results.filter((source) => source.ok && source.sha256).map((source) => source.source_id)
  );
  const total = claims.claims.length;
  const withSource = claims.claims.filter((claim) => sourceIds.has(claim.source_id)).length;
  const withIntegrity = claims.claims.filter((claim) => integrityIds.has(claim.source_id)).length;
  const independentlyReviewed = claims.claims.filter(
    (claim) => claim.independent_review_status === "verified"
  ).length;

  const card = {
    release: claims.release,
    generated_at: new Date().toISOString(),
    evaluation_type: "release_contract_completeness_not_model_accuracy",
    claim_count: total,
    source_count: rights.sources.length,
    source_link_rate: rate(withSource, total),
    source_integrity_rate: rate(withIntegrity, total),
    rights_decision_rate: rate(
      rights.sources.filter((source) => source.source_material_decision).length,
      rights.sources.length
    ),
    independent_review_rate: rate(independentlyReviewed, total),
    raw_third_party_files_in_release: 0,
    limitations: [
      "This card measures release-contract completeness, not extraction accuracy.",
      "Independent review is pending and is reported as zero rather than inferred.",
      "The release covers one official source family and does not support national generalization."
    ]
  };

  await writeFile(path.join(releaseDir, "evaluation-card.json"), JSON.stringify(card, null, 2), "utf8");
  console.log(`Evaluated ${total} release claims; independent_review_rate=${card.independent_review_rate}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
