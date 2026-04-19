export type SnapshotStatus = "coded" | "queued";

export type RestrictionCategory = "age" | "grade" | "subject" | "tool" | "use_case";

export interface TeacherRestriction {
  category: RestrictionCategory;
  description: string;
  sourceQuote?: string;
  sourceUrl?: string;
}

export interface TeacherGuidanceInfo {
  summary: string;
  allowedUses: string[];
  prohibitedUses: string[];
  ageRestrictions: TeacherRestriction[];
  usageRestrictions: TeacherRestriction[];
  contactResource?: string;
  lastReviewed?: string;
}

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
  teacherGuidance?: TeacherGuidanceInfo;
}

export type PolicyEventType =
  | "record_created"
  | "record_updated"
  | "source_added"
  | "approval_route_changed"
  | "review_status_changed"
  | "confidence_changed"
  | "stage_changed";

export interface PolicyEvent {
  id: string;
  eventType: PolicyEventType;
  stateAbbr: string;
  stateName: string;
  occurredAt: string;
  title: string;
  description: string;
  sourceUrl?: string | null;
  approvalRoute?: "auto_approve" | "sample_audit" | "human_review" | null;
  confidence?: number | null;
  previousValue?: string | number | null;
  nextValue?: string | number | null;
  changedFields?: string[];
  priority?: number;
}

export interface PipelineStepResult {
  id: string;
  label: string;
  command: string;
  startedAt: string;
  completedAt: string;
  ok: boolean;
  exitCode: number;
  stdout?: string;
  stderr?: string;
}

export interface PipelineRunState {
  workflowId: string;
  cadenceDays: number;
  lastAttemptAt: string | null;
  lastSuccessfulRunAt: string | null;
  lastStatus: "idle" | "running" | "success" | "failed";
  lastTrigger: string | null;
  lastRunId: string | null;
  nextDueAt: string | null;
  stepResults: PipelineStepResult[];
  lastError:
    | {
        stepId: string;
        message: string;
      }
    | null;
}
