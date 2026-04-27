import React from "react";
import { Btn, ScoreBar, SVGIcon } from "../ui";
import { fillForStrength, toDisplayState, type DisplayState } from "../../lib/displayState";
import type { PolicyRecord } from "../../types";
import "./views.css";

export interface CompareViewProps {
  records: PolicyRecord[];
  compareStates: string[];
  onChangeState: (slot: number, next: string) => void;
  onAddState?: (next: string) => void;
  onRemoveState?: (next: string) => void;
}

const RADAR_COLORS = [
  "var(--blue-60)",
  "var(--purple-60)",
  "var(--teal-50)",
  "var(--magenta-50)",
  "var(--cyan-50)",
  "var(--green-50)",
];

const DOMAINS = ["Governance", "Instruction", "Privacy", "Professional learning"] as const;

function radarPoint(cx: number, cy: number, r: number, axisIndex: number, totalAxes: number, value: number, max: number): [number, number] {
  const angle = -Math.PI / 2 + (axisIndex / totalAxes) * Math.PI * 2;
  const rr = (value / max) * r;
  return [cx + Math.cos(angle) * rr, cy + Math.sin(angle) * rr];
}

const CompareView: React.FC<CompareViewProps> = ({ records, compareStates, onChangeState, onAddState, onRemoveState }) => {
  const byCode = new Map(records.map(r => [r.stateAbbr, r]));
  const states: DisplayState[] = compareStates
    .map(code => byCode.get(code))
    .filter((r): r is PolicyRecord => Boolean(r))
    .map(toDisplayState);

  const colsCount = states.length;
  const gridStyle = { ["--cols" as string]: String(colsCount) } as React.CSSProperties;

  const allSorted = [...records]
    .map(toDisplayState)
    .sort((a, b) => a.name.localeCompare(b.name));

  function togglePick(code: string) {
    if (compareStates.includes(code)) {
      if (compareStates.length <= 1) return;
      onRemoveState?.(code);
      return;
    }
    if (compareStates.length >= 6) return;
    onAddState?.(code);
  }

  return (
    <div>
      <header className="aied-pagehead">
        <div className="aied-pagehead__col">
          <span className="aied-pagehead__kicker">Compare regions</span>
          <h1 className="aied-pagehead__title">Side-by-side policy comparison</h1>
          <span className="aied-pagehead__sub">Up to six states across all four policy domains.</span>
        </div>
        <span className="aied-pagehead__spacer" />
        <div className="aied-pagehead__actions">
          <Btn kind="ghost" size="sm" iconLeft={<SVGIcon name="download" size={14} />}>Export comparison</Btn>
          <Btn kind="primary" size="sm" gradient iconLeft={<SVGIcon name="sparkle" size={14} />}>Summarize with AI</Btn>
        </div>
      </header>

      <div className="aied-compare__picker">
        <div className="aied-compare__picker-head">
          <div>
            <div className="aied-compare__picker-title">States in comparison</div>
            <div className="aied-compare__picker-sub">Click a state to add or remove it. Comparison supports up to six.</div>
          </div>
          <span className="aied-compare__counter">{compareStates.length}/6 selected</span>
        </div>
        <div className="aied-compare__chips">
          {allSorted.map(s => {
            const on = compareStates.includes(s.code);
            return (
              <button
                key={s.code}
                type="button"
                className={`aied-compare__chip${on ? " aied-compare__chip--on" : ""}`}
                onClick={() => togglePick(s.code)}
                aria-pressed={on}
              >
                <span className="aied-compare__chip-swatch" style={{ background: fillForStrength(s.strength) }} />
                {s.code}
              </button>
            );
          })}
        </div>
      </div>

      <div className="aied-compare__grid" style={gridStyle}>
        <div className="aied-compare__row aied-compare__row--header" style={gridStyle}>
          <div className="aied-compare__cell aied-compare__cell--label">Dimension</div>
          {states.map(s => (
            <div key={s.code} className="aied-compare__cell">
              <div className="aied-compare__cell-state">
                <span className="aied-brief__swatch" style={{ background: fillForStrength(s.strength) }} />
                <span className="aied-compare__cell-state-name">{s.name}</span>
              </div>
              <div className="aied-compare__cell-state-meta">{s.status} · {s.confidence}</div>
            </div>
          ))}
        </div>

        <CompareRow label="Policy strength" states={states}
          render={s => ({ value: `${s.strength}/16`, bar: { value: s.strength, max: 16, color: fillForStrength(s.strength) } })}
        />
        {DOMAINS.map(d => (
          <CompareRow key={d} label={d} states={states}
            render={s => {
              const v = s.domains.find(x => x.name === d)?.score ?? 0;
              const color = v >= 3 ? "var(--purple-60)" : v >= 2 ? "var(--blue-60)" : "var(--cyan-50)";
              return { value: `${v}/4`, bar: { value: v, max: 4, color } };
            }}
          />
        ))}
        <CompareRow label="Source documents" states={states} render={s => ({ value: String(s.sources) })} />
        <CompareRow label="Districts tracked" states={states} render={s => ({ value: s.districts ? String(s.districts) : "—" })} />
        <CompareRow label="Evidence spans" states={states} render={s => ({ value: String(s.evidence) })} />
        <CompareRow label="Last updated" states={states} render={s => ({ value: s.updated })} />
        <CompareRow label="Lead agency" states={states} render={s => ({ value: s.leadAgency, small: true })} />
      </div>

      <CompareRadar states={states} />
    </div>
  );
};

const CompareRow: React.FC<{
  label: string;
  states: DisplayState[];
  render: (s: DisplayState) => { value: string; bar?: { value: number; max: number; color: string }; small?: boolean };
}> = ({ label, states, render }) => {
  const cols = states.length;
  return (
    <div className="aied-compare__row" style={{ ["--cols" as string]: String(cols) } as React.CSSProperties}>
      <div className="aied-compare__cell aied-compare__cell--label">{label}</div>
      {states.map(s => {
        const r = render(s);
        return (
          <div key={s.code} className="aied-compare__cell">
            <span className={`aied-compare__cell-value${r.small ? " aied-compare__cell-value--small" : ""}`}>
              {r.value}
            </span>
            {r.bar && <ScoreBar value={r.bar.value} max={r.bar.max} color={r.bar.color} />}
          </div>
        );
      })}
    </div>
  );
};

const CompareRadar: React.FC<{ states: DisplayState[] }> = ({ states }) => {
  if (states.length === 0) return null;
  const cx = 180, cy = 180, r = 120;
  return (
    <div className="aied-compare__radar">
      <div className="aied-compare__radar-head">
        <div>
          <div className="aied-compare__picker-title">Domain coverage</div>
          <div className="aied-compare__picker-sub">Per-domain scores across selected states</div>
        </div>
      </div>
      <div className="aied-compare__radar-body">
        <svg width={360} height={360} role="img" aria-label="Domain coverage radar">
          {[1, 2, 3, 4].map(level => (
            <polygon
              key={level}
              points={DOMAINS.map((_, i) => radarPoint(cx, cy, r, i, DOMAINS.length, level, 4).join(",")).join(" ")}
              fill="none"
              stroke="var(--cds-border-subtle-01)"
              strokeWidth={1}
            />
          ))}
          {DOMAINS.map((d, i) => {
            const [x, y] = radarPoint(cx, cy, r, i, DOMAINS.length, 4, 4);
            return <line key={d} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--cds-border-subtle-01)" strokeWidth={1} />;
          })}
          {DOMAINS.map((d, i) => {
            const [x, y] = radarPoint(cx, cy, r, i, DOMAINS.length, 4 + 0.6, 4);
            return (
              <text key={d} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
                style={{ font: "500 11px/1 var(--cds-font-sans)", fill: "var(--cds-text-helper)" }}>
                {d}
              </text>
            );
          })}
          {states.map((s, i) => {
            const color = RADAR_COLORS[i % RADAR_COLORS.length];
            const pts = DOMAINS.map((d, j) => radarPoint(cx, cy, r, j, DOMAINS.length, s.domains.find(x => x.name === d)?.score ?? 0, 4)).map(p => p.join(",")).join(" ");
            return (
              <g key={s.code}>
                <polygon points={pts} fill={color} fillOpacity={0.12} stroke={color} strokeWidth={1.5} />
                {DOMAINS.map((d, j) => {
                  const [x, y] = radarPoint(cx, cy, r, j, DOMAINS.length, s.domains.find(x => x.name === d)?.score ?? 0, 4);
                  return <circle key={d} cx={x} cy={y} r={3} fill={color} />;
                })}
              </g>
            );
          })}
        </svg>
        <div className="aied-compare__legend">
          {states.map((s, i) => (
            <div key={s.code} className="aied-compare__legend-row">
              <span className="aied-compare__legend-bar" style={{ background: RADAR_COLORS[i % RADAR_COLORS.length] }} />
              <span className="aied-brief__domain-name">{s.name}</span>
              <span className="aied-brief__domain-score">{s.code}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompareView;
