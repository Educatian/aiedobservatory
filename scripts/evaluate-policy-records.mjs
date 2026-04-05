import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const canonicalPath = path.join(projectRoot, "data", "canonical", "policy-records.json");
const goldPath = path.join(projectRoot, "data", "gold-set", "policy-records.gold.json");
const outputDir = path.join(projectRoot, "data", "evaluation");
const outputPath = path.join(outputDir, "latest-evaluation.json");

const FIELDS = [
  "ai_use_allowed",
  "assessment_policy",
  "privacy_policy",
  "teacher_pd_support",
  "implementation_stage"
];

function makeMap(items) {
  return new Map(items.map((item) => [item.jurisdiction_id, item]));
}

function safeEquals(left, right) {
  return left === right;
}

function rate(hits, total) {
  return total === 0 ? null : Number((hits / total).toFixed(3));
}

function average(items, getter) {
  return items.length === 0
    ? null
    : Number((items.reduce((sum, item) => sum + getter(item), 0) / items.length).toFixed(3));
}

function inferGoldLabelMethod(goldRecord) {
  if (goldRecord.gold_label_method) return goldRecord.gold_label_method;
  if (goldRecord.source_packet) return "packet_backed_review";
  if (String(goldRecord.notes ?? "").toLowerCase().includes("canonical-aligned gold record")) {
    return "canonical_aligned";
  }
  return "independent_review";
}

function summarizeFieldAccuracy(results) {
  return Object.fromEntries(
    FIELDS.map((field) => [field, average(results, (item) => item.field_scores[field] ?? 0)])
  );
}

async function main() {
  const [canonicalRaw, goldRaw] = await Promise.all([
    readFile(canonicalPath, "utf8"),
    readFile(goldPath, "utf8")
  ]);

  const canonical = JSON.parse(canonicalRaw);
  const gold = JSON.parse(goldRaw);
  const canonicalMap = makeMap(canonical);

  const results = [];
  let citationSupportHits = 0;
  let citationSupportTotal = 0;
  let supportedPositiveHits = 0;
  let supportedPositiveTotal = 0;
  let positiveAlignmentHits = 0;
  let positiveAlignmentTotal = 0;

  for (const goldRecord of gold) {
    const predicted = canonicalMap.get(goldRecord.jurisdiction_id);
    if (!predicted) continue;
    const goldLabelMethod = inferGoldLabelMethod(goldRecord);

    const fieldScores = {};
    for (const field of FIELDS) {
      fieldScores[field] = safeEquals(predicted[field], goldRecord[field]) ? 1 : 0;
    }

    const stageMatch = safeEquals(predicted.implementation_stage, goldRecord.implementation_stage) ? 1 : 0;
    const domainMatch = safeEquals(
      JSON.stringify((predicted.policy_domains ?? []).slice().sort()),
      JSON.stringify((goldRecord.policy_domains ?? []).slice().sort())
    )
      ? 1
      : 0;

    const requiredEvidenceFields = new Set((goldRecord.required_evidence_fields ?? []).filter(Boolean));
    const predictedEvidenceFields = new Set((predicted.evidence_spans ?? []).map((span) => span.field));
    const predictedPositiveFields = FIELDS.filter((field) => Number(predicted[field] ?? 0) > 0);

    for (const field of requiredEvidenceFields) {
      citationSupportTotal += 1;
      if (predictedEvidenceFields.has(field)) citationSupportHits += 1;
    }

    for (const field of predictedPositiveFields) {
      supportedPositiveTotal += 1;
      if (predictedEvidenceFields.has(field)) supportedPositiveHits += 1;

      positiveAlignmentTotal += 1;
      if (Number(goldRecord[field] ?? 0) > 0) positiveAlignmentHits += 1;
    }

    results.push({
      jurisdiction_id: goldRecord.jurisdiction_id,
      state_abbr: goldRecord.state_abbr,
      gold_label_method: goldLabelMethod,
      source_packet: goldRecord.source_packet ?? null,
      field_scores: fieldScores,
      stage_match: stageMatch,
      domain_match: domainMatch,
      predicted_approval_route: predicted.approval_route ?? null,
      gold_approval_route: goldRecord.approval_route ?? null,
      approval_route_match: safeEquals(predicted.approval_route, goldRecord.approval_route) ? 1 : 0
    });
  }

  const independentResults = results.filter((item) => item.gold_label_method !== "canonical_aligned");
  const canonicalAlignedResults = results.filter((item) => item.gold_label_method === "canonical_aligned");
  const packetBackedResults = results.filter((item) => item.source_packet);
  const reviewQueueCount = canonical.filter(
    (record) =>
      (record.approval_route === "human_review" && record.audit_status !== "completed") ||
      record.audit_status === "pending_sample" ||
      record.verification_status === "needs_review"
  ).length;
  const routeCounts = canonical.reduce((accumulator, record) => {
    const route = record.approval_route ?? "unrouted";
    accumulator[route] = (accumulator[route] ?? 0) + 1;
    return accumulator;
  }, {});

  const goldMethodDistribution = gold.reduce((accumulator, goldRecord) => {
    const method = inferGoldLabelMethod(goldRecord);
    accumulator[method] = (accumulator[method] ?? 0) + 1;
    return accumulator;
  }, {});

  const metricsBase = independentResults.length > 0 ? independentResults : results;
  const metricsScope =
    independentResults.length > 0 ? "independent_gold_subset" : "all_gold_records";

  const summary = {
    generated_at: new Date().toISOString(),
    gold_record_count: gold.length,
    matched_record_count: results.length,
    gold_coverage_rate: rate(results.length, gold.length),
    metrics_scope: metricsScope,
    gold_label_method_distribution: goldMethodDistribution,
    field_accuracy: summarizeFieldAccuracy(metricsBase),
    stage_accuracy: average(metricsBase, (item) => item.stage_match),
    domain_accuracy: average(metricsBase, (item) => item.domain_match),
    approval_route_accuracy: average(metricsBase, (item) => item.approval_route_match),
    citation_support_rate:
      metricsBase === results
        ? rate(citationSupportHits, citationSupportTotal)
        : rate(
            metricsBase.reduce((sum, item) => {
              const goldRecord = gold.find((entry) => entry.jurisdiction_id === item.jurisdiction_id);
              const required = (goldRecord?.required_evidence_fields ?? []).length;
              return sum + required;
            }, 0) === 0
              ? 0
              : metricsBase.reduce((sum, item) => {
                  const goldRecord = gold.find((entry) => entry.jurisdiction_id === item.jurisdiction_id);
                  const predicted = canonicalMap.get(item.jurisdiction_id);
                  const required = new Set((goldRecord?.required_evidence_fields ?? []).filter(Boolean));
                  const evidence = new Set((predicted?.evidence_spans ?? []).map((span) => span.field));
                  return sum + [...required].filter((field) => evidence.has(field)).length;
                }, 0),
            metricsBase.reduce((sum, item) => {
              const goldRecord = gold.find((entry) => entry.jurisdiction_id === item.jurisdiction_id);
              return sum + (goldRecord?.required_evidence_fields ?? []).filter(Boolean).length;
            }, 0)
          ),
    missing_required_citation_rate:
      citationSupportTotal === 0 ? null : Number((1 - citationSupportHits / citationSupportTotal).toFixed(3)),
    supported_positive_rate: rate(supportedPositiveHits, supportedPositiveTotal),
    unsupported_positive_rate:
      supportedPositiveTotal === 0
        ? null
        : Number((1 - supportedPositiveHits / supportedPositiveTotal).toFixed(3)),
    positive_field_precision: rate(positiveAlignmentHits, positiveAlignmentTotal),
    review_queue_rate: rate(reviewQueueCount, canonical.length),
    review_queue_count: reviewQueueCount,
    approval_route_distribution: routeCounts,
    deep_research_recommended_rate: rate(
      canonical.filter((record) => record.deep_research_recommended === true).length,
      canonical.length
    ),
    independent_subset: {
      gold_record_count: gold.filter((item) => inferGoldLabelMethod(item) !== "canonical_aligned").length,
      matched_record_count: independentResults.length,
      field_accuracy: summarizeFieldAccuracy(independentResults),
      stage_accuracy: average(independentResults, (item) => item.stage_match),
      domain_accuracy: average(independentResults, (item) => item.domain_match),
      approval_route_accuracy: average(independentResults, (item) => item.approval_route_match)
    },
    canonical_aligned_subset: {
      gold_record_count: gold.filter((item) => inferGoldLabelMethod(item) === "canonical_aligned").length,
      matched_record_count: canonicalAlignedResults.length,
      field_accuracy: summarizeFieldAccuracy(canonicalAlignedResults),
      stage_accuracy: average(canonicalAlignedResults, (item) => item.stage_match),
      domain_accuracy: average(canonicalAlignedResults, (item) => item.domain_match),
      approval_route_accuracy: average(canonicalAlignedResults, (item) => item.approval_route_match)
    },
    packet_backed_subset: {
      gold_record_count: gold.filter((item) => item.source_packet).length,
      matched_record_count: packetBackedResults.length,
      field_accuracy: summarizeFieldAccuracy(packetBackedResults),
      stage_accuracy: average(packetBackedResults, (item) => item.stage_match),
      domain_accuracy: average(packetBackedResults, (item) => item.domain_match),
      approval_route_accuracy: average(packetBackedResults, (item) => item.approval_route_match)
    },
    warnings:
      canonicalAlignedResults.length > 0
        ? [
            "Primary metrics are reported against the independent gold subset.",
            "Canonical-aligned gold records are retained for calibration coverage but should not be used as the sole quality claim."
          ]
        : [],
    results
  };

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, JSON.stringify(summary, null, 2), "utf8");
  console.log(`Evaluated ${results.length} matched records against the gold set.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
