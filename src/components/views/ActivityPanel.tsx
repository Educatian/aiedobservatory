import React from "react";
import { Tag } from "../ui";
import type { PolicyEvent } from "../../types";
import type { DisplayState } from "../../lib/displayState";
import "./views.css";

export interface ActivityPanelProps {
  state: DisplayState;
  events: PolicyEvent[];
}

type Kind = "Released" | "Coded" | "Review" | "Source" | "Other";

function classifyEvent(e: PolicyEvent): { kind: Kind; tagKind: "green" | "blue" | "purple" | "cyan" | "cool"; dot: string } {
  switch (e.eventType) {
    case "stage_changed":
    case "review_status_changed":
      return { kind: "Released", tagKind: "green", dot: "released" };
    case "record_created":
    case "record_updated":
    case "instrument_added":
    case "instrument_status_changed":
      return { kind: "Coded", tagKind: "blue", dot: "coded" };
    case "approval_route_changed":
    case "confidence_changed":
      return { kind: "Review", tagKind: "purple", dot: "review" };
    case "source_added":
      return { kind: "Source", tagKind: "cyan", dot: "source" };
    default:
      return { kind: "Other", tagKind: "cool", dot: "default" };
  }
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const ActivityPanel: React.FC<ActivityPanelProps> = ({ state, events }) => {
  const stateEvents = events.filter(e => e.stateAbbr === state.code).slice(0, 12);

  if (stateEvents.length === 0) {
    return (
      <section className="aied-activity">
        <p className="aied-activity__empty">No recorded activity for {state.name} yet.</p>
      </section>
    );
  }

  return (
    <section className="aied-activity" aria-label={`Activity for ${state.name}`}>
      {stateEvents.map((e, i) => {
        const k = classifyEvent(e);
        return (
          <div key={e.id} className="aied-activity__row">
            <span className={`aied-activity__dot aied-activity__dot--${k.dot}`} aria-hidden />
            {i < stateEvents.length - 1 && <span className="aied-activity__line" aria-hidden />}
            <div className="aied-activity__body">
              <div className="aied-activity__head">
                <Tag kind={k.tagKind}>{k.kind}</Tag>
                <span className="aied-activity__date">{fmtDate(e.occurredAt)}</span>
              </div>
              <div className="aied-activity__text">{e.title || e.description}</div>
            </div>
          </div>
        );
      })}
    </section>
  );
};

export default ActivityPanel;
