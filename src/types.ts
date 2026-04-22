export type SnapshotStatus = "coded" | "queued";

export type RestrictionCategory = "age" | "grade" | "subject" | "tool" | "use_case";

export interface TeacherRestriction {
  category: RestrictionCategory;
  description: string;
  sourceQuote?: string;
  sourceUrl?: string;
}

export type GradeBand = "K-2" | "3-5" | "6-8" | "9-12" | "higher_ed" | "all_grades";

export type GradeBandStance =
  | "prohibited"
  | "restricted"
  | "permitted_with_disclosure"
  | "permitted"
  | "silent";

export interface GradeBandRule {
  band: GradeBand;
  stance: GradeBandStance;
  note?: string;
}

export type TeacherGradingAllowed = "yes" | "with_human_review" | "no" | "silent";
export type TeacherFeedbackDraftAllowed = "yes" | "with_disclosure" | "no" | "silent";
export type AssessmentUseRule =
  | "prohibited"
  | "permitted_with_monitoring"
  | "permitted"
  | "silent";

export interface TeacherGuidanceInfo {
  summary: string;
  allowedUses: string[];
  prohibitedUses: string[];
  ageRestrictions: TeacherRestriction[];
  usageRestrictions: TeacherRestriction[];
  contactResource?: string;
  lastReviewed?: string;
  // Extended (all optional — backward-compatible) — populated during 2026 Q2 back-code pass.
  gradeBandRules?: GradeBandRule[];
  studentDisclosureRequired?: boolean;
  studentDisclosureFormat?: string;
  parentalConsentRequired?: boolean;
  parentalConsentThreshold?: GradeBand;
  dataProhibitions?: string[];
  teacherGradingAllowed?: TeacherGradingAllowed;
  teacherFeedbackDraftAllowed?: TeacherFeedbackDraftAllowed;
  priorTrainingRequired?: boolean;
  trainingProvider?: string;
  assessmentUseRule?: AssessmentUseRule;
  syllabusStatementTemplate?: string;
  teacherActionItems?: string[];
}

export interface EvidenceSpan {
  field: string;
  quote: string;
  sourceUrl: string;
  chunkId?: string | null;
}

export type IssuerLevel =
  | "governor_office"
  | "state_agency"
  | "legislature"
  | "legislative_study_body"
  | "k12_district"
  | "higher_ed_coordinator"
  | "higher_ed_institution";

export type InstrumentType =
  | "acceptable_use_policy"
  | "governance_body_charter"
  | "task_force_report"
  | "bill"
  | "legislative_study_report"
  | "district_position_statement"
  | "curricular_program"
  | "consortium_track"
  | "faculty_guideline"
  | "institutional_policy";

export type InstrumentStatus =
  | "proposed"
  | "enacted"
  | "in_effect"
  | "superseded"
  | "completed";

export type InstrumentRelationKind =
  | "recommends"
  | "supersedes"
  | "implements"
  | "tasks"
  | "derives_from";

export interface InstrumentRelation {
  kind: InstrumentRelationKind;
  targetDocumentId: string;
  note?: string;
}

export interface SourceDocument {
  url: string;
  title?: string | null;
  rawFile?: string | null;
  publishedDateGuess?: string | null;
  // Extended (all optional) — enables instrument hierarchy + timeline visualisation.
  documentId?: string;
  issuerName?: string;
  issuerLevel?: IssuerLevel;
  instrumentType?: InstrumentType;
  issuedDate?: string;
  effectiveDate?: string;
  status?: InstrumentStatus;
  shortSummary?: string;
  relations?: InstrumentRelation[];
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
  | "stage_changed"
  | "instrument_added"
  | "instrument_status_changed";

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
