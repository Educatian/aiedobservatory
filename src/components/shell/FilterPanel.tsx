import React from "react";
import { Btn, SegmentControl, Tag } from "../ui";
import "./FilterPanel.css";

export type FilterDimension = "geo" | "domains" | "stage" | "confidence" | "time";

export type GeoMode = "state" | "district";
export type CoverageMode = "all" | "coded" | "queued";
export type TimeWindow = "30d" | "90d" | "ytd" | "all";

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
  /** Stage pane */
  selectedStages?: ReadonlySet<number>;
  onToggleStage?: (stage: number) => void;
  /** Confidence pane */
  minConfidence?: number;
  onChangeMinConfidence?: (next: number) => void;
  /** Time pane */
  timeWindow?: TimeWindow;
  onChangeTimeWindow?: (next: TimeWindow) => void;
  /** Live result counter — "X of Y states" rendered below each pane. */
  matchedCount?: number;
  totalCount?: number;
  /** Clear-all callback for the active dimension. */
  onResetActive?: () => void;
}

const STAGE_BUCKETS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 0, label: "Not started" },
  { value: 1, label: "Exploration" },
  { value: 2, label: "Drafting" },
  { value: 3, label: "Released guidance" },
  { value: 4, label: "Operationalized" },
];

const TIME_RANGES: ReadonlyArray<{ value: TimeWindow; label: string }> = [
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
  selectedStages,
  onToggleStage,
  minConfidence = 0,
  onChangeMinConfidence,
  timeWindow = "all",
  onChangeTimeWindow,
  matchedCount,
  totalCount,
  onResetActive,
}) => {
  const renderFooter = () => {
    if (matchedCount === undefined || totalCount === undefined) return null;
    const filtered = matchedCount < totalCount;
    return (
      <div className="aied-filterpanel__footer">
        <span className="aied-filterpanel__count">
          {matchedCount} of {totalCount} states
        </span>
        {filtered && onResetActive && (
          <Btn kind="ghost" size="sm" onClick={onResetActive}>Reset</Btn>
        )}
      </div>
    );
  };

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
        {renderFooter()}
      </section>
    );
  }

  if (activeFilter === "domains") {
    const selectedCount = selectedDomains?.size ?? 0;
    return (
      <section className="aied-filterpanel">
        <div className="aied-filterpanel__group-row">
          <span className="aied-filterpanel__group-label">Priority domains</span>
          <span className="aied-filterpanel__hint">
            {selectedCount === 0 ? "All shown" : `${selectedCount} selected`}
          </span>
        </div>
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
        <p className="aied-filterpanel__hint aied-filterpanel__hint--block">
          A state passes if any selected domain is in its priority set. Leave empty to match all.
        </p>
        {renderFooter()}
      </section>
    );
  }

  if (activeFilter === "stage") {
    const selectedCount = selectedStages?.size ?? 0;
    return (
      <section className="aied-filterpanel">
        <div className="aied-filterpanel__group-row">
          <span className="aied-filterpanel__group-label">Implementation stage</span>
          <span className="aied-filterpanel__hint">
            {selectedCount === 0 ? "All shown" : `${selectedCount} selected`}
          </span>
        </div>
        <ul className="aied-filterpanel__checklist">
          {STAGE_BUCKETS.map(b => {
            const checked = selectedStages?.has(b.value) ?? false;
            return (
              <li key={b.value}>
                <label className="aied-filterpanel__check">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleStage?.(b.value)}
                  />
                  <span>{b.label}</span>
                  <span className="aied-filterpanel__hint">stage {b.value}</span>
                </label>
              </li>
            );
          })}
        </ul>
        {renderFooter()}
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
        {renderFooter()}
      </section>
    );
  }

  if (activeFilter === "time") {
    return (
      <section className="aied-filterpanel">
        <div className="aied-filterpanel__group-label">Time window</div>
        <div className="aied-filterpanel__chips aied-filterpanel__chips--stack">
          {TIME_RANGES.map(r => {
            const selected = timeWindow === r.value;
            return (
              <button
                key={r.value}
                type="button"
                className={`aied-filterpanel__radio${selected ? " aied-filterpanel__radio--selected" : ""}`}
                onClick={() => onChangeTimeWindow?.(r.value)}
                aria-pressed={selected}
              >
                <span className="aied-filterpanel__radio-dot" aria-hidden />
                {r.label}
              </button>
            );
          })}
        </div>
        <p className="aied-filterpanel__hint aied-filterpanel__hint--block">
          Filters records by their last-updated date.
        </p>
        {renderFooter()}
      </section>
    );
  }

  return null;
};

export default FilterPanel;
