import { useState } from "react";
import type { GradeBandRule, GradeBandStance, PolicyRecord, TeacherRestriction } from "../types";

interface TeacherGuidancePanelProps {
  record: PolicyRecord;
}

const BAND_LABELS: Record<string, string> = {
  "K-2": "K–2",
  "3-5": "3–5",
  "6-8": "6–8",
  "9-12": "9–12",
  higher_ed: "Higher Ed",
  all_grades: "All grades"
};

const STANCE_LABELS: Record<GradeBandStance, string> = {
  prohibited: "Prohibited",
  restricted: "Restricted",
  permitted_with_disclosure: "With disclosure",
  permitted: "Permitted",
  silent: "Silent"
};

function GradeBandChip({ rule }: { rule: GradeBandRule }) {
  return (
    <span
      className={`tg-band-chip tg-band-${rule.stance}`}
      title={rule.note ?? `${BAND_LABELS[rule.band] ?? rule.band}: ${STANCE_LABELS[rule.stance]}`}
    >
      <span className="tg-band-chip-band">{BAND_LABELS[rule.band] ?? rule.band}</span>
      <span className="tg-band-chip-stance">{STANCE_LABELS[rule.stance]}</span>
    </span>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  age: "Age limit",
  grade: "Grade level",
  subject: "Subject",
  tool: "Tool restriction",
  use_case: "Use case"
};

function RestrictionCard({ item }: { item: TeacherRestriction }) {
  return (
    <div className="tg-restriction-card">
      <span className="tg-restriction-badge">{CATEGORY_LABELS[item.category] ?? item.category}</span>
      <p className="tg-restriction-desc">{item.description}</p>
      {item.sourceQuote && (
        <blockquote className="tg-restriction-quote">"{item.sourceQuote}"</blockquote>
      )}
      {item.sourceUrl && (
        <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="tg-source-link">
          View source
        </a>
      )}
    </div>
  );
}

export function TeacherGuidancePanel({ record }: TeacherGuidancePanelProps) {
  const g = record.teacherGuidance;
  const [syllabusOpen, setSyllabusOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copySyllabus = async () => {
    if (!g?.syllabusStatementTemplate) return;
    try {
      await navigator.clipboard.writeText(g.syllabusStatementTemplate);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* noop */
    }
  };

  return (
    <aside className="detail-panel teacher-guidance-panel">
      <div className="detail-header">
        <div>
          <div className="section-kicker tg-kicker">Teacher Guide</div>
          <h3>
            {record.stateName} <span>{record.stateAbbr}</span>
          </h3>
        </div>
        <div className="tg-mode-badge">Teacher Mode</div>
      </div>

      {!g ? (
        <div className="tg-unavailable">
          <span className="material-symbols-outlined tg-unavail-icon">policy</span>
          <p>Teacher guidance has not been coded for this state yet.</p>
          <p>
            Age restrictions, usage rules, and classroom guidance will be extracted from official
            policy documents in the next pipeline run.
          </p>
        </div>
      ) : (
        <>
          <div className="detail-block tg-summary-block">
            <p className="tg-summary">{g.summary}</p>
            {g.lastReviewed && (
              <span className="tg-reviewed-date">Policy reviewed: {g.lastReviewed}</span>
            )}
          </div>

          {g.gradeBandRules && g.gradeBandRules.length > 0 && (
            <div className="detail-block">
              <div className="mini-heading tg-section-head">
                <span className="material-symbols-outlined">school</span>
                Grade-Band Stance
              </div>
              <div className="tg-band-row">
                {g.gradeBandRules.map((rule, i) => (
                  <GradeBandChip key={`${rule.band}-${i}`} rule={rule} />
                ))}
              </div>
            </div>
          )}

          {(g.studentDisclosureRequired !== undefined ||
            g.parentalConsentRequired !== undefined) && (
            <div className="detail-block tg-consent-block">
              <div className="mini-heading tg-section-head">
                <span className="material-symbols-outlined">verified_user</span>
                Disclosure &amp; Consent
              </div>
              <div className="tg-consent-row">
                {g.studentDisclosureRequired !== undefined && (
                  <span
                    className={`tg-consent-pill ${
                      g.studentDisclosureRequired ? "tg-consent-yes" : "tg-consent-no"
                    }`}
                  >
                    <span className="material-symbols-outlined">
                      {g.studentDisclosureRequired ? "task_alt" : "do_not_disturb_on"}
                    </span>
                    Student disclosure {g.studentDisclosureRequired ? "required" : "not required"}
                  </span>
                )}
                {g.parentalConsentRequired !== undefined && (
                  <span
                    className={`tg-consent-pill ${
                      g.parentalConsentRequired ? "tg-consent-yes" : "tg-consent-no"
                    }`}
                  >
                    <span className="material-symbols-outlined">
                      {g.parentalConsentRequired ? "family_restroom" : "do_not_disturb_on"}
                    </span>
                    Parental consent {g.parentalConsentRequired ? "required" : "not required"}
                    {g.parentalConsentThreshold && (
                      <em className="tg-consent-threshold">
                        &nbsp;({BAND_LABELS[g.parentalConsentThreshold] ?? g.parentalConsentThreshold}
                        &nbsp;&amp; below)
                      </em>
                    )}
                  </span>
                )}
              </div>
              {g.studentDisclosureFormat && (
                <p className="tg-consent-format">{g.studentDisclosureFormat}</p>
              )}
            </div>
          )}

          {g.dataProhibitions && g.dataProhibitions.length > 0 && (
            <div className="detail-block tg-data-guardrails">
              <div className="mini-heading tg-section-head tg-prohibited-head">
                <span className="material-symbols-outlined">shield</span>
                Data Guardrails — Never Input to AI
              </div>
              <ul className="tg-list tg-list-guardrails">
                {g.dataProhibitions.map((item, i) => (
                  <li key={i}>
                    <span className="material-symbols-outlined tg-list-icon">warning</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(g.assessmentUseRule || g.teacherGradingAllowed || g.teacherFeedbackDraftAllowed) && (
            <div className="detail-block tg-classroom-rules">
              <div className="mini-heading tg-section-head">
                <span className="material-symbols-outlined">edit_note</span>
                Classroom Rules
              </div>
              <dl className="tg-rule-grid">
                {g.assessmentUseRule && g.assessmentUseRule !== "silent" && (
                  <>
                    <dt>Assessments</dt>
                    <dd>{g.assessmentUseRule.replace(/_/g, " ")}</dd>
                  </>
                )}
                {g.teacherGradingAllowed && g.teacherGradingAllowed !== "silent" && (
                  <>
                    <dt>AI grading</dt>
                    <dd>{g.teacherGradingAllowed.replace(/_/g, " ")}</dd>
                  </>
                )}
                {g.teacherFeedbackDraftAllowed && g.teacherFeedbackDraftAllowed !== "silent" && (
                  <>
                    <dt>AI feedback drafts</dt>
                    <dd>{g.teacherFeedbackDraftAllowed.replace(/_/g, " ")}</dd>
                  </>
                )}
                {g.priorTrainingRequired !== undefined && (
                  <>
                    <dt>Prior training</dt>
                    <dd>
                      {g.priorTrainingRequired ? "Required" : "Not required"}
                      {g.trainingProvider && ` · ${g.trainingProvider}`}
                    </dd>
                  </>
                )}
              </dl>
            </div>
          )}

          <div className="detail-block">
            <div className="mini-heading tg-section-head tg-allowed-head">
              <span className="material-symbols-outlined">check_circle</span>
              Allowed Uses
            </div>
            {g.allowedUses.length > 0 ? (
              <ul className="tg-list tg-list-allowed">
                {g.allowedUses.map((item, i) => (
                  <li key={i}>
                    <span className="material-symbols-outlined tg-list-icon">check</span>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="tg-empty">No allowed uses coded yet.</p>
            )}
          </div>

          <div className="detail-block">
            <div className="mini-heading tg-section-head tg-prohibited-head">
              <span className="material-symbols-outlined">block</span>
              Prohibited Uses
            </div>
            {g.prohibitedUses.length > 0 ? (
              <ul className="tg-list tg-list-prohibited">
                {g.prohibitedUses.map((item, i) => (
                  <li key={i}>
                    <span className="material-symbols-outlined tg-list-icon">close</span>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="tg-empty">No explicit prohibitions coded yet.</p>
            )}
          </div>

          {g.ageRestrictions.length > 0 && (
            <div className="detail-block">
              <div className="mini-heading tg-section-head tg-age-head">
                <span className="material-symbols-outlined">child_care</span>
                Age &amp; Grade Restrictions
              </div>
              <div className="tg-cards">
                {g.ageRestrictions.map((item, i) => (
                  <RestrictionCard key={i} item={item} />
                ))}
              </div>
            </div>
          )}

          {g.usageRestrictions.length > 0 && (
            <div className="detail-block">
              <div className="mini-heading tg-section-head tg-usage-head">
                <span className="material-symbols-outlined">settings_applications</span>
                Tool &amp; Usage Restrictions
              </div>
              <div className="tg-cards">
                {g.usageRestrictions.map((item, i) => (
                  <RestrictionCard key={i} item={item} />
                ))}
              </div>
            </div>
          )}

          {g.teacherActionItems && g.teacherActionItems.length > 0 && (
            <div className="detail-block">
              <div className="mini-heading tg-section-head">
                <span className="material-symbols-outlined">checklist</span>
                Teacher Action Items
              </div>
              <ol className="tg-action-list">
                {g.teacherActionItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ol>
            </div>
          )}

          {g.syllabusStatementTemplate && (
            <div className="detail-block tg-syllabus-block">
              <div className="mini-heading tg-section-head">
                <span className="material-symbols-outlined">description</span>
                Syllabus Statement Template
              </div>
              <button
                type="button"
                className="tg-syllabus-toggle"
                onClick={() => setSyllabusOpen((v) => !v)}
                aria-expanded={syllabusOpen}
              >
                <span className="material-symbols-outlined">
                  {syllabusOpen ? "expand_less" : "expand_more"}
                </span>
                {syllabusOpen ? "Hide" : "Show"} template
              </button>
              {syllabusOpen && (
                <div className="tg-syllabus-body">
                  <p className="tg-syllabus-text">{g.syllabusStatementTemplate}</p>
                  <button type="button" className="tg-copy-btn" onClick={copySyllabus}>
                    <span className="material-symbols-outlined">
                      {copied ? "check" : "content_copy"}
                    </span>
                    {copied ? "Copied" : "Copy to clipboard"}
                  </button>
                </div>
              )}
            </div>
          )}

          {g.contactResource && (
            <div className="detail-block">
              <div className="mini-heading">Official Resources</div>
              <a
                href={g.contactResource}
                target="_blank"
                rel="noreferrer"
                className="tg-resource-link"
              >
                <span className="material-symbols-outlined">open_in_new</span>
                View Official Guidance
              </a>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
