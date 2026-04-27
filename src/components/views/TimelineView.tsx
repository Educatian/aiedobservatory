import React, { useMemo, useState } from "react";
import { Btn, SegmentControl, SVGIcon, Tag } from "../ui";
import type { PolicyEvent, PolicyRecord } from "../../types";
import { fillForStrength, toDisplayState } from "../../lib/displayState";
import "./views.css";

export interface TimelineViewProps {
  records: PolicyRecord[];
  events: PolicyEvent[];
  onSelectState: (abbr: string) => void;
}

type FilterKey = "all" | "released" | "updated" | "draft" | "withdrawn";

/**
 * Derive timeline events from policy records when the live event log is
 * empty (the data pipeline hasn't been run, so /policy-events.json is []).
 * Sources with issuedDate become "instrument_added"; each record's
 * lastUpdated becomes "record_updated".
 */
function deriveEventsFromRecords(records: PolicyRecord[]): PolicyEvent[] {
  const out: PolicyEvent[] = [];
  for (const r of records) {
    if (r.lastUpdated) {
      out.push({
        id: `derived-update-${r.stateAbbr}-${r.lastUpdated}`,
        eventType: "record_updated",
        stateAbbr: r.stateAbbr,
        stateName: r.stateName,
        occurredAt: r.lastUpdated,
        title: `${r.stateName} record refreshed`,
        description: r.notes?.slice(0, 160) || `Coding refreshed at ${r.lastUpdated}.`,
      });
    }
    const docs = r.sourceDocuments ?? [];
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      const at = doc.issuedDate || doc.effectiveDate || doc.publishedDateGuess;
      if (!at) continue;
      out.push({
        id: `derived-instrument-${r.stateAbbr}-${i}`,
        eventType: "instrument_added",
        stateAbbr: r.stateAbbr,
        stateName: r.stateName,
        occurredAt: at,
        title: doc.title ?? `Source attached: ${doc.url}`,
        description: doc.shortSummary ?? `Issuer: ${doc.issuerName ?? "—"}`,
        sourceUrl: doc.url,
      });
    }
  }
  return out;
}

const TYPE_LABEL: Record<string, { kind: "green" | "blue" | "yellow" | "red" | "cool"; label: string }> = {
  record_created: { kind: "blue", label: "Coded" },
  record_updated: { kind: "blue", label: "Updated" },
  source_added: { kind: "yellow", label: "Source" },
  approval_route_changed: { kind: "cool", label: "Route" },
  review_status_changed: { kind: "cool", label: "Review" },
  confidence_changed: { kind: "cool", label: "Confidence" },
  stage_changed: { kind: "green", label: "Stage" },
  instrument_added: { kind: "blue", label: "Instrument" },
  instrument_status_changed: { kind: "green", label: "Released" },
};

function passesFilter(e: PolicyEvent, f: FilterKey): boolean {
  if (f === "all") return true;
  const meta = TYPE_LABEL[e.eventType];
  if (!meta) return false;
  if (f === "released") return e.eventType === "stage_changed" || e.eventType === "instrument_status_changed";
  if (f === "updated") return e.eventType === "record_updated" || e.eventType === "source_added";
  if (f === "draft") return e.eventType === "record_created";
  if (f === "withdrawn") return e.eventType === "review_status_changed" && (e.nextValue === "withdrawn");
  return true;
}

function fmtMonthDay(iso: string): { md: string; yr: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { md: iso, yr: "" };
  return {
    md: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    yr: String(d.getFullYear()),
  };
}

const TimelineView: React.FC<TimelineViewProps> = ({ records, events, onSelectState }) => {
  const [filter, setFilter] = useState<FilterKey>("all");
  const stateByCode = useMemo(() => new Map(records.map(r => [r.stateAbbr, r])), [records]);
  const effectiveEvents = useMemo(
    () => (events.length > 0 ? events : deriveEventsFromRecords(records)),
    [events, records],
  );
  const usingDerived = events.length === 0 && effectiveEvents.length > 0;
  const filtered = effectiveEvents
    .filter(e => passesFilter(e, filter))
    .slice()
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 80);

  return (
    <div>
      <header className="aied-pagehead">
        <div className="aied-pagehead__col">
          <span className="aied-pagehead__kicker">Policy timeline</span>
          <h1 className="aied-pagehead__title">Activity stream</h1>
          <span className="aied-pagehead__sub">
            {usingDerived
              ? `${effectiveEvents.length} events derived from source-document and record metadata. Run the pipeline (\`npm run pipeline:events\`) to publish a live event log.`
              : `${effectiveEvents.length} coding pipeline events across all tracked jurisdictions.`}
          </span>
        </div>
        <span className="aied-pagehead__spacer" />
        <div className="aied-pagehead__actions">
          <Btn kind="ghost" size="sm" iconLeft={<SVGIcon name="download" size={14} />}>CSV</Btn>
        </div>
      </header>

      <div className="aied-timeline__filterbar">
        <SegmentControl<FilterKey>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All events" },
            { value: "released", label: "Released" },
            { value: "updated", label: "Updated" },
            { value: "draft", label: "Drafted" },
            { value: "withdrawn", label: "Withdrawn" },
          ]}
          ariaLabel="Filter timeline events"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="aied-timeline aied-timeline__empty">No events match the current filter.</div>
      ) : (
        <div className="aied-timeline">
          {filtered.map(e => {
            const rec = stateByCode.get(e.stateAbbr);
            const ds = rec ? toDisplayState(rec) : null;
            const meta = TYPE_LABEL[e.eventType] ?? { kind: "cool" as const, label: e.eventType };
            const date = fmtMonthDay(e.occurredAt);
            return (
              <div key={e.id} className="aied-timeline__row">
                <div>
                  <div className="aied-timeline__date-md">{date.md}</div>
                  <div className="aied-timeline__date-yr">{date.yr}</div>
                </div>
                <div>
                  <div className="aied-timeline__head">
                    <Tag kind={meta.kind} dot>{meta.label}</Tag>
                    {ds && (
                      <>
                        <span className="aied-brief__swatch" style={{ background: fillForStrength(ds.strength) }} />
                        <span className="aied-timeline__state-name">{ds.name}</span>
                      </>
                    )}
                  </div>
                  <div className="aied-timeline__title">{e.title || e.description}</div>
                  {ds && (
                    <div className="aied-timeline__meta">
                      {ds.leadAgency} · {ds.sources} sources cited
                    </div>
                  )}
                </div>
                <div>
                  <Btn kind="ghost" size="sm" onClick={() => onSelectState(e.stateAbbr)} iconRight={<SVGIcon name="chevRight" size={14} />}>
                    Open
                  </Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TimelineView;
