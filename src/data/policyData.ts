import type { PolicyRecord, StateTile } from "../types";
import canonicalRecords from "../../data/canonical/policy-records.json";

export const stateTiles: StateTile[] = [
  { abbr: "WA", name: "Washington", row: 0, col: 0 },
  { abbr: "ID", name: "Idaho", row: 0, col: 1 },
  { abbr: "MT", name: "Montana", row: 0, col: 2 },
  { abbr: "ND", name: "North Dakota", row: 0, col: 3 },
  { abbr: "MN", name: "Minnesota", row: 0, col: 4 },
  { abbr: "WI", name: "Wisconsin", row: 0, col: 5 },
  { abbr: "MI", name: "Michigan", row: 0, col: 6 },
  { abbr: "NY", name: "New York", row: 0, col: 8 },
  { abbr: "VT", name: "Vermont", row: 0, col: 9 },
  { abbr: "NH", name: "New Hampshire", row: 0, col: 10 },
  { abbr: "ME", name: "Maine", row: 0, col: 11 },
  { abbr: "OR", name: "Oregon", row: 1, col: 0 },
  { abbr: "NV", name: "Nevada", row: 1, col: 1 },
  { abbr: "WY", name: "Wyoming", row: 1, col: 2 },
  { abbr: "SD", name: "South Dakota", row: 1, col: 3 },
  { abbr: "IA", name: "Iowa", row: 1, col: 4 },
  { abbr: "IL", name: "Illinois", row: 1, col: 5 },
  { abbr: "IN", name: "Indiana", row: 1, col: 6 },
  { abbr: "OH", name: "Ohio", row: 1, col: 7 },
  { abbr: "PA", name: "Pennsylvania", row: 1, col: 8 },
  { abbr: "NJ", name: "New Jersey", row: 1, col: 9 },
  { abbr: "CT", name: "Connecticut", row: 1, col: 10 },
  { abbr: "MA", name: "Massachusetts", row: 1, col: 11 },
  { abbr: "CA", name: "California", row: 2, col: 0 },
  { abbr: "UT", name: "Utah", row: 2, col: 1 },
  { abbr: "CO", name: "Colorado", row: 2, col: 2 },
  { abbr: "NE", name: "Nebraska", row: 2, col: 3 },
  { abbr: "MO", name: "Missouri", row: 2, col: 4 },
  { abbr: "KY", name: "Kentucky", row: 2, col: 5 },
  { abbr: "WV", name: "West Virginia", row: 2, col: 6 },
  { abbr: "VA", name: "Virginia", row: 2, col: 7 },
  { abbr: "MD", name: "Maryland", row: 2, col: 8 },
  { abbr: "DE", name: "Delaware", row: 2, col: 9 },
  { abbr: "RI", name: "Rhode Island", row: 2, col: 10 },
  { abbr: "DC", name: "District of Columbia", row: 2, col: 11 },
  { abbr: "AZ", name: "Arizona", row: 3, col: 0 },
  { abbr: "NM", name: "New Mexico", row: 3, col: 1 },
  { abbr: "KS", name: "Kansas", row: 3, col: 2 },
  { abbr: "AR", name: "Arkansas", row: 3, col: 3 },
  { abbr: "TN", name: "Tennessee", row: 3, col: 4 },
  { abbr: "NC", name: "North Carolina", row: 3, col: 5 },
  { abbr: "SC", name: "South Carolina", row: 3, col: 6 },
  { abbr: "OK", name: "Oklahoma", row: 4, col: 2 },
  { abbr: "LA", name: "Louisiana", row: 4, col: 3 },
  { abbr: "MS", name: "Mississippi", row: 4, col: 4 },
  { abbr: "AL", name: "Alabama", row: 4, col: 5 },
  { abbr: "GA", name: "Georgia", row: 4, col: 6 },
  { abbr: "TX", name: "Texas", row: 5, col: 1 },
  { abbr: "FL", name: "Florida", row: 5, col: 7 },
  { abbr: "AK", name: "Alaska", row: 5, col: 10 },
  { abbr: "HI", name: "Hawaii", row: 5, col: 11 }
];

const demoInputs: Record<
  string,
  Omit<
    PolicyRecord,
    | "regionId"
    | "regionName"
    | "stateAbbr"
    | "stateName"
    | "regionType"
    | "year"
    | "policyStrength"
    | "sourceDocuments"
    | "evidenceSpans"
  >
> = {
  AL: {
    snapshotStatus: "coded",
    aiUseAllowed: 1,
    assessmentPolicy: 1,
    privacyPolicy: 2,
    teacherPdSupport: 1,
    implementationStage: 2,
    policyClarity: "moderate",
    policyOrientation: "compliance-led",
    approvedTools: ["District-approved pilots only"],
    notes:
      "Provisional synthesized profile. This state record is displayed from a limited evidence base and should be treated as a placeholder until an official statewide source package is fully coded.",
    sourceTitle: "Provisional synthesized policy profile",
    lastUpdated: "2026-04-04",
    confidence: 0.63
  },
  CA: {
    snapshotStatus: "coded",
    aiUseAllowed: 3,
    assessmentPolicy: 3,
    privacyPolicy: 3,
    teacherPdSupport: 3,
    implementationStage: 4,
    policyClarity: "high",
    policyOrientation: "innovation-with-guardrails",
    approvedTools: ["State guidance sandbox", "District-vetted assistants"],
    notes:
      "Provisional synthesized profile. This summary reflects a temporary analytic interpretation of currently available evidence and should be superseded by the canonical coded record when source coverage is complete.",
    sourceTitle: "Provisional synthesized policy profile",
    lastUpdated: "2026-04-04",
    confidence: 0.86
  },
  FL: {
    snapshotStatus: "coded",
    aiUseAllowed: 2,
    assessmentPolicy: 2,
    privacyPolicy: 2,
    teacherPdSupport: 1,
    implementationStage: 2,
    policyClarity: "moderate",
    policyOrientation: "controlled adoption",
    approvedTools: ["District procurement list"],
    notes:
      "Provisional synthesized profile. This summary is based on partial evidence and is intended only as a temporary display layer until official state guidance is fully retrieved and verified.",
    sourceTitle: "Provisional synthesized policy profile",
    lastUpdated: "2026-04-04",
    confidence: 0.69
  },
  GA: {
    snapshotStatus: "coded",
    aiUseAllowed: 2,
    assessmentPolicy: 2,
    privacyPolicy: 2,
    teacherPdSupport: 2,
    implementationStage: 2,
    policyClarity: "moderate",
    policyOrientation: "local-capacity building",
    approvedTools: ["Teacher productivity tools", "District AI pilots"],
    notes:
      "Provisional synthesized profile. This state description reflects a working estimate from incomplete source coverage and should not be interpreted as a final coded judgment.",
    sourceTitle: "Provisional synthesized policy profile",
    lastUpdated: "2026-04-04",
    confidence: 0.66
  },
  IL: {
    snapshotStatus: "coded",
    aiUseAllowed: 2,
    assessmentPolicy: 3,
    privacyPolicy: 2,
    teacherPdSupport: 2,
    implementationStage: 3,
    policyClarity: "high",
    policyOrientation: "assessment redesign",
    approvedTools: ["Disclosure-first classroom use"],
    notes:
      "Provisional synthesized profile. This state description reflects a working estimate from incomplete source coverage and remains subject to revision after formal document retrieval and verification.",
    sourceTitle: "Provisional synthesized policy profile",
    lastUpdated: "2026-04-04",
    confidence: 0.74
  },
  NC: {
    snapshotStatus: "coded",
    aiUseAllowed: 2,
    assessmentPolicy: 2,
    privacyPolicy: 3,
    teacherPdSupport: 2,
    implementationStage: 3,
    policyClarity: "high",
    policyOrientation: "data-governance aware",
    approvedTools: ["Privacy-reviewed vendors"],
    notes:
      "Provisional synthesized profile. This summary should be read as an interim synthesis of available evidence rather than a final approved state coding decision.",
    sourceTitle: "Provisional synthesized policy profile",
    lastUpdated: "2026-04-04",
    confidence: 0.77
  },
  NY: {
    snapshotStatus: "coded",
    aiUseAllowed: 2,
    assessmentPolicy: 3,
    privacyPolicy: 3,
    teacherPdSupport: 2,
    implementationStage: 3,
    policyClarity: "high",
    policyOrientation: "guardrails plus redesign",
    approvedTools: ["Approved instructional copilots"],
    notes:
      "Provisional synthesized profile. This summary is an evidence-limited interim view and should be replaced once the official source set is fully collected, coded, and routed.",
    sourceTitle: "Provisional synthesized policy profile",
    lastUpdated: "2026-04-04",
    confidence: 0.78
  },
  TX: {
    snapshotStatus: "coded",
    aiUseAllowed: 2,
    assessmentPolicy: 1,
    privacyPolicy: 2,
    teacherPdSupport: 1,
    implementationStage: 2,
    policyClarity: "moderate",
    policyOrientation: "district autonomy",
    approvedTools: ["Local procurement pathways"],
    notes:
      "Provisional synthesized profile. This state record is shown from incomplete evidence and remains particularly sensitive to missing statewide or district-level source material.",
    sourceTitle: "Provisional synthesized policy profile",
    lastUpdated: "2026-04-04",
    confidence: 0.68
  },
  UT: {
    snapshotStatus: "coded",
    aiUseAllowed: 3,
    assessmentPolicy: 2,
    privacyPolicy: 2,
    teacherPdSupport: 3,
    implementationStage: 3,
    policyClarity: "high",
    policyOrientation: "rapid experimentation",
    approvedTools: ["Teacher-facing copilots", "Sandbox classroom tools"],
    notes:
      "Provisional synthesized profile. This summary reflects a temporary interpretation of currently available materials and should be updated when the full official source package is validated.",
    sourceTitle: "Provisional synthesized policy profile",
    lastUpdated: "2026-04-04",
    confidence: 0.76
  },
  WA: {
    snapshotStatus: "coded",
    aiUseAllowed: 3,
    assessmentPolicy: 2,
    privacyPolicy: 3,
    teacherPdSupport: 3,
    implementationStage: 3,
    policyClarity: "high",
    policyOrientation: "responsible innovation",
    approvedTools: ["Procurement-reviewed AI suite"],
    notes:
      "Provisional synthesized profile. This summary is presented as an interim evidence-based estimate and should not be treated as a final canonical coding output.",
    sourceTitle: "Provisional synthesized policy profile",
    lastUpdated: "2026-04-04",
    confidence: 0.81
  }
};

function computePolicyStrength(
  record: Pick<
    PolicyRecord,
    | "aiUseAllowed"
    | "assessmentPolicy"
    | "privacyPolicy"
    | "teacherPdSupport"
    | "implementationStage"
  >
): number {
  return (
    record.aiUseAllowed +
    record.assessmentPolicy +
    record.privacyPolicy +
    record.teacherPdSupport +
    record.implementationStage
  );
}

function makePendingRecord(tile: StateTile): PolicyRecord {
  return {
    regionId: tile.abbr,
    regionName: tile.name,
    stateAbbr: tile.abbr,
    stateName: tile.name,
    regionType: "state",
    year: 2026,
    snapshotStatus: "queued",
    aiUseAllowed: 0,
    assessmentPolicy: 0,
    privacyPolicy: 0,
    teacherPdSupport: 0,
    implementationStage: 0,
    policyStrength: 0,
    policyClarity: "low",
    policyOrientation: "not coded yet",
    approvedTools: [],
    notes:
      "No coded snapshot yet. This state remains outside the current verified source set and will update after the next official policy retrieval and coding pass.",
    sourceTitle: "Pending verified source package",
    sourceDocuments: [],
    lastUpdated: "2026-04-04",
    confidence: 0.1,
    evidenceSpans: []
  };
}

export const policyRecords: PolicyRecord[] = stateTiles.map((tile) => {
  const canonicalMatch = (canonicalRecords as Array<any>).find(
    (record) => record.state_abbr === tile.abbr
  );

  if (canonicalMatch) {
    const aiUseAllowed = canonicalMatch.ai_use_allowed ?? 0;
    const assessmentPolicy = canonicalMatch.assessment_policy ?? 0;
    const privacyPolicy = canonicalMatch.privacy_policy ?? 0;
    const teacherPdSupport = canonicalMatch.teacher_pd_support ?? 0;
    const implementationStage = canonicalMatch.implementation_stage ?? 0;
    const policyStrength = computePolicyStrength({
      aiUseAllowed,
      assessmentPolicy,
      privacyPolicy,
      teacherPdSupport,
      implementationStage
    });

    return {
      regionId: tile.abbr,
      regionName: tile.name,
      stateAbbr: tile.abbr,
      stateName: tile.name,
      regionType: "state",
      year: canonicalMatch.year ?? 2026,
      snapshotStatus:
        canonicalMatch.extraction_status === "draft_extracted" ||
        canonicalMatch.extraction_status === "validated"
          ? "coded"
          : "queued",
      aiUseAllowed,
      assessmentPolicy,
      privacyPolicy,
      teacherPdSupport,
      implementationStage,
      policyStrength,
      policyClarity:
        canonicalMatch.confidence == null
          ? "low"
          : canonicalMatch.confidence >= 0.8
            ? "high"
            : "moderate",
      policyOrientation: canonicalMatch.policy_orientation ?? "unclear",
      approvedTools: [],
      notes: canonicalMatch.notes ?? "Canonical record imported from extraction pipeline.",
      sourceTitle:
        canonicalMatch.source_documents?.[0]?.title ??
        canonicalMatch.source_documents?.[0]?.url ??
        "Canonical pipeline record",
      sourceUrl: canonicalMatch.source_documents?.[0]?.url,
      sourceDocuments: (canonicalMatch.source_documents ?? []).map((doc: any) => ({
        url: doc.url,
        title: doc.title ?? null,
        rawFile: doc.raw_file ?? null,
        publishedDateGuess: doc.published_date_guess ?? null,
        documentId: doc.document_id ?? undefined,
        issuerName: doc.issuer_name ?? undefined,
        issuerLevel: doc.issuer_level ?? undefined,
        instrumentType: doc.instrument_type ?? undefined,
        issuedDate: doc.issued_date ?? undefined,
        effectiveDate: doc.effective_date ?? undefined,
        status: doc.status ?? undefined,
        shortSummary: doc.short_summary ?? undefined,
        relations: Array.isArray(doc.relations)
          ? doc.relations.map((rel: any) => ({
              kind: rel.kind,
              targetDocumentId: rel.target_document_id,
              note: rel.note ?? undefined
            }))
          : undefined
      })),
      sourceAuthority: canonicalMatch.source_authority ?? undefined,
      approvalRoute: canonicalMatch.approval_route ?? undefined,
      auditStatus: canonicalMatch.audit_status ?? undefined,
      policyDomains: canonicalMatch.policy_domains ?? [],
      verificationNotes: canonicalMatch.verification_notes ?? undefined,
      routingReasons: canonicalMatch.routing_reasons ?? [],
      deepResearchRecommended: canonicalMatch.deep_research_recommended ?? undefined,
      deepResearchReasons: canonicalMatch.deep_research_reasons ?? [],
      lastUpdated: canonicalMatch.updated_at?.slice(0, 10) ?? "2026-04-04",
      confidence: canonicalMatch.confidence ?? 0.1,
      evidenceSpans: canonicalMatch.evidence_spans ?? [],
      teacherGuidance: canonicalMatch.teacher_guidance
        ? {
            summary: canonicalMatch.teacher_guidance.summary ?? "",
            allowedUses: canonicalMatch.teacher_guidance.allowed_uses ?? [],
            prohibitedUses: canonicalMatch.teacher_guidance.prohibited_uses ?? [],
            ageRestrictions: (canonicalMatch.teacher_guidance.age_restrictions ?? []).map((r: any) => ({
              category: r.category,
              description: r.description,
              sourceQuote: r.source_quote ?? undefined,
              sourceUrl: r.source_url ?? undefined
            })),
            usageRestrictions: (canonicalMatch.teacher_guidance.usage_restrictions ?? []).map((r: any) => ({
              category: r.category,
              description: r.description,
              sourceQuote: r.source_quote ?? undefined,
              sourceUrl: r.source_url ?? undefined
            })),
            contactResource: canonicalMatch.teacher_guidance.contact_resource ?? undefined,
            lastReviewed: canonicalMatch.teacher_guidance.last_reviewed ?? undefined,
            gradeBandRules: Array.isArray(canonicalMatch.teacher_guidance.grade_band_rules)
              ? canonicalMatch.teacher_guidance.grade_band_rules.map((g: any) => ({
                  band: g.band,
                  stance: g.stance,
                  note: g.note ?? undefined
                }))
              : undefined,
            studentDisclosureRequired:
              canonicalMatch.teacher_guidance.student_disclosure_required ?? undefined,
            studentDisclosureFormat:
              canonicalMatch.teacher_guidance.student_disclosure_format ?? undefined,
            parentalConsentRequired:
              canonicalMatch.teacher_guidance.parental_consent_required ?? undefined,
            parentalConsentThreshold:
              canonicalMatch.teacher_guidance.parental_consent_threshold ?? undefined,
            dataProhibitions: canonicalMatch.teacher_guidance.data_prohibitions ?? undefined,
            teacherGradingAllowed:
              canonicalMatch.teacher_guidance.teacher_grading_allowed ?? undefined,
            teacherFeedbackDraftAllowed:
              canonicalMatch.teacher_guidance.teacher_feedback_draft_allowed ?? undefined,
            priorTrainingRequired:
              canonicalMatch.teacher_guidance.prior_training_required ?? undefined,
            trainingProvider: canonicalMatch.teacher_guidance.training_provider ?? undefined,
            assessmentUseRule: canonicalMatch.teacher_guidance.assessment_use_rule ?? undefined,
            syllabusStatementTemplate:
              canonicalMatch.teacher_guidance.syllabus_statement_template ?? undefined,
            teacherActionItems: canonicalMatch.teacher_guidance.teacher_action_items ?? undefined
          }
        : undefined
    };
  }

  const demoRecord = demoInputs[tile.abbr];

  if (!demoRecord) {
    return makePendingRecord(tile);
  }

  return {
    regionId: tile.abbr,
    regionName: tile.name,
    stateAbbr: tile.abbr,
    stateName: tile.name,
    regionType: "state",
    year: 2026,
    ...demoRecord,
    sourceDocuments: [],
    sourceAuthority: undefined,
    approvalRoute: undefined,
    auditStatus: undefined,
    policyDomains: [],
    verificationNotes: undefined,
    routingReasons: [],
    deepResearchRecommended: undefined,
    deepResearchReasons: [],
    policyStrength: computePolicyStrength(demoRecord),
    evidenceSpans: []
  };
});

export function getPolicyStrengthBand(strength: number): string {
  if (strength >= 13) return "high";
  if (strength >= 8) return "emerging";
  if (strength >= 1) return "minimal";
  return "uncoded";
}

export function getStrengthColor(
  strength: number,
  snapshotStatus: PolicyRecord["snapshotStatus"]
): string {
  if (snapshotStatus === "queued") return "var(--tile-queued)";
  if (strength >= 13) return "var(--tile-high)";
  if (strength >= 8) return "var(--tile-mid)";
  return "var(--tile-low)";
}

export function formatScoreLabel(record: PolicyRecord): string {
  return `${record.policyStrength}/16`;
}

export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

export function getPolicyStageLabel(stage: number): string {
  if (stage >= 4) return "Operationalized";
  if (stage >= 3) return "Released guidance";
  if (stage >= 2) return "Framework stage";
  if (stage >= 1) return "Early signal";
  return "Not coded";
}

export function getPriorityDomains(record: PolicyRecord): string[] {
  return [
    { label: "AI Use", value: record.aiUseAllowed },
    { label: "Assessment", value: record.assessmentPolicy },
    { label: "Privacy", value: record.privacyPolicy },
    { label: "Teacher PD", value: record.teacherPdSupport }
  ]
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, 2)
    .map((item) => item.label);
}

export const scoringLabels: Record<number, string> = {
  0: "No coded evidence yet",
  1: "Light mention",
  2: "Moderate guidance",
  3: "Strong formal guidance",
  4: "Full operational system"
};
