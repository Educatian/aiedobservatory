import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const canonicalPath = path.join(projectRoot, "data", "canonical", "policy-records.json");
const goldPath = path.join(projectRoot, "data", "gold-set", "policy-records.gold.json");
const calibrationPath = path.join(projectRoot, "src", "config", "synthesisCalibration.json");
const outputDir = path.join(projectRoot, "data", "evaluation");
const outputPath = path.join(outputDir, "latest-synthesis-calibration.json");

const FIELDS = [
  "ai_use_allowed",
  "assessment_policy",
  "privacy_policy",
  "teacher_pd_support",
  "implementation_stage"
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function rate(hits, total) {
  return total === 0 ? null : Number((hits / total).toFixed(3));
}

function average(items, getter) {
  if (items.length === 0) return null;
  return Number((items.reduce((sum, item) => sum + getter(item), 0) / items.length).toFixed(3));
}

function fieldAverage(items) {
  return Object.fromEntries(
    FIELDS.map((field) => [
      field,
      average(items, (item) => item.field_scores[field] ?? 0)
    ])
  );
}

function getAuthorityWeight(record, calibration) {
  if (!record.source_authority) return 0.45;
  return calibration.authorityWeights[record.source_authority] ?? 0.45;
}

function getRouteWeight(record, calibration) {
  if (!record.approval_route) return calibration.routeWeights.unrouted;
  return calibration.routeWeights[record.approval_route] ?? calibration.routeWeights.unrouted;
}

function getRobustnessScore(record, calibration) {
  const confidenceComponent =
    clamp(Number(record.confidence ?? 0), 0, 1) * calibration.weights.confidence;
  const evidenceComponent =
    (Math.min((record.evidence_spans ?? []).length, 5) / 5) * calibration.weights.evidenceSpanCoverage;
  const sourceComponent =
    (Math.min((record.source_documents ?? []).length, 4) / 4) * calibration.weights.sourceDocumentCoverage;
  const authorityComponent =
    getAuthorityWeight(record, calibration) * calibration.weights.sourceAuthority;
  const routeComponent =
    getRouteWeight(record, calibration) * calibration.weights.approvalRoute;
  const auditBonus =
    record.audit_status === "completed" ? calibration.auditBonus : 0;

  return clamp(
    confidenceComponent + evidenceComponent + sourceComponent + authorityComponent + routeComponent + auditBonus,
    0,
    1
  );
}

function getRobustnessBand(score, calibration) {
  if (score >= calibration.thresholds.strong) return "strong";
  if (score >= calibration.thresholds.moderate) return "moderate";
  return "limited";
}

function makeMap(items) {
  return new Map(items.map((item) => [item.jurisdiction_id, item]));
}

function inferGoldLabelMethod(goldRecord) {
  if (goldRecord.gold_label_method) return goldRecord.gold_label_method;
  if (goldRecord.source_packet) return "packet_backed_review";
  if (String(goldRecord.notes ?? "").toLowerCase().includes("canonical-aligned gold record")) {
    return "canonical_aligned";
  }
  return "independent_review";
}

async function main() {
  const [canonicalRaw, goldRaw, calibrationRaw] = await Promise.all([
    readFile(canonicalPath, "utf8"),
    readFile(goldPath, "utf8"),
    readFile(calibrationPath, "utf8")
  ]);

  const canonical = JSON.parse(canonicalRaw);
  const gold = JSON.parse(goldRaw);
  const calibration = JSON.parse(calibrationRaw);
  const canonicalMap = makeMap(canonical);

  const results = [];

  for (const goldRecord of gold) {
    const predicted = canonicalMap.get(goldRecord.jurisdiction_id);
    if (!predicted) continue;
    const goldLabelMethod = inferGoldLabelMethod(goldRecord);

    const fieldScores = Object.fromEntries(
      FIELDS.map((field) => [field, predicted[field] === goldRecord[field] ? 1 : 0])
    );
    const score = getRobustnessScore(predicted, calibration);
    const band = getRobustnessBand(score, calibration);
    const predictedEvidenceFields = new Set((predicted.evidence_spans ?? []).map((span) => span.field));
    const requiredFields = (goldRecord.required_evidence_fields ?? []).filter(Boolean);
    const citationHits = requiredFields.filter((field) => predictedEvidenceFields.has(field)).length;

    results.push({
      jurisdiction_id: goldRecord.jurisdiction_id,
      state_abbr: goldRecord.state_abbr,
      gold_label_method: goldLabelMethod,
      approval_route: predicted.approval_route ?? null,
      source_authority: predicted.source_authority ?? null,
      confidence: Number(predicted.confidence ?? 0),
      robustness_score: Number(score.toFixed(3)),
      robustness_band: band,
      field_scores: fieldScores,
      field_accuracy: average(
        FIELDS.map((field) => ({ field, score: fieldScores[field] })),
        (item) => item.score
      ),
      stage_match: predicted.implementation_stage === goldRecord.implementation_stage ? 1 : 0,
      domain_match:
        JSON.stringify((predicted.policy_domains ?? []).slice().sort()) ===
        JSON.stringify((goldRecord.policy_domains ?? []).slice().sort())
          ? 1
          : 0,
      citation_support_rate: rate(citationHits, requiredFields.length),
      source_document_count: (predicted.source_documents ?? []).length,
      evidence_span_count: (predicted.evidence_spans ?? []).length
    });
  }

  const independentResults = results.filter((item) => item.gold_label_method !== "canonical_aligned");
  const metricsBase = independentResults.length > 0 ? independentResults : results;

  const grouped = {
    strong: metricsBase.filter((item) => item.robustness_band === "strong"),
    moderate: metricsBase.filter((item) => item.robustness_band === "moderate"),
    limited: metricsBase.filter((item) => item.robustness_band === "limited")
  };

  const summaryByBand = Object.fromEntries(
    Object.entries(grouped).map(([band, items]) => [
      band,
      {
        record_count: items.length,
        avg_robustness_score: average(items, (item) => item.robustness_score),
        field_accuracy: fieldAverage(items),
        avg_field_accuracy: average(items, (item) => item.field_accuracy ?? 0),
        stage_accuracy: average(items, (item) => item.stage_match),
        domain_accuracy: average(items, (item) => item.domain_match),
        citation_support_rate: average(items, (item) => item.citation_support_rate ?? 0),
        avg_source_document_count: average(items, (item) => item.source_document_count),
        avg_evidence_span_count: average(items, (item) => item.evidence_span_count)
      }
    ])
  );

  const orderedBands = ["strong", "moderate", "limited"].filter(
    (band) => summaryByBand[band].record_count > 0
  );
  const monotonicFieldAccuracy = orderedBands.every((band, index) => {
    if (index === orderedBands.length - 1) return true;
    return (
      (summaryByBand[band].avg_field_accuracy ?? 0) >=
      (summaryByBand[orderedBands[index + 1]].avg_field_accuracy ?? 0)
    );
  });

  const summary = {
    generated_at: new Date().toISOString(),
    calibration_source: "src/config/synthesisCalibration.json",
    matched_gold_records: metricsBase.length,
    total_matched_gold_records: results.length,
    metrics_scope: independentResults.length > 0 ? "independent_gold_subset" : "all_gold_records",
    excluded_canonical_aligned_records: results.length - metricsBase.length,
    thresholds: calibration.thresholds,
    weights: calibration.weights,
    summary_by_band: summaryByBand,
    monotonicity_check: {
      ordered_bands_present: orderedBands,
      field_accuracy_descends_with_band_strength: monotonicFieldAccuracy
    },
    recommendations: [
      monotonicFieldAccuracy
        ? "Current robustness ordering is directionally consistent with gold-set field accuracy."
        : "Current robustness ordering is not monotonic; review weights or thresholds.",
      "Use this report together with gold-set growth before changing thresholds.",
      independentResults.length > 0
        ? "Canonical-aligned gold records were excluded from calibration metrics to reduce leakage."
        : "No canonical-aligned gold records were excluded."
    ],
    results
  };

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, JSON.stringify(summary, null, 2), "utf8");
  console.log(`Calibrated synthesis robustness against ${results.length} matched gold records.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
