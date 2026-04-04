import type { PolicyEvent } from "../types";

interface LiveActivityRailProps {
  events: PolicyEvent[];
  livePolling: boolean;
  playbackIndex: number;
  onToggleLivePolling: () => void;
  onTogglePlayback: () => void;
  onPlaybackIndexChange: (nextIndex: number) => void;
  onSelectEvent: (event: PolicyEvent, index: number) => void;
  playbackRunning: boolean;
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

function getEventPillLabel(event: PolicyEvent): string {
  switch (event.eventType) {
    case "source_added":
      return "Source";
    case "approval_route_changed":
      return "Route";
    case "review_status_changed":
      return "Review";
    case "confidence_changed":
      return "Confidence";
    case "stage_changed":
      return "Stage";
    case "record_created":
      return "New";
    case "record_updated":
    default:
      return "Update";
  }
}

function getEventCountLabel(events: PolicyEvent[], eventType: PolicyEvent["eventType"]): number {
  return events.filter((event) => event.eventType === eventType).length;
}

export function LiveActivityRail({
  events,
  livePolling,
  playbackIndex,
  onToggleLivePolling,
  onTogglePlayback,
  onPlaybackIndexChange,
  onSelectEvent,
  playbackRunning
}: LiveActivityRailProps) {
  if (events.length === 0) {
    return (
      <section className="live-rail-card">
        <div className="live-rail-header">
          <div>
            <span className="page-kicker">Live Surveillance</span>
            <h4>Update activity</h4>
          </div>
        </div>
        <p className="live-empty">No policy events have been generated yet.</p>
      </section>
    );
  }

  const timelineEvents = [...events].reverse();
  const clampedIndex = Math.min(Math.max(playbackIndex, 0), timelineEvents.length - 1);
  const activeEvent = timelineEvents[clampedIndex];
  const recentUpdates = getEventCountLabel(events, "record_updated") + getEventCountLabel(events, "record_created");
  const sourceAdds = getEventCountLabel(events, "source_added");
  const confidenceShifts = getEventCountLabel(events, "confidence_changed");

  return (
    <section className="live-rail-card">
      <div className="live-rail-header">
        <div>
          <span className="page-kicker">Live Surveillance</span>
          <h4>Update activity</h4>
          <p>Polling canonical events and mapping recent state-level change signals.</p>
        </div>

        <button
          type="button"
          className={`live-toggle ${livePolling ? "active" : ""}`}
          onClick={onToggleLivePolling}
        >
          <span className="live-dot" />
          {livePolling ? "Live polling" : "Polling paused"}
        </button>
      </div>

      <div className="live-metric-strip">
        <div>
          <span>Recent updates</span>
          <strong>{recentUpdates}</strong>
        </div>
        <div>
          <span>Source adds</span>
          <strong>{sourceAdds}</strong>
        </div>
        <div>
          <span>Confidence shifts</span>
          <strong>{confidenceShifts}</strong>
        </div>
      </div>

      <div className="playback-card">
        <div className="playback-topline">
          <div>
            <span className="playback-label">Time playback</span>
            <strong>{activeEvent ? activeEvent.stateName : "No event selected"}</strong>
          </div>
          <button type="button" className="playback-button" onClick={onTogglePlayback}>
            <span className="material-symbols-outlined">
              {playbackRunning ? "pause_circle" : "play_circle"}
            </span>
            {playbackRunning ? "Pause" : "Play"}
          </button>
        </div>

        <input
          className="playback-slider"
          type="range"
          min={0}
          max={Math.max(timelineEvents.length - 1, 0)}
          value={clampedIndex}
          onChange={(event) => onPlaybackIndexChange(Number(event.target.value))}
        />

        {activeEvent ? (
          <div className="playback-event-card">
            <span className={`event-pill event-${activeEvent.eventType}`}>
              {getEventPillLabel(activeEvent)}
            </span>
            <strong>{activeEvent.title}</strong>
            <p>{activeEvent.description}</p>
            <small>{formatEventTime(activeEvent.occurredAt)}</small>
          </div>
        ) : null}
      </div>

      <div className="activity-rail-list" role="list">
        {events.slice(0, 10).map((event, index) => (
          <button
            type="button"
            className={`activity-item ${event.id === activeEvent?.id ? "active" : ""}`}
            key={event.id}
            onClick={() => onSelectEvent(event, timelineEvents.findIndex((entry) => entry.id === event.id))}
          >
            <div className="activity-item-head">
              <span className={`event-pill event-${event.eventType}`}>{getEventPillLabel(event)}</span>
              <small>{formatEventTime(event.occurredAt)}</small>
            </div>
            <strong>
              {event.stateName} {event.stateAbbr}
            </strong>
            <p>{event.title}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
