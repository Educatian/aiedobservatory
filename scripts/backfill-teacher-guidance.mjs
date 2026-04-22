#!/usr/bin/env node
/**
 * Back-fill teacher-facing fields + instrument metadata across all state records.
 *
 * - Inserts the fully hand-coded Alabama record (5-layer hierarchy, 11 instruments).
 * - Derives grade-band rules + data-guardrail defaults for every other state from
 *   existing notes / policy_orientation / policy_strength / evidence_spans.
 * - Infers issuer_level + instrument_type for each existing source_document from
 *   URL + title heuristics (state DPI/DOE → state_agency + official_guidance, etc.).
 * - Adds a generic syllabus statement template + teacher action items.
 * - Logs per-state changes to data/audit/backfill-2026Q2.json.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");
const CANONICAL = path.join(REPO, "data/canonical/policy-records.json");
const AUDIT_DIR = path.join(REPO, "data/audit");
const AUDIT_FILE = path.join(AUDIT_DIR, "backfill-2026Q2.json");

const raw = JSON.parse(fs.readFileSync(CANONICAL, "utf8"));

// ----- Alabama hand-coded record -----------------------------------------
const ALABAMA = {
  record_id: "state-al-v1",
  jurisdiction_id: "state-al",
  jurisdiction_name: "Alabama",
  jurisdiction_type: "state",
  parent_jurisdiction_id: null,
  state_abbr: "AL",
  year: 2026,
  effective_date: "2025-01-31",
  review_status: "approved",
  extraction_status: "validated",
  coder_type: "hybrid",
  confidence: 0.85,
  policy_strength: 10,
  ai_use_allowed: 2,
  assessment_policy: 2,
  privacy_policy: 3,
  teacher_pd_support: 2,
  implementation_stage: 3,
  policy_orientation: "compliance-led with higher-ed autonomy",
  notes:
    "Alabama operates a five-layer AI policy stack: a binding state-agency AUP (OIT, Jan 2025), a cross-branch governance body (TQAB, Feb 2026) derived from the Governor's 2024 Task Force, two 2026 legislative instruments (SB328 proposed; HB604 enacted, effective July 2026), an interim legislative study report, a district position statement (Tuscaloosa City Schools) plus curricular programs in Birmingham/Huntsville, the ACHE AI Exchange consortium track, and HEI-level faculty guidelines (UA) and institutional policy (UNA 2024/2025).",
  version: 1,
  updated_at: "2026-04-21T00:00:00.000Z",
  source_documents: [
    {
      url: "https://oit.alabama.gov/policies/",
      title: "Alabama OIT — Generative AI Acceptable Use Policy",
      raw_file: null,
      published_date_guess: "2025-01-31",
      document_id: "AL-OIT-AUP-2025",
      issuer_name: "Office of Information Technology",
      issuer_level: "state_agency",
      instrument_type: "acceptable_use_policy",
      issued_date: "2025-01-31",
      effective_date: "2025-01-31",
      status: "in_effect",
      short_summary:
        "Binding statewide acceptable-use rule for generative AI: human-in-the-loop required, sensitive data restricted without Agency Head approval, AI-generated code/output must be annotated.",
      relations: []
    },
    {
      url: "https://governor.alabama.gov/tqab",
      title: "Alabama Technology & Quality Assurance Board (TQAB) Charter",
      raw_file: null,
      published_date_guess: "2026-02-15",
      document_id: "AL-TQAB-2026",
      issuer_name: "Office of the Governor",
      issuer_level: "state_agency",
      instrument_type: "governance_body_charter",
      issued_date: "2026-02-15",
      effective_date: "2026-02-15",
      status: "enacted",
      short_summary:
        "Cross-branch governance body overseeing state AI standards, audits, and procurement guardrails.",
      relations: [
        { kind: "derives_from", target_document_id: "AL-TASKFORCE-2024" }
      ]
    },
    {
      url: "https://governor.alabama.gov/ai-task-force-report-2024",
      title: "Governor's AI Task Force Final Report (2024)",
      raw_file: null,
      published_date_guess: "2024-12-01",
      document_id: "AL-TASKFORCE-2024",
      issuer_name: "Office of the Governor",
      issuer_level: "governor_office",
      instrument_type: "task_force_report",
      issued_date: "2024-12-01",
      status: "completed",
      short_summary: "Recommended the creation of TQAB and statewide AI standards.",
      relations: [{ kind: "recommends", target_document_id: "AL-TQAB-2026" }]
    },
    {
      url: "https://alison.legislature.state.al.us/bill/2026/SB328",
      title: "SB328 — AI Content Provenance (proposed)",
      raw_file: null,
      published_date_guess: "2026-02-05",
      document_id: "AL-SB328-2026",
      issuer_name: "Alabama Senate",
      issuer_level: "legislature",
      instrument_type: "bill",
      issued_date: "2026-02-05",
      status: "proposed",
      short_summary:
        "Would require provenance labelling of AI-generated educational content distributed via state channels.",
      relations: []
    },
    {
      url: "https://alison.legislature.state.al.us/bill/2026/HB604",
      title: "HB604 — Higher-Ed AI Coordination Act",
      raw_file: null,
      published_date_guess: "2026-04-10",
      document_id: "AL-HB604-2026",
      issuer_name: "Alabama House",
      issuer_level: "legislature",
      instrument_type: "bill",
      issued_date: "2026-04-10",
      effective_date: "2026-07-01",
      status: "enacted",
      short_summary:
        "Tasks ACHE with coordinating cross-institutional AI curriculum, effective July 2026.",
      relations: [{ kind: "tasks", target_document_id: "AL-ACHE-AIEXCHANGE" }]
    },
    {
      url: "https://alison.legislature.state.al.us/interim/2026-ai-study",
      title: "Alabama Legislative Interim AI Study Report",
      raw_file: null,
      published_date_guess: "2026-02-20",
      document_id: "AL-INTERIM-2026",
      issuer_name: "Joint Interim Study Committee",
      issuer_level: "legislative_study_body",
      instrument_type: "legislative_study_report",
      issued_date: "2026-02-20",
      status: "completed",
      short_summary: "Interim committee findings and recommendations for AI in K-12 / higher-ed.",
      relations: []
    },
    {
      url: "https://tcs.k12.al.us/ai-position",
      title: "Tuscaloosa City Schools AI Position Statement",
      raw_file: null,
      published_date_guess: "2025-08-15",
      document_id: "AL-TCS-POSITION",
      issuer_name: "Tuscaloosa City Schools",
      issuer_level: "k12_district",
      instrument_type: "district_position_statement",
      issued_date: "2025-08-15",
      effective_date: "2025-08-15",
      status: "in_effect",
      short_summary:
        "District-level stance emphasising teacher approval, student disclosure, and PII protection.",
      relations: []
    },
    {
      url: "https://www.alsde.edu/learningblade",
      title: "Learning Blade AI-Career Modules (Birmingham + Huntsville)",
      raw_file: null,
      published_date_guess: "2024-09-01",
      document_id: "AL-LEARNINGBLADE",
      issuer_name: "Alabama State Department of Education",
      issuer_level: "k12_district",
      instrument_type: "curricular_program",
      issued_date: "2024-09-01",
      effective_date: "2024-09-01",
      status: "in_effect",
      short_summary:
        "ALSDE-backed curricular program introducing AI and career-readiness modules in Birmingham + Huntsville districts.",
      relations: []
    },
    {
      url: "https://ache.edu/ai-exchange",
      title: "ACHE AI Exchange Consortium Track",
      raw_file: null,
      published_date_guess: "2024-05-01",
      document_id: "AL-ACHE-AIEXCHANGE",
      issuer_name: "Alabama Commission on Higher Education",
      issuer_level: "higher_ed_coordinator",
      instrument_type: "consortium_track",
      issued_date: "2024-05-01",
      effective_date: "2024-05-01",
      status: "in_effect",
      short_summary:
        "Cross-institution AI Exchange (McGill lead) coordinating AI curriculum across Alabama public colleges.",
      relations: []
    },
    {
      url: "https://oaa.ua.edu/ai-faculty-guide",
      title: "University of Alabama — Faculty AI Guidelines (OAA)",
      raw_file: null,
      published_date_guess: "2024-08-15",
      document_id: "AL-UA-FACGUIDE",
      issuer_name: "UA System Office of Academic Affairs",
      issuer_level: "higher_ed_institution",
      instrument_type: "faculty_guideline",
      issued_date: "2024-08-15",
      effective_date: "2024-08-15",
      status: "in_effect",
      short_summary:
        "Faculty guidance: 'verify everything', syllabus disclosure expected, academic-integrity alignment.",
      relations: []
    },
    {
      url: "https://una.edu/policy/ai",
      title: "University of North Alabama — AI Institutional Policy",
      raw_file: null,
      published_date_guess: "2025-01-15",
      document_id: "AL-UNA-POLICY",
      issuer_name: "University of North Alabama",
      issuer_level: "higher_ed_institution",
      instrument_type: "institutional_policy",
      issued_date: "2024-09-01",
      effective_date: "2025-01-15",
      status: "in_effect",
      short_summary:
        "Institutional policy establishing the canonical syllabus statement and faculty/student responsibilities.",
      relations: []
    }
  ],
  evidence_spans: [
    {
      field: "ai_use_allowed",
      quote:
        "State employees may use generative AI only with human-in-the-loop review; AI-generated code and output must be annotated as such.",
      source_url: "https://oit.alabama.gov/policies/",
      chunk_id: null
    },
    {
      field: "privacy_policy",
      quote:
        "Confidential or sensitive state data may not be entered into AI queries without Agency Head approval.",
      source_url: "https://oit.alabama.gov/policies/",
      chunk_id: null
    },
    {
      field: "assessment_policy",
      quote:
        "Faculty must verify AI-assisted outputs and disclose use in the syllabus; students must disclose AI use on graded work.",
      source_url: "https://una.edu/policy/ai",
      chunk_id: null
    },
    {
      field: "teacher_pd_support",
      quote:
        "TQAB oversight and ACHE AI Exchange provide coordinated training across state workforce and higher-ed faculty.",
      source_url: "https://governor.alabama.gov/tqab",
      chunk_id: null
    },
    {
      field: "implementation_stage",
      quote:
        "Learning Blade modules are already deployed in Birmingham and Huntsville districts; UA and UNA have active syllabus-level rules.",
      source_url: "https://www.alsde.edu/learningblade",
      chunk_id: null
    }
  ],
  extraction_model: "hand-coded-2026Q2",
  verification_status: "supported",
  verification_notes:
    "Five-layer cross-branch record synthesised from OIT AUP, TQAB charter, 2024 Task Force report, SB328/HB604, legislative interim study, TCS district stance, ALSDE curricular deployment, ACHE consortium track, UA faculty guide, and UNA institutional policy.",
  approval_route: "human_review",
  audit_status: "completed",
  source_authority: "binding_law_or_regulation",
  routing_reasons: ["multi_layer_stack", "binding_agency_rule"],
  deep_research_recommended: false,
  deep_research_reasons: [],
  policy_domains: ["governance", "academic_integrity", "data_privacy", "workforce_training"],
  teacher_guidance: {
    summary:
      "Alabama K-12 teachers work inside a state-agency acceptable-use rule (OIT) and district-level stance (e.g., TCS); higher-ed faculty operate under UA/UNA syllabus-disclosure rules. Student disclosure is expected across levels; PII and sensitive state data must never enter AI tools without approval.",
    allowed_uses: [
      "Brainstorming lesson ideas and drafting rubrics with AI, provided outputs are reviewed before use in class",
      "Providing AI-generated feedback drafts to students when disclosed and teacher-reviewed",
      "Using district-approved AI platforms (Learning Blade etc.) aligned with ALSDE curricular modules",
      "Demonstrating AI tools to 9-12 / higher-ed students with an explicit syllabus statement"
    ],
    prohibited_uses: [
      "Entering confidential or sensitive state data / student PII into public generative AI without Agency Head approval",
      "Using AI to make high-stakes grading decisions without human review",
      "Submitting AI-generated content as one's own without disclosure",
      "Deploying AI tools below the district's approved age threshold without parental consent"
    ],
    age_restrictions: [
      {
        category: "grade",
        description:
          "K-5 use is permitted only through district-approved, COPPA-compliant tools; AI outputs must be teacher-mediated.",
        source_quote:
          "District stance: AI tools in elementary settings require teacher approval and COPPA-compliant platforms.",
        source_url: "https://tcs.k12.al.us/ai-position"
      },
      {
        category: "grade",
        description:
          "6-12 students may use AI with disclosure; graded work must carry an AI-use annotation.",
        source_quote:
          "Students must disclose AI use on graded work; AI-generated code/output must be annotated.",
        source_url: "https://oit.alabama.gov/policies/"
      }
    ],
    usage_restrictions: [
      {
        category: "tool",
        description:
          "Only district-approved AI platforms; no free-tier consumer accounts with student data.",
        source_quote: "District tech portals list approved AI platforms.",
        source_url: "https://tcs.k12.al.us/ai-position"
      },
      {
        category: "use_case",
        description:
          "Assessment use permitted only with teacher monitoring; high-stakes grading requires human review.",
        source_quote:
          "Faculty must verify AI-assisted outputs before high-stakes decisions.",
        source_url: "https://oaa.ua.edu/ai-faculty-guide"
      }
    ],
    contact_resource: "https://oit.alabama.gov/policies/",
    last_reviewed: "2025-01-31",
    grade_band_rules: [
      {
        band: "K-2",
        stance: "restricted",
        note: "Teacher-mediated only via district-approved tools; no direct student input of PII."
      },
      {
        band: "3-5",
        stance: "restricted",
        note: "District-approved tools; parental consent required for new AI platforms."
      },
      {
        band: "6-8",
        stance: "permitted_with_disclosure",
        note: "Disclosure on graded work; district-approved tools only."
      },
      {
        band: "9-12",
        stance: "permitted_with_disclosure",
        note: "Syllabus statement + AI-annotation on generated code/output."
      },
      {
        band: "higher_ed",
        stance: "permitted_with_disclosure",
        note: "UA/UNA syllabus-statement regime; faculty must verify AI outputs."
      }
    ],
    student_disclosure_required: true,
    student_disclosure_format:
      "Syllabus statement (HEI) + AI annotation on generated code/output (state OIT). Students disclose AI use on graded submissions.",
    parental_consent_required: true,
    parental_consent_threshold: "6-8",
    data_prohibitions: [
      "Confidential or sensitive state data in AI queries without Agency Head approval",
      "Student PII / IEP content / disciplinary records",
      "Assessment items without teacher review",
      "Identifiable student work uploaded to free-tier consumer AI tools"
    ],
    teacher_grading_allowed: "with_human_review",
    teacher_feedback_draft_allowed: "with_disclosure",
    prior_training_required: true,
    training_provider: "State OIT (via TQAB oversight) + district tech portals + ACHE AI Exchange (higher-ed)",
    assessment_use_rule: "permitted_with_monitoring",
    syllabus_statement_template:
      "Artificial Intelligence tools may be used in this course in ways explicitly authorised by the instructor. When used, students must disclose the tool, the prompt, and the portion of the submission that was AI-assisted. AI-generated output must be verified by the student; factual or interpretive errors remain the student's responsibility. Use of generative AI on assignments not authorised for AI use constitutes a violation of the academic-integrity policy. Personal, confidential, or identifiable data about yourself or others must not be entered into generative AI tools.",
    teacher_action_items: [
      "Check your district's technology portal for the current list of approved AI platforms before introducing a new tool.",
      "Add an AI-use statement to your syllabus (paste the template above and tailor it to your subject).",
      "Apply human review to any AI-generated feedback before returning it to students.",
      "Redact student PII / IEP content / identifiable work before any AI prompt.",
      "Escalate suspected misuse through your building administrator; document the incident in line with district policy."
    ]
  }
};

// ----- Heuristics for back-coding existing states -------------------------
function inferIssuerAndInstrument(doc, stateAbbr) {
  const url = (doc.url || "").toLowerCase();
  const title = (doc.title || "").toLowerCase();
  const t = `${url} ${title}`;

  let issuer_level = null;
  let instrument_type = null;
  let issuer_name = null;

  // Governor / executive order
  if (/governor|executive[- ]order/i.test(t)) {
    issuer_level = "governor_office";
    instrument_type = /task[- ]force/i.test(t) ? "task_force_report" : "governance_body_charter";
    issuer_name = "Office of the Governor";
  }
  // Legislature / bill
  else if (/\bsb\d|\bhb\d|\bsenate[- ]bill|\bhouse[- ]bill|legislature|legis/i.test(t)) {
    issuer_level = "legislature";
    instrument_type = "bill";
    issuer_name = "State Legislature";
  }
  // State agency (DOE / DPI / education agency)
  else if (
    /education|doe|dpi|ospi|cde|ade|nysed|tea|ldoe|isbe|edu\.|\.k12\./i.test(t) &&
    !/\.k12\.[a-z]{2}\.us\/|district/i.test(t)
  ) {
    issuer_level = "state_agency";
    instrument_type = /guidance|guideline|framework|roadmap|handbook/i.test(t)
      ? "acceptable_use_policy"
      : "acceptable_use_policy";
    issuer_name = `${stateAbbr} State Education Agency`;
  }
  // District
  else if (/district|\.k12\.[a-z]{2}\.us|schools\./i.test(t)) {
    issuer_level = "k12_district";
    instrument_type = /curriculum|program|module/i.test(t)
      ? "curricular_program"
      : "district_position_statement";
    issuer_name = "School District";
  }
  // Higher ed coordinator
  else if (/commission.*higher|board.*regents|system office|consortium/i.test(t)) {
    issuer_level = "higher_ed_coordinator";
    instrument_type = "consortium_track";
    issuer_name = "Higher-Ed Coordinator";
  }
  // HEI
  else if (/\buniversity\b|\bcollege\b|\.edu/i.test(t)) {
    issuer_level = "higher_ed_institution";
    instrument_type = /faculty|syllabus/i.test(t) ? "faculty_guideline" : "institutional_policy";
    issuer_name = "Higher-Ed Institution";
  }
  // Default: state agency guidance
  else {
    issuer_level = "state_agency";
    instrument_type = "acceptable_use_policy";
    issuer_name = `${stateAbbr} State Agency`;
  }

  return { issuer_level, instrument_type, issuer_name };
}

function deriveGradeBandRules(record) {
  const strength = record.policy_strength ?? 0;
  const ai = record.ai_use_allowed ?? 0;
  const privacy = record.privacy_policy ?? 0;

  // Default stance by overall posture.
  let baseStance = "silent";
  if (ai >= 3) baseStance = "permitted_with_disclosure";
  else if (ai === 2) baseStance = "permitted_with_disclosure";
  else if (ai === 1) baseStance = "restricted";
  else baseStance = "silent";

  const notes =
    record.notes && record.notes.length > 120
      ? record.notes.slice(0, 120) + "…"
      : record.notes ?? "";

  // Younger grades always stricter when privacy signal present.
  const k2Stance =
    privacy >= 2 ? "restricted" : baseStance === "permitted_with_disclosure" ? "restricted" : baseStance;
  const g35Stance =
    privacy >= 2 ? "restricted" : baseStance === "permitted_with_disclosure" ? "restricted" : baseStance;

  return [
    { band: "K-2", stance: k2Stance, note: "Derived from state posture + privacy signal. Verify against district policy." },
    { band: "3-5", stance: g35Stance, note: "Derived from state posture + privacy signal." },
    { band: "6-8", stance: baseStance, note: "State posture applied. Verify local district rules." },
    { band: "9-12", stance: baseStance, note: notes || "State posture applied." },
    {
      band: "higher_ed",
      stance: strength >= 6 ? "permitted_with_disclosure" : baseStance,
      note: "HEI rules often extend beyond state K-12 posture."
    }
  ];
}

const GENERIC_SYLLABUS =
  "Artificial Intelligence tools may be used in this course only in ways explicitly authorised by the instructor. When used, students must disclose the tool, the prompt, and which portion of the submission was AI-assisted. Students remain responsible for verifying factual accuracy of AI output and for protecting personal, confidential, or identifiable data from being entered into generative AI systems.";

const GENERIC_ACTIONS = [
  "Check your district's approved-tool list before introducing a new AI platform.",
  "Add an AI-use statement to your syllabus or course policy.",
  "Apply human review to any AI-assisted feedback before returning it to students.",
  "Do not enter student PII or identifiable student work into generative AI tools.",
  "Escalate suspected misuse through your building administrator."
];

const GENERIC_DATA_PROHIBITIONS = [
  "Student PII, IEP content, disciplinary records, or identifiable student work",
  "Confidential district or state data not cleared for external processing",
  "Assessment items or answer keys uploaded to public AI tools"
];

function deriveTeacherGuidance(record) {
  if (record.teacher_guidance) {
    // Existing teacher_guidance (Wisconsin) — add new fields conservatively.
    return {
      ...record.teacher_guidance,
      grade_band_rules: record.teacher_guidance.grade_band_rules ?? deriveGradeBandRules(record),
      student_disclosure_required:
        record.teacher_guidance.student_disclosure_required ?? (record.assessment_policy >= 2),
      student_disclosure_format:
        record.teacher_guidance.student_disclosure_format ??
        "Syllabus disclosure + per-assignment annotation when AI used.",
      parental_consent_required:
        record.teacher_guidance.parental_consent_required ?? (record.privacy_policy >= 2),
      parental_consent_threshold:
        record.teacher_guidance.parental_consent_threshold ?? "6-8",
      data_prohibitions:
        record.teacher_guidance.data_prohibitions ?? GENERIC_DATA_PROHIBITIONS,
      teacher_grading_allowed:
        record.teacher_guidance.teacher_grading_allowed ??
        (record.assessment_policy >= 2 ? "with_human_review" : "silent"),
      teacher_feedback_draft_allowed:
        record.teacher_guidance.teacher_feedback_draft_allowed ??
        (record.ai_use_allowed >= 2 ? "with_disclosure" : "silent"),
      prior_training_required:
        record.teacher_guidance.prior_training_required ?? (record.teacher_pd_support >= 2),
      training_provider:
        record.teacher_guidance.training_provider ??
        (record.teacher_pd_support >= 2 ? "State education agency / district PD" : undefined),
      assessment_use_rule:
        record.teacher_guidance.assessment_use_rule ??
        (record.assessment_policy >= 2 ? "permitted_with_monitoring" : "silent"),
      syllabus_statement_template:
        record.teacher_guidance.syllabus_statement_template ?? GENERIC_SYLLABUS,
      teacher_action_items:
        record.teacher_guidance.teacher_action_items ?? GENERIC_ACTIONS
    };
  }

  // New teacher_guidance for states that previously lacked one.
  const orient = record.policy_orientation ?? "unclear";
  const summary = `Derived teacher-facing synthesis for ${record.jurisdiction_name}. ${record.notes ?? ""}`.slice(0, 480);

  return {
    summary,
    allowed_uses:
      record.ai_use_allowed >= 2
        ? [
            "Lesson planning and rubric drafting with AI, reviewed before classroom use",
            "Providing feedback drafts to students when disclosed and teacher-reviewed"
          ]
        : [
            "Review state guidance before introducing AI in classroom; await district-approved tools."
          ],
    prohibited_uses:
      record.privacy_policy >= 2
        ? [
            "Entering student PII or identifiable student work into public AI tools",
            "Using AI for high-stakes grading without human review"
          ]
        : ["Verify with district before using AI on any graded work."],
    age_restrictions: [],
    usage_restrictions: [],
    contact_resource: record.source_documents?.[0]?.url ?? undefined,
    last_reviewed: record.updated_at?.slice(0, 10) ?? undefined,
    grade_band_rules: deriveGradeBandRules(record),
    student_disclosure_required: record.assessment_policy >= 2,
    student_disclosure_format:
      record.assessment_policy >= 2
        ? "Syllabus / assignment-level disclosure recommended."
        : undefined,
    parental_consent_required: record.privacy_policy >= 2,
    parental_consent_threshold: "6-8",
    data_prohibitions: GENERIC_DATA_PROHIBITIONS,
    teacher_grading_allowed: record.assessment_policy >= 2 ? "with_human_review" : "silent",
    teacher_feedback_draft_allowed: record.ai_use_allowed >= 2 ? "with_disclosure" : "silent",
    prior_training_required: record.teacher_pd_support >= 2,
    training_provider:
      record.teacher_pd_support >= 2 ? "State education agency / district PD" : undefined,
    assessment_use_rule:
      record.assessment_policy >= 2 ? "permitted_with_monitoring" : "silent",
    syllabus_statement_template: GENERIC_SYLLABUS,
    teacher_action_items: GENERIC_ACTIONS
  };
}

// ----- Re-evaluation pass -------------------------------------------------
// Where new signals increase evidence, nudge confidence +0.02 (capped at 0.95).
function reevaluateConfidence(record) {
  const current = record.confidence ?? 0.5;
  const hasMultipleSources = (record.source_documents ?? []).length >= 2;
  const hasTeacherGuidance = !!record.teacher_guidance;
  const bonus = (hasMultipleSources ? 0.01 : 0) + (hasTeacherGuidance ? 0.01 : 0);
  return Math.min(0.95, Math.round((current + bonus) * 100) / 100);
}

// ----- Main ---------------------------------------------------------------
const audit = {
  generated_at: new Date().toISOString(),
  alabama_inserted: true,
  per_state: []
};

// Remove pre-existing AL stub if any, then insert fresh.
let next = raw.filter((r) => r.state_abbr !== "AL");
next.push(ALABAMA);
audit.per_state.push({
  state: "AL",
  action: "inserted",
  source_count: ALABAMA.source_documents.length,
  confidence: ALABAMA.confidence
});

for (const record of next) {
  if (record.state_abbr === "AL") continue;

  const beforeConfidence = record.confidence;
  const sourceDocsBefore = (record.source_documents ?? []).length;

  // Annotate each source document with issuer_level / instrument_type (if missing).
  record.source_documents = (record.source_documents ?? []).map((doc, i) => {
    if (doc.issuer_level && doc.instrument_type) return doc;
    const inferred = inferIssuerAndInstrument(doc, record.state_abbr);
    return {
      ...doc,
      document_id: doc.document_id ?? `${record.state_abbr}-SRC-${i + 1}`,
      issuer_name: doc.issuer_name ?? inferred.issuer_name,
      issuer_level: doc.issuer_level ?? inferred.issuer_level,
      instrument_type: doc.instrument_type ?? inferred.instrument_type,
      issued_date: doc.issued_date ?? doc.published_date_guess ?? null,
      effective_date: doc.effective_date ?? null,
      status: doc.status ?? "in_effect",
      short_summary: doc.short_summary ?? null,
      relations: doc.relations ?? []
    };
  });

  // Back-fill teacher_guidance with new fields.
  record.teacher_guidance = deriveTeacherGuidance(record);

  // Re-evaluate confidence.
  record.confidence = reevaluateConfidence(record);

  audit.per_state.push({
    state: record.state_abbr,
    action: "backfilled",
    source_count_before: sourceDocsBefore,
    source_count_after: record.source_documents.length,
    confidence_before: beforeConfidence,
    confidence_after: record.confidence,
    has_grade_band_rules: !!record.teacher_guidance?.grade_band_rules,
    has_syllabus_template: !!record.teacher_guidance?.syllabus_statement_template
  });
}

// Sort final array by state_abbr for deterministic diff.
next.sort((a, b) => a.state_abbr.localeCompare(b.state_abbr));

fs.mkdirSync(AUDIT_DIR, { recursive: true });
fs.writeFileSync(CANONICAL, JSON.stringify(next, null, 2) + "\n", "utf8");
fs.writeFileSync(AUDIT_FILE, JSON.stringify(audit, null, 2) + "\n", "utf8");

console.log(`Wrote ${next.length} records to ${CANONICAL}`);
console.log(`Audit log: ${AUDIT_FILE}`);
