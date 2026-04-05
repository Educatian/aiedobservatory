import {
  scoringLabels,
  formatConfidence,
  getPolicyStageLabel,
  getPriorityDomains
} from "../data/policyData";
import {
  buildConfirmedEvidenceNote,
  buildConfirmedPattern,
  buildInterpretiveBoundary,
  buildProvisionalInterpretation,
  buildStructuredSynthesis,
  getRobustnessLabel
} from "../lib/policySynthesis";
import type { PolicyRecord } from "../types";

interface CompareMatrixViewProps {
  records: PolicyRecord[];
  compareStates: string[];
  onChangeState: (slot: number, stateAbbr: string) => void;
}

interface CompareRowDefinition {
  label: string;
  render: (record: PolicyRecord) => React.ReactNode;
}

function getAcademicIntegrityLabel(record: PolicyRecord): string {
  if (record.assessmentPolicy >= 3) return "Formal Guidelines";
  if (record.assessmentPolicy >= 2) return "Disclosure Rules";
  if (record.assessmentPolicy >= 1) return "Pending Review";
  return "Not coded";
}

function getSupportLabel(value: number): string {
  if (value >= 3) return "High capacity";
  if (value >= 2) return "Moderate";
  if (value >= 1) return "Light support";
  return "Not coded";
}

function getBarSegments(value: number, max = 4): number[] {
  return Array.from({ length: max }, (_, index) => (index < value ? 1 : 0));
}

function getApprovalRouteLabel(route: PolicyRecord["approvalRoute"]): string {
  switch (route) {
    case "auto_approve":
      return "Auto-approved";
    case "sample_audit":
      return "Sample audit";
    case "human_review":
      return "Human review";
    default:
      return "Unrouted";
  }
}

function getEvidenceStatus(record: PolicyRecord): {
  label: string;
  tone: "stable" | "reviewed" | "provisional";
} {
  if (record.snapshotStatus !== "coded") {
    return { label: "Not yet coded", tone: "provisional" };
  }

  const robustnessLabel = getRobustnessLabel(record);

  if (robustnessLabel === "Strong evidence base") {
    return { label: "Stable evidence base", tone: "stable" };
  }

  if (record.auditStatus === "completed") {
    return { label: "Reviewed record", tone: "reviewed" };
  }

  return { label: "Evidence-limited", tone: "provisional" };
}

const compareRows: CompareRowDefinition[] = [
  {
    label: "Policy Strength Score",
    render: (record) => {
      const percentage = Math.round((record.policyStrength / 16) * 100);
      return (
        <div className="compare-score-block">
          <div className="compare-score-head">
            <strong>{record.policyStrength}</strong>
            <span>/ 16</span>
          </div>
          <div className="compare-meter">
            <span style={{ width: `${percentage}%` }} />
          </div>
        </div>
      );
    }
  },
  {
    label: "Policy Stage",
    render: (record) => (
      <span className="compare-pill compare-pill-stage">{getPolicyStageLabel(record.implementationStage)}</span>
    )
  },
  {
    label: "AI Use Allowed",
    render: (record) => (
      <span className={`compare-pill ${record.aiUseAllowed >= 2 ? "is-positive" : "is-neutral"}`}>
        {scoringLabels[record.aiUseAllowed] ?? "Not coded"}
      </span>
    )
  },
  {
    label: "Assessment Policy",
    render: (record) => <span className="compare-text">{scoringLabels[record.assessmentPolicy] ?? "Not coded"}</span>
  },
  {
    label: "Privacy Policy",
    render: (record) => <span className="compare-text">{scoringLabels[record.privacyPolicy] ?? "Not coded"}</span>
  },
  {
    label: "Teacher PD Support",
    render: (record) => (
      <div className="compare-support-block">
        <span>{getSupportLabel(record.teacherPdSupport)}</span>
        <div className="compare-support-bars" aria-hidden="true">
          {getBarSegments(record.teacherPdSupport).map((filled, index) => (
            <i key={`${record.stateAbbr}-pd-${index}`} className={filled ? "filled" : ""} />
          ))}
        </div>
      </div>
    )
  },
  {
    label: "Academic Integrity",
    render: (record) => (
      <div className="compare-integrity">
        <span
          className={`compare-dot ${record.assessmentPolicy >= 2 ? "is-strong" : record.assessmentPolicy >= 1 ? "is-mid" : ""}`}
        />
        <span>{getAcademicIntegrityLabel(record)}</span>
      </div>
    )
  },
  {
    label: "Confidence Level",
    render: (record) => (
      <span className="compare-pill compare-pill-confidence">
        <span className="material-symbols-outlined">verified</span>
        {formatConfidence(record.confidence)} reliable
      </span>
    )
  }
];
export function CompareMatrixView({
  records,
  compareStates,
  onChangeState
}: CompareMatrixViewProps) {
  const compareRecords = compareStates
    .map((state) => records.find((record) => record.stateAbbr === state))
    .filter((record): record is PolicyRecord => Boolean(record));

  if (compareRecords.length === 0) {
    return null;
  }

  return (
    <section className="compare-section" id="compare">
      <div className="compare-section-header">
        <div>
          <span className="page-kicker">Compare Regions</span>
          <h4>Regional comparison matrix</h4>
          <p>
            Benchmarking state-level AI education frameworks across policy maturity, implementation
            readiness, privacy posture, and academic integrity guidance.
          </p>
        </div>

        <div className="compare-controls">
          {compareStates.map((stateAbbr, slot) => (
            <label className="field compare-select" key={`compare-slot-${slot}`}>
              <span>Region {slot + 1}</span>
              <select value={stateAbbr} onChange={(event) => onChangeState(slot, event.target.value)}>
                {records
                  .filter((record) => record.snapshotStatus === "coded")
                  .map((record) => (
                    <option key={record.stateAbbr} value={record.stateAbbr}>
                      {record.stateName}
                    </option>
                  ))}
              </select>
            </label>
          ))}
        </div>
      </div>

      <div className="compare-matrix-shell">
        <div className="compare-grid">
          <div className="compare-criteria-column">
            <div className="compare-column-head">
              <span>Comparison Matrix</span>
              <h5>Core policy domains</h5>
            </div>

            <div className="compare-row-list">
              {compareRows.map((row) => (
                <div className="compare-criteria-cell" key={row.label}>
                  {row.label}
                </div>
              ))}
            </div>
          </div>

          {compareRecords.map((record) => {
            const evidenceStatus = getEvidenceStatus(record);

            return (
              <div className="compare-region-column" key={record.stateAbbr}>
                <div className="compare-region-head">
                  <div className="compare-state-avatar">{record.stateAbbr}</div>
                  <h5>{record.stateName}</h5>
                  <p>Region ID: {record.stateAbbr}-{record.year}-EDU</p>
                  <div className="compare-head-meta">
                    <span>{getPolicyStageLabel(record.implementationStage)}</span>
                    <span>{getPriorityDomains(record).join(" • ") || "Not coded"}</span>
                  </div>
                  <div className="compare-status-row">
                    <span className={`compare-status-chip route-${record.approvalRoute ?? "unrouted"}`}>
                      {getApprovalRouteLabel(record.approvalRoute)}
                    </span>
                    <span className={`compare-status-chip evidence-${evidenceStatus.tone}`}>
                      {evidenceStatus.label}
                    </span>
                  </div>
                </div>

                <div className="compare-row-list">
                  {compareRows.map((row) => (
                    <div className="compare-value-cell" key={`${record.stateAbbr}-${row.label}`}>
                      {row.render(record)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="compare-insights compare-insights-grid5">
        <article className="compare-insight compare-insight-primary">
          <h5>
            <span className="material-symbols-outlined">psychology</span>
            Structured Synthesis
          </h5>
          <p>{buildStructuredSynthesis(compareRecords)}</p>
        </article>

        <article className="compare-insight">
          <h5>
            <span className="material-symbols-outlined">trending_up</span>
            Confirmed Pattern
          </h5>
          <p>{buildConfirmedPattern(compareRecords)}</p>
        </article>

        <article className="compare-insight">
          <h5>
            <span className="material-symbols-outlined">verified_user</span>
            Confirmed Evidence
          </h5>
          <p>{buildConfirmedEvidenceNote(compareRecords)}</p>
        </article>

        <article className="compare-insight">
          <h5>
            <span className="material-symbols-outlined">analytics</span>
            Provisional Interpretation
          </h5>
          <p>{buildProvisionalInterpretation(compareRecords)}</p>
        </article>

        <article className="compare-insight">
          <h5>
            <span className="material-symbols-outlined">warning</span>
            Interpretive Boundary
          </h5>
          <p>{buildInterpretiveBoundary(compareRecords)}</p>
        </article>
      </div>
    </section>
  );
}
