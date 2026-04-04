import { formatConfidence, formatScoreLabel } from "../data/policyData";
import type { PolicyEvent, PolicyRecord } from "../types";

interface TrustPanelProps {
  record: PolicyRecord;
  events?: PolicyEvent[];
}

const CORE_FIELDS = [
  { key: "ai_use_allowed", label: "Use" },
  { key: "assessment_policy", label: "Assessment" },
  { key: "privacy_policy", label: "Privacy" },
  { key: "teacher_pd_support", label: "Teacher PD" },
  { key: "implementation_stage", label: "Implementation" }
] as const;

function formatEvidenceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.85) return "High";
  if (confidence >= 0.7) return "Moderate";
  return "Low";
}

function getCoverageScore(record: PolicyRecord): number {
  const coveredFields = new Set(record.evidenceSpans.map((span) => span.field));
  const covered = CORE_FIELDS.filter((field) => coveredFields.has(field.key)).length;
  return Math.round((covered / CORE_FIELDS.length) * 100);
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

export function TrustPanel({ record, events = [] }: TrustPanelProps) {
  const evidenceCount = record.evidenceSpans.length;
  const sourceCount = record.sourceDocuments.length;
  const distinctEvidenceFields = new Set(record.evidenceSpans.map((span) => span.field)).size;
  const coverageScore = getCoverageScore(record);
  const recentEvents = events
    .filter((event) => event.stateAbbr === record.stateAbbr)
    .slice()
    .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
    .slice(0, 3);

  return (
    <aside className="detail-panel leadership-card trust-panel">
      <div className="detail-header">
        <div>
          <div className="section-kicker">Trust and traceability</div>
          <h3>
            {record.stateName} <span>{record.stateAbbr}</span>
          </h3>
        </div>
        <div className={`status-pill ${record.snapshotStatus}`}>{getConfidenceLabel(record.confidence)} confidence</div>
      </div>

      <div className="detail-highlight">
        <div>
          <span className="detail-label">Policy strength</span>
          <strong>{formatScoreLabel(record)}</strong>
        </div>
        <div>
          <span className="detail-label">Confidence</span>
          <strong>{formatConfidence(record.confidence)}</strong>
        </div>
        <div>
          <span className="detail-label">Approval route</span>
          <strong>{getApprovalRouteLabel(record.approvalRoute)}</strong>
        </div>
      </div>

      <div className="detail-block meta-grid">
        <div>
          <span className="detail-label">Evidence spans</span>
          <strong>{evidenceCount}</strong>
        </div>
        <div>
          <span className="detail-label">Covered fields</span>
          <strong>{distinctEvidenceFields}/5</strong>
        </div>
        <div>
          <span className="detail-label">Coverage score</span>
          <strong>{coverageScore}%</strong>
        </div>
        <div>
          <span className="detail-label">Source documents</span>
          <strong>{sourceCount}</strong>
        </div>
      </div>

      <div className="detail-block">
        <div className="mini-heading">Source authority</div>
        <p className="detail-note">{record.sourceAuthority ?? "No source authority coded yet."}</p>
      </div>

      <div className="detail-block">
        <div className="mini-heading">Routing reasons</div>
        {record.routingReasons && record.routingReasons.length > 0 ? (
          <ul className="inline-list">
            {record.routingReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : (
          <p className="detail-note">No routing reasons were attached to this record.</p>
        )}
      </div>

      <div className="detail-block">
        <div className="mini-heading">Representative citations</div>
        {record.evidenceSpans.length > 0 ? (
          <ul className="reference-list trust-citation-list">
            {record.evidenceSpans.slice(0, 3).map((span, index) => (
              <li key={`${span.chunkId ?? span.sourceUrl}-${index}`}>
                <span>{span.field.replace(/_/g, " ")}</span>
                <p>
                  "{span.quote}" <a href={span.sourceUrl} target="_blank" rel="noreferrer">Link</a>
                </p>
                <small>{formatEvidenceHost(span.sourceUrl)}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="detail-note">No evidence spans are attached yet.</p>
        )}
      </div>

      <div className="detail-block">
        <div className="mini-heading">Recent state events</div>
        {recentEvents.length > 0 ? (
          <ul className="reference-list trust-citation-list">
            {recentEvents.map((event) => (
              <li key={event.id}>
                <span>{event.title}</span>
                <p>{event.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="detail-note">No recent routing or confidence events have been captured yet.</p>
        )}
      </div>
    </aside>
  );
}
