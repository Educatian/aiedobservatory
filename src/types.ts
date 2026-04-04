export type SnapshotStatus = "coded" | "queued";

export interface EvidenceSpan {
  field: string;
  quote: string;
  sourceUrl: string;
  chunkId?: string | null;
}

export interface SourceDocument {
  url: string;
  title?: string | null;
  rawFile?: string | null;
  publishedDateGuess?: string | null;
}

export interface StateTile {
  abbr: string;
  name: string;
  row: number;
  col: number;
}

export interface PolicyRecord {
  regionId: string;
  regionName: string;
  stateAbbr: string;
  stateName: string;
  regionType: "state";
  year: number;
  snapshotStatus: SnapshotStatus;
  aiUseAllowed: number;
  assessmentPolicy: number;
  privacyPolicy: number;
  teacherPdSupport: number;
  implementationStage: number;
  policyStrength: number;
  policyClarity: "low" | "moderate" | "high";
  policyOrientation: string;
  approvedTools: string[];
  notes: string;
  sourceTitle: string;
  sourceUrl?: string;
  sourceDocuments: SourceDocument[];
  sourceAuthority?: string;
  approvalRoute?: "auto_approve" | "sample_audit" | "human_review";
  auditStatus?: "not_required" | "pending_sample" | "pending_human_review" | "completed";
  policyDomains?: string[];
  verificationNotes?: string;
  routingReasons?: string[];
  deepResearchRecommended?: boolean;
  deepResearchReasons?: string[];
  lastUpdated: string;
  confidence: number;
  evidenceSpans: EvidenceSpan[];
}
