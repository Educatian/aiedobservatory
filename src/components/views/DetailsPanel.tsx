import React from "react";
import { Tag } from "../ui";
import type { DisplayState } from "../../lib/displayState";
import "./views.css";

export interface DetailsPanelProps {
  state: DisplayState;
}

const ROUTE_LABEL: Record<string, string> = {
  auto_approve: "Auto-approve",
  sample_audit: "Sample audit",
  human_review: "Human review",
};

const AUDIT_LABEL: Record<string, string> = {
  not_required: "Not required",
  pending_sample: "Pending sample",
  pending_human_review: "Pending review",
  completed: "Completed",
};

function statusTag(status: DisplayState["status"]) {
  if (status === "Released") return <Tag kind="green" dot>Released</Tag>;
  if (status === "In review") return <Tag kind="yellow" dot>In review</Tag>;
  if (status === "Withdrawn") return <Tag kind="red" dot>Withdrawn</Tag>;
  return <Tag kind="cool" dot>Draft</Tag>;
}

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="aied-details__row">
    <span className="aied-details__label">{label}</span>
    <span className="aied-details__value">{value}</span>
  </div>
);

const DetailsPanel: React.FC<DetailsPanelProps> = ({ state }) => {
  return (
    <section className="aied-details" aria-label={`${state.name} details`}>
      <Row label="Lead agency" value={state.leadAgency} />
      <Row label="Status" value={statusTag(state.status)} />
      <Row label="Confidence" value={`${state.confidence} (${Math.round(state.confidenceRaw * 100)}%)`} />
      <Row label="Evidence basis" value={state.evidenceBasis} />
      <Row label="Source documents" value={state.sources} />
      <Row label="Evidence spans" value={state.evidence} />
      <Row label="Districts tracked" value={state.districts || "—"} />
      <Row label="Last updated" value={state.updated} />
      {state.approvalRoute && (
        <Row label="Approval route" value={ROUTE_LABEL[state.approvalRoute] ?? state.approvalRoute} />
      )}
      {state.auditStatus && (
        <Row label="Audit status" value={AUDIT_LABEL[state.auditStatus] ?? state.auditStatus} />
      )}
      {state.notes && (
        <Row label="Notes" value={<span style={{ whiteSpace: "pre-wrap" }}>{state.notes}</span>} />
      )}
    </section>
  );
};

export default DetailsPanel;
