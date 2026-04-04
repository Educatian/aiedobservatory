import evaluationSummary from "../../data/evaluation/latest-evaluation.json";
import type { PolicyRecord } from "../types";

interface MethodologySectionProps {
  records: PolicyRecord[];
}

function formatPercent(value: number | null | undefined): string {
  if (value == null) return "N/A";
  return `${Math.round(value * 100)}%`;
}

export function MethodologySection({ records }: MethodologySectionProps) {
  const codebookDownloadHref = `${import.meta.env.BASE_URL}downloads/academic-sentinel-codebook.pdf`;
  const codedRecords = records.filter((record) => record.snapshotStatus === "coded");
  const autoApproved = codedRecords.filter((record) => record.approvalRoute === "auto_approve").length;
  const sampleAudits = codedRecords.filter((record) => record.auditStatus === "pending_sample").length;
  const humanReviewed = codedRecords.filter((record) => record.auditStatus === "completed").length;
  const citationSupportRate = formatPercent(evaluationSummary.citation_support_rate);
  const approvalRouteAccuracy = formatPercent(evaluationSummary.approval_route_accuracy);
  const fieldAccuracyValues = Object.values(evaluationSummary.field_accuracy).filter(
    (value): value is number => typeof value === "number"
  );
  const averageFieldAccuracy =
    fieldAccuracyValues.length > 0
      ? formatPercent(
          fieldAccuracyValues.reduce((sum, value) => sum + value, 0) / fieldAccuracyValues.length
        )
      : "N/A";

  return (
    <section className="methodology-section" id="methodology">
      <div className="methodology-heading">
        <span className="material-symbols-outlined">biotech</span>
        <h4>Coding Methodology</h4>
      </div>

      <div className="methodology-grid">
        <article className="methodology-card accent-secondary">
          <div className="methodology-icon">
            <span className="material-symbols-outlined">analytics</span>
          </div>
          <h5>Policy Strength Score</h5>
          <p>
            Measures explicitness and institutionalization across AI use, assessment, privacy,
            teacher professional development, and implementation stage.
          </p>
          <div className="methodology-meta">
            <span>Weight: composite score</span>
            <span className="material-symbols-outlined filled">info</span>
          </div>
        </article>

        <article className="methodology-card accent-tertiary">
          <div className="methodology-icon">
            <span className="material-symbols-outlined">verified</span>
          </div>
          <h5>Evidence Traceability</h5>
          <p>
            Every coded field ties back to evidence spans, source URLs, and approval routing so the
            dashboard only reads traceable canonical records.
          </p>
          <div className="methodology-meta">
            <span>Citation support: {citationSupportRate}</span>
            <span className="material-symbols-outlined filled">info</span>
          </div>
        </article>

        <article className="methodology-card accent-primary">
          <div className="methodology-icon">
            <span className="material-symbols-outlined">update</span>
          </div>
          <h5>Agentic Approval Routing</h5>
          <p>
            Records route through auto-approval, sampling audit, or human review based on confidence,
            evidence completeness, and source conflict checks.
          </p>
          <div className="methodology-meta">
            <span>Route accuracy: {approvalRouteAccuracy}</span>
            <span className="material-symbols-outlined filled">info</span>
          </div>
        </article>
      </div>

      <div className="methodology-bento">
        <article className="methodology-feature-card">
          <div className="methodology-feature-copy">
            <h5>Verification Protocols</h5>
            <p>
              The pipeline combines hybrid retrieval, structured extraction, verifier routing,
              selective audit, and deep-research fallback so hard cases can be escalated without
              requiring full manual review on every row.
            </p>
            <a
              className="methodology-download-link"
              href={codebookDownloadHref}
              download="academic-sentinel-codebook.pdf"
            >
              Download Codebook PDF
            </a>
          </div>
        </article>

        <article className="methodology-metric-card">
          <h6>Update Frequency</h6>
          <div>
            <strong>On Demand</strong>
            <p>Current coded states: {codedRecords.length} with queued refresh support</p>
          </div>
        </article>

        <article className="methodology-metric-card">
          <h6>Reliability Score</h6>
          <div>
            <strong>{averageFieldAccuracy}</strong>
            <p>Current mean field accuracy on the seed evaluation set</p>
          </div>
        </article>
      </div>

      <div className="methodology-footnotes">
        <div>
          <span>Auto-approved</span>
          <strong>{autoApproved}</strong>
        </div>
        <div>
          <span>Sampling audit</span>
          <strong>{sampleAudits}</strong>
        </div>
        <div>
          <span>Human-reviewed</span>
          <strong>{humanReviewed}</strong>
        </div>
      </div>
    </section>
  );
}
