import React from "react";
import { SegmentControl, Tag } from "../ui";
import "./FilterPanel.css";

export type FilterDimension = "geo" | "domains" | "stage" | "confidence" | "time";

export type GeoMode = "state" | "district";
export type CoverageMode = "all" | "coded" | "queued";

export interface FilterPanelProps {
  activeFilter: FilterDimension;
  /** Geography pane */
  geoMode?: GeoMode;
  onChangeGeoMode?: (next: GeoMode) => void;
  coverage?: CoverageMode;
  onChangeCoverage?: (next: CoverageMode) => void;
  /** Domain pane */
  policyDomains?: string[];
  selectedDomains?: ReadonlySet<string>;
  onToggleDomain?: (domain: string) => void;
  /** Confidence pane */
  minConfidence?: number;
  onChangeMinConfidence?: (next: number) => void;
}

const REGION_GROUPS: ReadonlyArray<{ name: string; states: string }> = [
  { name: "Northeast", states: "9 states" },
  { name: "Midwest", states: "12 states" },
  { name: "South", states: "16 states" },
  { name: "West", states: "13 states" },
];

const STAGE_BUCKETS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 0, label: "Not started" },
  { value: 1, label: "Exploration" },
  { value: 2, label: "Drafting" },
  { value: 3, label: "Released guidance" },
  { value: 4, label: "Implemented" },
];

const TIME_RANGES: ReadonlyArray<{ value: string; label: string }> = [
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "ytd", label: "Year to date" },
  { value: "all", label: "All time" },
];

const FilterPanel: React.FC<FilterPanelProps> = ({
  activeFilter,
  geoMode = "state",
  onChangeGeoMode,
  coverage = "all",
  onChangeCoverage,
  policyDomains = [],
  selectedDomains,
  onToggleDomain,
  minConfidence = 0,
  onChangeMinConfidence,
}) => {
  if (activeFilter === "geo") {
    return (
      <section className="aied-filterpanel">
        <div className="aied-filterpanel__group-label">View as</div>
        <SegmentControl<GeoMode>
          value={geoMode}
          onChange={next => onChangeGeoMode?.(next)}
          options={[
            { value: "state", label: "State" },
            { value: "district", label: "District" },
          ]}
          ariaLabel="Geographic granularity"
        />

        <div className="aied-filterpanel__group-label aied-filterpanel__group-label--top">Coverage</div>
        <SegmentControl<CoverageMode>
          value={coverage}
          onChange={next => onChangeCoverage?.(next)}
          options={[
            { value: "all", label: "All" },
            { value: "coded", label: "Coded" },
            { value: "queued", label: "Queued" },
          ]}
          ariaLabel="Snapshot coverage"
        />

        <div className="aied-filterpanel__group-label aied-filterpanel__group-label--top">Region</div>
        <div className="aied-filterpanel__chips">
          {REGION_GROUPS.map(r => (
            <Tag key={r.name} kind="cool">{r.name} · {r.states}</Tag>
          ))}
        </div>
      </section>
    );
  }

  if (activeFilter === "domains") {
    return (
      <section className="aied-filterpanel">
        <div className="aied-filterpanel__group-label">Domains</div>
        {policyDomains.length === 0 ? (
          <p className="aied-filterpanel__empty">No domains available.</p>
        ) : (
          <ul className="aied-filterpanel__checklist">
            {policyDomains.map(d => {
              const checked = selectedDomains?.has(d) ?? false;
              return (
                <li key={d}>
                  <label className="aied-filterpanel__check">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleDomain?.(d)}
                    />
                    <span>{d}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    );
  }

  if (activeFilter === "stage") {
    return (
      <section className="aied-filterpanel">
        <div className="aied-filterpanel__group-label">Implementation stage</div>
        <ul className="aied-filterpanel__checklist">
          {STAGE_BUCKETS.map(b => (
            <li key={b.value}>
              <label className="aied-filterpanel__check">
                <input type="checkbox" defaultChecked />
                <span>{b.label}</span>
                <span className="aied-filterpanel__hint">stage {b.value}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (activeFilter === "confidence") {
    return (
      <section className="aied-filterpanel">
        <div className="aied-filterpanel__group-label">Minimum confidence</div>
        <div className="aied-filterpanel__slider-row">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={Math.round(minConfidence * 100)}
            onChange={e => onChangeMinConfidence?.(Number(e.target.value) / 100)}
            aria-label="Minimum confidence threshold"
          />
          <span className="aied-filterpanel__slider-value">
            {Math.round(minConfidence * 100)}%
          </span>
        </div>
        <div className="aied-filterpanel__chips">
          <Tag kind="green" dot>High ≥ 85%</Tag>
          <Tag kind="yellow" dot>Moderate 60–84%</Tag>
          <Tag kind="red" dot>Low &lt; 60%</Tag>
        </div>
      </section>
    );
  }

  if (activeFilter === "time") {
    return (
      <section className="aied-filterpanel">
        <div className="aied-filterpanel__group-label">Time window</div>
        <div className="aied-filterpanel__chips aied-filterpanel__chips--stack">
          {TIME_RANGES.map(r => (
            <Tag key={r.value} kind="neutral">{r.label}</Tag>
          ))}
        </div>
      </section>
    );
  }

  return null;
};

export default FilterPanel;
