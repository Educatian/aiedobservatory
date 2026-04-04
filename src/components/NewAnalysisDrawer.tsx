import { formatConfidence, getPolicyStageLabel } from "../data/policyData";
import type { PolicyRecord } from "../types";

type NavSection =
  | "map-view"
  | "compare"
  | "policy-stage"
  | "source-library"
  | "methodology"
  | "policy-domains"
  | "table-view";

interface NewAnalysisDrawerProps {
  open: boolean;
  records: PolicyRecord[];
  selectedState: string;
  onClose: () => void;
  onNavigate: (section: NavSection) => void;
  onSelectState: (stateAbbr: string) => void;
}

interface WorkflowCard {
  title: string;
  description: string;
  section: NavSection;
  cta: string;
  icon: string;
}

const WORKFLOWS: WorkflowCard[] = [
  {
    title: "Source Discovery",
    description:
      "Start from official guidance pages, document records, and citation traces for the selected state.",
    section: "source-library",
    cta: "Open Source Library",
    icon: "library_books"
  },
  {
    title: "Domain Review",
    description:
      "Inspect where the selected state is strong or thin across use, assessment, privacy, and teacher support.",
    section: "policy-domains",
    cta: "Open Policy Domains",
    icon: "domain"
  },
  {
    title: "Stage Review",
    description:
      "Check whether the state is still signaling, has released guidance, or is already operationalized.",
    section: "policy-stage",
    cta: "Open Policy Stage",
    icon: "step"
  }
];

export function NewAnalysisDrawer({
  open,
  records,
  selectedState,
  onClose,
  onNavigate,
  onSelectState
}: NewAnalysisDrawerProps) {
  if (!open) return null;

  const currentRecord =
    records.find((record) => record.stateAbbr === selectedState) ?? records[0];

  return (
    <div className="analysis-drawer-backdrop" onClick={onClose}>
      <aside className="analysis-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="analysis-drawer-header">
          <div>
            <span className="page-kicker">Agentic Intake</span>
            <h4>New Analysis</h4>
            <p>
              Start a new policy-analysis pass by choosing a state and opening the workflow that
              fits the next job in the pipeline.
            </p>
          </div>
          <button type="button" className="analysis-drawer-close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="analysis-drawer-block">
          <label className="field">
            <span>Target state</span>
            <select
              value={currentRecord.stateAbbr}
              onChange={(event) => onSelectState(event.target.value)}
            >
              {records.map((record) => (
                <option key={record.stateAbbr} value={record.stateAbbr}>
                  {record.stateName}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="analysis-summary-grid">
          <div>
            <span className="detail-label">Snapshot</span>
            <strong>{currentRecord.snapshotStatus === "coded" ? "Coded" : "Queued"}</strong>
          </div>
          <div>
            <span className="detail-label">Stage</span>
            <strong>{getPolicyStageLabel(currentRecord.implementationStage)}</strong>
          </div>
          <div>
            <span className="detail-label">Confidence</span>
            <strong>{formatConfidence(currentRecord.confidence)}</strong>
          </div>
        </div>

        <div className="analysis-drawer-block">
          <span className="mini-heading">What this button does</span>
          <p>
            It opens the next analysis step for the selected state. Instead of being a dead action,
            it now acts as the entry point to source discovery, domain review, and stage review.
          </p>
        </div>

        <div className="analysis-workflow-grid">
          {WORKFLOWS.map((workflow) => (
            <article className="analysis-workflow-card" key={workflow.title}>
              <div className="analysis-workflow-icon">
                <span className="material-symbols-outlined">{workflow.icon}</span>
              </div>
              <h5>{workflow.title}</h5>
              <p>{workflow.description}</p>
              <button
                type="button"
                onClick={() => {
                  onNavigate(workflow.section);
                  onClose();
                }}
              >
                {workflow.cta}
              </button>
            </article>
          ))}
        </div>

        <div className="analysis-drawer-actions">
          <button
            type="button"
            className="analysis-primary"
            onClick={() => {
              onNavigate("source-library");
              onClose();
            }}
          >
            Start With Sources
          </button>
          <button type="button" className="analysis-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}
