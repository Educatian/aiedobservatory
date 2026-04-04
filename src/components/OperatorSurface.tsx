import pipelineRunState from "../../data/generated/pipeline-run-state.json";
import refreshConfig from "../../config/policy-refresh.json";
import type { PipelineRunState, PolicyRecord } from "../types";

interface OperatorSurfaceProps {
  records: PolicyRecord[];
}

function formatDate(value: string | null): string {
  if (!value) return "Not yet run";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function getLastFailedStep(state: PipelineRunState): string {
  const failedStep = [...state.stepResults].reverse().find((step) => !step.ok);
  return failedStep?.label ?? state.lastError?.stepId ?? "None";
}

export function OperatorSurface({ records }: OperatorSurfaceProps) {
  const runState = pipelineRunState as PipelineRunState;
  const cadenceDays = refreshConfig.cadenceDays ?? runState.cadenceDays ?? 14;
  const pendingReviewCount = records.filter(
    (record) =>
      record.approvalRoute === "human_review" ||
      record.auditStatus === "pending_human_review" ||
      record.auditStatus === "pending_sample"
  ).length;
  const provisionalCount = records.filter((record) => record.snapshotStatus === "queued").length;

  return (
    <section className="operator-surface" aria-labelledby="operator-surface-title">
      <div className="operator-surface-header">
        <div>
          <span className="page-kicker">Operator Surface</span>
          <h4 id="operator-surface-title">Run status and surveillance operations</h4>
          <p>
            This panel reflects the operational layer behind the dashboard: scheduled refresh state,
            pending review load, and the most recent pipeline execution posture.
          </p>
        </div>
        <div className={`operator-status-pill ${runState.lastStatus}`}>
          <span className="material-symbols-outlined">sync</span>
          {runState.lastStatus}
        </div>
      </div>

      <div className="operator-surface-grid">
        <article className="operator-card">
          <span>Refresh cadence</span>
          <strong>Every {cadenceDays} days</strong>
          <p>Scheduled policy refresh is configured as a biweekly agentic surveillance cycle.</p>
        </article>

        <article className="operator-card">
          <span>Last successful refresh</span>
          <strong>{formatDate(runState.lastSuccessfulRunAt)}</strong>
          <p>Most recent run that completed crawl, extraction, routing, and publish steps.</p>
        </article>

        <article className="operator-card">
          <span>Next due</span>
          <strong>{formatDate(runState.nextDueAt)}</strong>
          <p>The next eligible refresh window after cadence gating is satisfied.</p>
        </article>

        <article className="operator-card">
          <span>Pending review load</span>
          <strong>{pendingReviewCount}</strong>
          <p>Records currently held for sample audit or full human review.</p>
        </article>
      </div>

      <div className="operator-detail-grid">
        <article className="operator-detail-card">
          <h5>Latest run state</h5>
          <ul className="operator-detail-list">
            <li>
              <span>Workflow ID</span>
              <strong>{runState.workflowId}</strong>
            </li>
            <li>
              <span>Last trigger</span>
              <strong>{runState.lastTrigger ?? "Not yet triggered"}</strong>
            </li>
            <li>
              <span>Last attempt</span>
              <strong>{formatDate(runState.lastAttemptAt)}</strong>
            </li>
            <li>
              <span>Failed step</span>
              <strong>{getLastFailedStep(runState)}</strong>
            </li>
          </ul>
        </article>

        <article className="operator-detail-card">
          <h5>Publication boundary</h5>
          <ul className="operator-detail-list">
            <li>
              <span>Published coded records</span>
              <strong>{records.filter((record) => record.snapshotStatus === "coded").length}</strong>
            </li>
            <li>
              <span>Provisional queued records</span>
              <strong>{provisionalCount}</strong>
            </li>
            <li>
              <span>Trust boundary</span>
              <strong>Primary evidence separated from secondary context</strong>
            </li>
            <li>
              <span>Export artifact mode</span>
              <strong>UI reads canonical publish outputs, not raw crawler output</strong>
            </li>
          </ul>
        </article>
      </div>
    </section>
  );
}
