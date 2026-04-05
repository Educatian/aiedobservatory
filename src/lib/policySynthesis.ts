import { synthesisCalibration } from "../config/synthesisCalibration";
import { getPolicyStageLabel, getPriorityDomains } from "../data/policyData";
import type { PolicyRecord } from "../types";

type RobustnessBand = "strong" | "moderate" | "limited";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getAuthorityWeight(record: PolicyRecord) {
  if (!record.sourceAuthority) return 0.45;
  return synthesisCalibration.authorityWeights[record.sourceAuthority] ?? 0.45;
}

function getRouteWeight(record: PolicyRecord) {
  if (!record.approvalRoute) return synthesisCalibration.routeWeights.unrouted;
  return synthesisCalibration.routeWeights[record.approvalRoute] ?? synthesisCalibration.routeWeights.unrouted;
}

export function getRobustnessScore(record: PolicyRecord): number {
  const confidenceComponent =
    clamp(record.confidence, 0, 1) * synthesisCalibration.weights.confidence;
  const evidenceComponent =
    (Math.min(record.evidenceSpans.length, 5) / 5) * synthesisCalibration.weights.evidenceSpanCoverage;
  const sourceComponent =
    (Math.min(record.sourceDocuments.length, 4) / 4) * synthesisCalibration.weights.sourceDocumentCoverage;
  const authorityComponent =
    getAuthorityWeight(record) * synthesisCalibration.weights.sourceAuthority;
  const routeComponent = getRouteWeight(record) * synthesisCalibration.weights.approvalRoute;
  const auditBonus = record.auditStatus === "completed" ? synthesisCalibration.auditBonus : 0;

  return clamp(
    confidenceComponent + evidenceComponent + sourceComponent + authorityComponent + routeComponent + auditBonus,
    0,
    1
  );
}

export function getRobustnessBand(record: PolicyRecord): RobustnessBand {
  const score = getRobustnessScore(record);
  if (score >= synthesisCalibration.thresholds.strong) return "strong";
  if (score >= synthesisCalibration.thresholds.moderate) return "moderate";
  return "limited";
}

export function getRobustnessLabel(record: PolicyRecord): string {
  const band = getRobustnessBand(record);
  if (band === "strong") return "Strong evidence base";
  if (band === "moderate") return "Moderate evidence base";
  return "Limited evidence base";
}

function getStagePattern(records: PolicyRecord[]) {
  const stageValues = records.map((record) => record.implementationStage);
  const maxStage = Math.max(...stageValues);
  const minStage = Math.min(...stageValues);
  const operationalCount = records.filter((record) => record.implementationStage >= 3).length;
  const earlyCount = records.filter((record) => record.implementationStage <= 2).length;

  let summary = "";
  if (operationalCount >= Math.ceil(records.length / 2)) {
    summary = "Most selected states are at or beyond an operational guidance stage.";
  } else if (earlyCount >= Math.ceil(records.length / 2)) {
    summary = "Most selected states still cluster in early or transitional guidance stages.";
  } else {
    summary = "The selected states are split between early and operational stages.";
  }

  if (maxStage - minStage >= 2) {
    summary += " Stage spread remains wide enough that direct comparison should be treated as uneven rather than linear.";
  }

  return summary;
}

function getWeightedDomain(records: PolicyRecord[]) {
  const weightedCounts = new Map<string, number>();
  records.forEach((record) => {
    const weight = getRobustnessScore(record);
    getPriorityDomains(record).forEach((domain) => {
      weightedCounts.set(domain, (weightedCounts.get(domain) ?? 0) + weight);
    });
  });

  return [...weightedCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? "teacher_pd";
}

function formatDomain(domain: string) {
  return domain.replace(/_/g, " ");
}

export function buildStructuredSynthesis(records: PolicyRecord[]): string {
  if (records.length === 0) return "";

  const leader = [...records].sort((left, right) => right.policyStrength - left.policyStrength)[0];
  const lagger = [...records].sort((left, right) => left.policyStrength - right.policyStrength)[0];
  const moderateOrBetter = records.filter((record) => getRobustnessBand(record) !== "limited").length;

  return `Across ${records.length} compared states, ${leader.stateName} currently leads on policy strength (${leader.policyStrength}/16), while ${lagger.stateName} remains the least developed case in this set. This comparison is anchored by ${moderateOrBetter} record(s) with moderate or strong evidence support.`;
}

export function buildConfirmedPattern(records: PolicyRecord[]): string {
  if (records.length === 0) return "";

  const dominantDomain = formatDomain(getWeightedDomain(records));
  const stagePattern = getStagePattern(records);

  return `Within the current comparison set, ${dominantDomain} is the most consistently represented policy domain once evidence robustness is taken into account. ${stagePattern}`;
}

export function buildConfirmedEvidenceNote(records: PolicyRecord[]): string {
  if (records.length === 0) return "";

  const strongest = [...records].sort((left, right) => getRobustnessScore(right) - getRobustnessScore(left))[0];
  const strongCount = records.filter((record) => getRobustnessBand(record) === "strong").length;
  const moderateCount = records.filter((record) => getRobustnessBand(record) === "moderate").length;

  return `${strongest.stateName} is the most robust benchmark in this comparison set. Overall, ${strongCount} record(s) are strong and ${moderateCount} record(s) are moderate on evidence quality, source authority, and routing status.`;
}

export function buildProvisionalInterpretation(records: PolicyRecord[]): string {
  if (records.length === 0) return "";

  const dominantDomain = formatDomain(getWeightedDomain(records));
  const operationalCount = records.filter((record) => record.implementationStage >= 3).length;
  const dominantInterpretation =
    operationalCount >= Math.ceil(records.length / 2)
      ? "This may indicate that the selected states are beginning to translate guidance into implementation structures."
      : "This may indicate that the selected states are still stabilizing early governance signals rather than institutionalized implementation.";

  return `Taken together, the comparison suggests that ${dominantDomain} is currently the clearest shared policy anchor. ${dominantInterpretation}`;
}

export function buildInterpretiveBoundary(records: PolicyRecord[]): string {
  if (records.length === 0) return "";

  const mostUncertain = [...records].sort((left, right) => getRobustnessScore(left) - getRobustnessScore(right))[0];

  return `${mostUncertain.stateName} remains the weakest-evidence case in this set, so any cross-state reading should treat it as a provisional policy signal rather than a final statewide reference point.`;
}

export function buildExecutiveEvidenceStatement(record: PolicyRecord): string {
  const band = getRobustnessBand(record);
  const bandText =
    band === "strong" ? "strong" : band === "moderate" ? "moderate" : "limited";

  return `${record.stateName} is currently coded as ${getPolicyStageLabel(record.implementationStage).toLowerCase()} with ${bandText} evidence support, based on ${record.sourceDocuments.length} source document(s), ${record.evidenceSpans.length} evidence span(s), and ${Math.round(record.confidence * 100)}% confidence.`;
}

export function buildExecutiveInterpretation(record: PolicyRecord, benchmarkRecords?: PolicyRecord[]): string {
  const strongerPeers = benchmarkRecords?.filter((peer) => peer.policyStrength > record.policyStrength).length ?? 0;
  const benchmarkText =
    strongerPeers === 0
      ? "It currently sits at the top of the attached benchmark set."
      : `${strongerPeers} peer record(s) in the current benchmark set score higher on policy strength.`;
  const boundaryText =
    getRobustnessBand(record) === "limited"
      ? "This should be read as a provisional implementation signal."
      : "This can be used as a comparative benchmark, but not as a legal determination.";

  return `${benchmarkText} ${boundaryText}`;
}
