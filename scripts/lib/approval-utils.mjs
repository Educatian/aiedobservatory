import { readFile } from "node:fs/promises";
import path from "node:path";

const SOURCE_AUTHORITY_ORDER = {
  unknown: 0,
  secondary_reporting: 1,
  official_press_release: 2,
  official_model_policy: 3,
  official_guidance: 4,
  binding_law_or_regulation: 5
};

const STRONG_PRIMARY_LEVELS = new Set([
  "binding_law_or_regulation",
  "official_guidance",
  "official_model_policy"
]);

const FORBIDDEN_AUTO_APPROVE_LEVELS = new Set(["secondary_reporting", "official_press_release"]);

const SCORED_FIELDS = [
  "ai_use_allowed",
  "assessment_policy",
  "privacy_policy",
  "teacher_pd_support",
  "implementation_stage"
];

function lower(value) {
  return String(value ?? "").toLowerCase();
}

function looksOfficialUrl(url) {
  return (
    url.startsWith("local://") ||
    /\.gov\b/.test(url) ||
    /\.edu\b/.test(url) ||
    /\bwvde\.us\b/.test(url) ||
    /\.state\.[a-z]{2}\.us\b/.test(url) ||
    /\.k12\.[a-z.]+\b/.test(url) ||
    /schools\.[a-z.]+\b/.test(url)
  );
}

export function classifySourceDocument(source) {
  const text = `${lower(source?.title)} ${lower(source?.url)}`;
  const official = looksOfficialUrl(String(source?.url ?? ""));

  if (text.includes("local://")) {
    return "official_model_policy";
  }

  if (/(statute|bill|act|regulation|administrative code|rule\b|senate bill|house bill)/.test(text)) {
    return official ? "binding_law_or_regulation" : "secondary_reporting";
  }

  if (
    /(model policy|framework|implementation recommendations|recommendations and considerations|roadmap)/.test(
      text
    )
  ) {
    return official ? "official_model_policy" : "secondary_reporting";
  }

  if (/(guidance|department guidance|artificial intelligence\b)/.test(text)) {
    return official ? "official_guidance" : "secondary_reporting";
  }

  if (/(press release|news release|news-center|news-releases|\/news\/)/.test(text)) {
    return official ? "official_press_release" : "secondary_reporting";
  }

  if (official) {
    return "official_guidance";
  }

  return "secondary_reporting";
}

export function inferSourceAuthority(record) {
  const classified = (record.source_documents ?? []).map(classifySourceDocument);
  if (classified.length === 0) {
    return "unknown";
  }

  return classified.sort(
    (left, right) => SOURCE_AUTHORITY_ORDER[right] - SOURCE_AUTHORITY_ORDER[left]
  )[0];
}

function getEvidenceFields(record) {
  return new Set((record.evidence_spans ?? []).map((span) => span.field).filter(Boolean));
}

function getScoredFields(record) {
  return SCORED_FIELDS.filter((field) => Number(record[field] ?? 0) > 0);
}

function hasEvidenceForAllScoredFields(record) {
  const scored = getScoredFields(record);
  const covered = getEvidenceFields(record);
  return scored.every((field) => covered.has(field));
}

function hasEvidenceForCoreFields(record) {
  const coreFields = getScoredFields(record);
  if (coreFields.length === 0) return false;
  const covered = getEvidenceFields(record);
  return coreFields.filter((field) => covered.has(field)).length >= Math.max(coreFields.length - 1, 1);
}

function inferManualReview(record) {
  const notes = lower(record.verification_notes);
  return record.audit_status === "completed" || notes.includes("human review");
}

function hasUnresolvedConflict(record) {
  const notes = lower(record.verification_notes);
  return (
    record.verification_status === "needs_review" ||
    record.review_status === "needs_revision" ||
    notes.includes("conflict") ||
    notes.includes("weak grounding") ||
    notes.includes("unsupported")
  );
}

export function evaluateApproval(record, approvalPolicy) {
  const confidence = typeof record.confidence === "number" ? record.confidence : null;
  const sourceAuthority = inferSourceAuthority(record);
  const strongPrimary = STRONG_PRIMARY_LEVELS.has(sourceAuthority);
  const evidenceForAllScoredFields = hasEvidenceForAllScoredFields(record);
  const evidenceForCoreFields = hasEvidenceForCoreFields(record);
  const unresolvedConflict = hasUnresolvedConflict(record);
  const manualReview = inferManualReview(record);
  const reasons = [];
  const deepResearchReasons = [];

  if (confidence == null) {
    reasons.push("confidence_missing");
  }
  if (!strongPrimary) {
    reasons.push("weak_source_authority");
    deepResearchReasons.push("weak_official_source");
  }
  if (!evidenceForAllScoredFields) {
    reasons.push("missing_citation");
    deepResearchReasons.push("citation_gap");
  }
  if (unresolvedConflict) {
    reasons.push("source_conflict");
    deepResearchReasons.push("source_conflict");
  }
  if (record.extraction_status === "not_extracted") {
    reasons.push("not_extracted");
    deepResearchReasons.push("coverage_gap");
  }

  if (manualReview) {
    return {
      approval_route: "human_review",
      audit_status: "completed",
      source_authority: sourceAuthority,
      routing_reasons: reasons.length > 0 ? reasons : ["manual_review_completed"],
      deep_research_recommended: false,
      deep_research_reasons: []
    };
  }

  const autoPolicy = approvalPolicy.routing_policy.auto_approve;
  const samplePolicy = approvalPolicy.routing_policy.sample_audit;

  const forbiddenAuto =
    autoPolicy.forbidden_source_levels.includes("secondary_reporting_only") &&
    sourceAuthority === "secondary_reporting";
  const forbiddenPress =
    autoPolicy.forbidden_source_levels.includes("press_release_only") &&
    sourceAuthority === "official_press_release";

  if (
    confidence != null &&
    confidence >= autoPolicy.minimum_confidence &&
    strongPrimary &&
    evidenceForAllScoredFields &&
    !unresolvedConflict &&
    !forbiddenAuto &&
    !forbiddenPress
  ) {
    return {
      approval_route: "auto_approve",
      audit_status: "not_required",
      source_authority: sourceAuthority,
      routing_reasons: ["high_confidence", "strong_evidence", "no_conflict"],
      deep_research_recommended: false,
      deep_research_reasons: []
    };
  }

  if (
    confidence != null &&
    confidence >= samplePolicy.minimum_confidence &&
    confidence <= samplePolicy.maximum_confidence &&
    evidenceForCoreFields &&
    !unresolvedConflict
  ) {
    return {
      approval_route: "sample_audit",
      audit_status: "pending_sample",
      source_authority: sourceAuthority,
      routing_reasons: reasons.length > 0 ? reasons : ["mid_confidence_sampling"],
      deep_research_recommended: deepResearchReasons.length > 0,
      deep_research_reasons: [...new Set(deepResearchReasons)]
    };
  }

  return {
    approval_route: "human_review",
    audit_status: "pending_human_review",
    source_authority: sourceAuthority,
    routing_reasons: reasons.length > 0 ? reasons : ["routing_default_human_review"],
    deep_research_recommended: deepResearchReasons.length > 0,
    deep_research_reasons: [...new Set(deepResearchReasons)]
  };
}

export function applyApprovalRouting(record, approvalPolicy) {
  const evaluation = evaluateApproval(record, approvalPolicy);
  record.approval_route = evaluation.approval_route;
  record.audit_status = evaluation.audit_status;
  record.source_authority = evaluation.source_authority;
  record.routing_reasons = evaluation.routing_reasons;
  record.deep_research_recommended = evaluation.deep_research_recommended;
  record.deep_research_reasons = evaluation.deep_research_reasons;

  if (evaluation.approval_route === "auto_approve") {
    record.review_status = "approved";
  } else if (evaluation.approval_route === "sample_audit") {
    record.review_status = "approved";
  } else if (evaluation.audit_status === "completed") {
    if (record.review_status !== "needs_revision") {
      record.review_status = "approved";
    }
  } else if (record.review_status !== "needs_revision") {
    record.review_status = "pending_review";
  }

  return evaluation;
}

export async function loadApprovalPolicy(projectRoot) {
  const policyPath = path.join(projectRoot, "config", "approval-policy.json");
  const raw = await readFile(policyPath, "utf8");
  return JSON.parse(raw);
}
