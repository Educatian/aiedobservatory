import React from "react";
import { Btn, ScoreBar, SVGIcon, Tag } from "../ui";
import { fillForStrength, type DisplayState } from "../../lib/displayState";
import "./views.css";

export interface BriefPanelProps {
  state: DisplayState;
}

function uncertaintyLabel(c: DisplayState["confidence"]): string {
  return c === "High" ? "Low" : c === "Moderate" ? "Med" : "High";
}

function confidencePercent(c: DisplayState["confidence"]): string {
  return c === "High" ? "95%" : c === "Moderate" ? "85%" : "70%";
}

function scoreColor(score: number): string {
  if (score >= 3) return "var(--purple-60)";
  if (score >= 2) return "var(--blue-60)";
  return "var(--cyan-50)";
}

const BriefPanel: React.FC<BriefPanelProps> = ({ state }) => {
  const fill = fillForStrength(state.strength);

  return (
    <section className="aied-brief">
      <header className="aied-brief__heading">
        <span className="aied-brief__kicker">Executive brief</span>
        <div className="aied-brief__name-row">
          <span className="aied-brief__name">{state.name}</span>
          <Tag
            kind={state.confidence === "High" ? "green" : state.confidence === "Moderate" ? "yellow" : "red"}
            dot
          >
            {state.confidence} confidence
          </Tag>
        </div>
      </header>

      <div className="aied-brief__three">
        <div className="aied-brief__cell">
          <div className="aied-brief__cell-label">Policy strength</div>
          <div className="aied-brief__cell-value" style={{ color: fill }}>
            <span className="aied-brief__swatch" style={{ background: fill }} />
            {state.strength}/16
          </div>
        </div>
        <div className="aied-brief__cell">
          <div className="aied-brief__cell-label">Evidence basis</div>
          <div className="aied-brief__cell-value aied-brief__cell-value--small">{state.evidenceBasis}</div>
        </div>
        <div className="aied-brief__cell">
          <div className="aied-brief__cell-label">Uncertainty</div>
          <div className="aied-brief__cell-value">{uncertaintyLabel(state.confidence)}</div>
        </div>
      </div>

      <div className="aied-brief__domains">
        {state.domains.map(d => (
          <div key={d.name}>
            <div className="aied-brief__domain-head">
              <span className="aied-brief__domain-name">{d.name}</span>
              <span className="aied-brief__domain-score">{d.score}/4</span>
            </div>
            <ScoreBar value={d.score} max={4} color={scoreColor(d.score)} ariaLabel={`${d.name} score`} />
          </div>
        ))}
      </div>

      {state.priorityDomains.length > 0 && (
        <div>
          <div className="aied-brief__section-label">Priority policy domains</div>
          <div className="aied-brief__chips">
            {state.priorityDomains.map(d => (
              <Tag key={d} kind="blue">{d}</Tag>
            ))}
          </div>
        </div>
      )}

      <div className="aied-brief__statement">
        <div className="aied-brief__section-label">Confirmed evidence statement</div>
        {state.name} is currently coded as{" "}
        <strong>{state.status.toLowerCase()} guidance</strong> with{" "}
        <strong>{state.evidenceBasis.toLowerCase()}</strong>, based on{" "}
        <strong className="link">{state.sources} source document{state.sources === 1 ? "" : "s"}</strong>,{" "}
        <strong className="link">{state.evidence} evidence span{state.evidence === 1 ? "" : "s"}</strong>, and{" "}
        <strong>{confidencePercent(state.confidence)} confidence.</strong>
      </div>

      <div>
        <div className="aied-brief__section-label">Provisional interpretation</div>
        <p className="aied-brief__interpretation">
          {state.policyOrientation || "Promotional."} {Math.max(1, Math.floor(state.coded / 24))} peer record(s)
          in the current benchmark set score higher on policy strength. This can be used as a comparative
          benchmark, but not as a legal determination.
        </p>
      </div>

      <div className="aied-brief__actions">
        <Btn kind="primary" gradient size="sm" iconLeft={<SVGIcon name="document" size={14} />}>
          View sources
        </Btn>
        <Btn kind="tertiary" size="sm" iconLeft={<SVGIcon name="download" size={14} />}>
          Export
        </Btn>
      </div>
    </section>
  );
};

export default BriefPanel;
