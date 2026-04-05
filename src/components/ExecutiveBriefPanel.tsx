import {
  formatScoreLabel,
  getPriorityDomains
} from "../data/policyData";
import {
  buildExecutiveEvidenceStatement,
  buildExecutiveInterpretation,
  getRobustnessLabel
} from "../lib/policySynthesis";
import type { PolicyRecord } from "../types";

interface ExecutiveBriefPanelProps {
  record: PolicyRecord;
  benchmarkRecords?: PolicyRecord[];
}

function getUncertaintyLabel(record: PolicyRecord): string {
  if (record.snapshotStatus === "queued") return "Provisional";
  if (record.confidence >= 0.85 && record.evidenceSpans.length >= 3) return "Low";
  if (record.confidence >= 0.7) return "Moderate";
  return "Elevated";
}

function getReadinessDimensions(record: PolicyRecord) {
  return [
    {
      label: "Governance",
      value: record.implementationStage,
      description: "Whether the state has moved from guidance to operational practice."
    },
    {
      label: "Instruction",
      value: Math.max(record.aiUseAllowed, record.assessmentPolicy),
      description: "How clearly classroom use and assessment adaptation are being managed."
    },
    {
      label: "Privacy",
      value: record.privacyPolicy,
      description: "How strongly student data handling and vendor controls are specified."
    },
    {
      label: "Professional learning",
      value: record.teacherPdSupport,
      description: "Whether implementation support is paired with educator training."
    }
  ];
}

function getDimensionBarWidth(value: number): string {
  return `${Math.min(Math.max(value, 0), 4) * 25}%`;
}

export function ExecutiveBriefPanel({ record, benchmarkRecords }: ExecutiveBriefPanelProps) {
  const readinessDimensions = getReadinessDimensions(record);
  const priorityDomains = getPriorityDomains(record);
  const uncertaintyLabel = getUncertaintyLabel(record);
  const evidenceLabel = getRobustnessLabel(record);
  const interpretiveNote = buildExecutiveInterpretation(record, benchmarkRecords);

  return (
    <section
      className="detail-panel leadership-card executive-brief-panel"
      aria-labelledby={`executive-brief-${record.stateAbbr}`}
    >
      <div className="detail-header">
        <div>
          <div className="section-kicker">Executive Brief</div>
          <h3 id={`executive-brief-${record.stateAbbr}`}>
            {record.stateName} <span>{record.stateAbbr}</span>
          </h3>
        </div>
        <div className={`status-pill ${record.snapshotStatus}`}>{uncertaintyLabel} uncertainty</div>
      </div>

      <div className="detail-inline-meta">
        <p>Confirmed evidence and provisional interpretation are shown separately in this brief.</p>
      </div>

      <div className="detail-highlight leadership-highlight">
        <div>
          <span className="detail-label">Policy strength</span>
          <strong>{formatScoreLabel(record)}</strong>
        </div>
        <div>
          <span className="detail-label">Evidence basis</span>
          <strong>{evidenceLabel}</strong>
        </div>
        <div>
          <span className="detail-label">Uncertainty</span>
          <strong>{uncertaintyLabel}</strong>
        </div>
      </div>

      <div className="leadership-readiness-grid">
        {readinessDimensions.map((dimension) => (
          <div key={dimension.label} className="leadership-readiness-card">
            <div className="leadership-readiness-head">
              <div>
                <strong>{dimension.label}</strong>
                <small>{dimension.description}</small>
              </div>
              <strong>{dimension.value}/4</strong>
            </div>
            <div className="leadership-readiness-meter">
              <span style={{ width: getDimensionBarWidth(dimension.value) }} />
            </div>
          </div>
        ))}
      </div>

      <div className="leadership-subsection">
        <div className="mini-heading">Priority policy domains</div>
        {priorityDomains.length > 0 ? (
          <ul className="inline-list leadership-chip-list">
            {priorityDomains.map((domain) => (
              <li key={domain}>{domain}</li>
            ))}
          </ul>
        ) : (
          <p>No priority domain pattern is coded yet.</p>
        )}
      </div>

      <div className="leadership-subsection">
        <div className="mini-heading">Confirmed evidence statement</div>
        <p className="detail-note leadership-note">{buildExecutiveEvidenceStatement(record)}</p>
      </div>

      <div className="leadership-subsection">
        <div className="mini-heading">Provisional interpretation</div>
        <p className="detail-note leadership-note">
          {record.policyOrientation}. {interpretiveNote}
        </p>
      </div>
    </section>
  );
}
