// Adapter: maps PolicyRecord (DB shape) → DisplayState (design-canvas shape).
// The new view components consume DisplayState so they stay aligned with the
// IBM-Carbon design canvas patterns instead of the legacy purple PolicyDetailPanel
// markup. Keep all derivations here; views should not poke into PolicyRecord directly.

import type { PolicyRecord } from "../types";
import { getPolicyStageLabel, getPriorityDomains } from "../data/policyData";

export type ConfidenceBand = "High" | "Moderate" | "Low";
export type StatusKind = "Released" | "In review" | "Draft" | "Withdrawn";
export type EvidenceBasis = "Strong evidence" | "Moderate evidence" | "Limited evidence" | "Emerging";

export interface DisplayDomain {
  name: string;
  score: number; // 0..4
}

export interface DisplayState {
  code: string;
  name: string;
  strength: number; // 0..16
  sources: number;
  coded: number;
  evidence: number;
  districts: number;
  status: StatusKind;
  confidence: ConfidenceBand;
  confidenceRaw: number; // 0..1
  evidenceBasis: EvidenceBasis;
  domains: DisplayDomain[];
  priorityDomains: string[];
  updated: string;
  leadAgency: string;
  policyOrientation: string;
  approvalRoute?: "auto_approve" | "sample_audit" | "human_review";
  auditStatus?: "not_required" | "pending_sample" | "pending_human_review" | "completed";
  notes: string;
  /** Underlying record retained for components that still need fields not surfaced above. */
  record: PolicyRecord;
}

const DOMAIN_NAMES = ["Governance", "Instruction", "Privacy", "Professional learning"] as const;

function bandConfidence(c: number): ConfidenceBand {
  if (c >= 0.85) return "High";
  if (c >= 0.6) return "Moderate";
  return "Low";
}

function bandEvidence(record: PolicyRecord): EvidenceBasis {
  const spans = record.evidenceSpans?.length ?? 0;
  const docs = record.sourceDocuments?.length ?? 0;
  const c = record.confidence ?? 0;
  if (c >= 0.85 && spans >= 4 && docs >= 2) return "Strong evidence";
  if (c >= 0.7 && spans >= 2) return "Moderate evidence";
  if (spans >= 1) return "Limited evidence";
  return "Emerging";
}

function statusFromRecord(record: PolicyRecord): StatusKind {
  if (record.snapshotStatus === "queued") return "Draft";
  const stage = record.implementationStage ?? 0;
  if (stage >= 3) return "Released";
  if (stage === 2) return "In review";
  return "Draft";
}

function formatUpdated(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function leadAgencyFor(record: PolicyRecord): string {
  return (
    record.sourceAuthority ||
    record.sourceDocuments?.[0]?.issuerName ||
    `${record.stateName} Department of Education`
  );
}

const DISTRICT_COUNTS: Record<string, number> = {
  AL: 137,
  CA: 1037,
  NY: 731,
  TX: 1018,
  WA: 295,
};

export function toDisplayState(record: PolicyRecord): DisplayState {
  const domains: DisplayDomain[] = [
    { name: "Governance", score: record.aiUseAllowed ?? 0 },
    { name: "Instruction", score: record.assessmentPolicy ?? 0 },
    { name: "Privacy", score: record.privacyPolicy ?? 0 },
    { name: "Professional learning", score: record.teacherPdSupport ?? 0 },
  ];
  return {
    code: record.stateAbbr,
    name: record.stateName,
    strength: record.policyStrength ?? 0,
    sources: record.sourceDocuments?.length ?? 0,
    coded: record.evidenceSpans?.length ?? 0,
    evidence: record.evidenceSpans?.length ?? 0,
    districts: DISTRICT_COUNTS[record.stateAbbr] ?? 0,
    status: statusFromRecord(record),
    confidence: bandConfidence(record.confidence ?? 0),
    confidenceRaw: record.confidence ?? 0,
    evidenceBasis: bandEvidence(record),
    domains,
    priorityDomains: getPriorityDomains(record),
    updated: formatUpdated(record.lastUpdated),
    leadAgency: leadAgencyFor(record),
    policyOrientation: record.policyOrientation,
    approvalRoute: record.approvalRoute,
    auditStatus: record.auditStatus,
    notes: record.notes ?? "",
    record,
  };
}

export const POLICY_STAGE_LABEL = getPolicyStageLabel;

export const STRENGTH_BUCKETS = [
  { lo: 0,  hi: 4,  label: "No data",     fill: "var(--aied-strength-no-data)" },
  { lo: 5,  hi: 8,  label: "Emerging",    fill: "var(--aied-strength-emerging)" },
  { lo: 9,  hi: 11, label: "Developing",  fill: "var(--aied-strength-developing)" },
  { lo: 12, hi: 13, label: "Established", fill: "var(--aied-strength-established)" },
  { lo: 14, hi: 16, label: "Robust",      fill: "var(--aied-strength-robust)" },
] as const;

export function fillForStrength(strength: number): string {
  for (const b of STRENGTH_BUCKETS) {
    if (strength >= b.lo && strength <= b.hi) return b.fill;
  }
  return STRENGTH_BUCKETS[0].fill;
}

export function bucketLabelForStrength(strength: number): string {
  for (const b of STRENGTH_BUCKETS) {
    if (strength >= b.lo && strength <= b.hi) return b.label;
  }
  return "No data";
}

export { DOMAIN_NAMES };
