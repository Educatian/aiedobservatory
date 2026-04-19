import type { PolicyRecord, TeacherRestriction } from "../types";

interface TeacherGuidancePanelProps {
  record: PolicyRecord;
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
