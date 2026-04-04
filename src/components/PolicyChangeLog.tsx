import type { PolicyEvent } from "../types";

interface PolicyChangeLogProps {
  stateAbbr: string;
  stateName: string;
  events: PolicyEvent[];
  maxItems?: number;
}

function formatEventTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function getEventLabel(event: PolicyEvent): string {
  switch (event.eventType) {
    case "source_added":
      return "Source added";
    case "approval_route_changed":
      return "Route changed";
    case "review_status_changed":
      return "Review updated";
    case "confidence_changed":
      return "Confidence updated";
    case "stage_changed":
      return "Stage updated";
    case "record_created":
      return "Record created";
    case "record_updated":
    default:
      return "Record updated";
  }
}

function getChangeSummary(event: PolicyEvent): string {
  const prev = event.previousValue == null ? null : String(event.previousValue);
  const next = event.nextValue == null ? null : String(event.nextValue);

  if (prev && next && prev !== next) {
    return `${prev} → ${next}`;
  }

  if (event.changedFields && event.changedFields.length > 0) {
    return event.changedFields.join(", ");
  }

  return event.description;
}

function getEventTone(event: PolicyEvent): string {
  switch (event.eventType) {
    case "confidence_changed":
      return "is-confidence";
    case "approval_route_changed":
      return "is-route";
    case "source_added":
      return "is-source";
    case "review_status_changed":
      return "is-review";
    case "stage_changed":
      return "is-stage";
    default:
      return "is-update";
  }
}

export function PolicyChangeLog({ stateAbbr, stateName, events, maxItems = 6 }: PolicyChangeLogProps) {
  const scopedEvents = events.filter((event) => event.stateAbbr === stateAbbr).slice(0, maxItems);

  return (
    <section className="detail-block" aria-labelledby={`change-log-${stateAbbr}`}>
      <div className="mini-heading" id={`change-log-${stateAbbr}`}>
        Recent change log
      </div>

      {scopedEvents.length === 0 ? (
        <p className="detail-note">
          No recent event activity has been captured for {stateName} yet.
        </p>
      ) : (
        <div className="change-log-list">
          {scopedEvents.map((event) => (
            <article key={event.id} className="change-log-item">
              <div className="change-log-head">
                <span className={`event-pill event-${event.eventType} ${getEventTone(event)}`}>
                  {getEventLabel(event)}
                </span>
                <small>{formatEventTime(event.occurredAt)}</small>
              </div>

              <strong>{event.title}</strong>
              <p>{getChangeSummary(event)}</p>

              <div className="change-log-meta">
                {event.approvalRoute ? (
                  <span className="source-route-badge sample_audit">{event.approvalRoute.replace("_", " ")}</span>
                ) : null}
                {typeof event.confidence === "number" ? (
                  <span className="source-level-pill">{Math.round(event.confidence * 100)}% confidence</span>
                ) : null}
                {event.changedFields && event.changedFields.length > 0 ? (
                  <span className="source-level-pill">{event.changedFields.length} field(s)</span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
