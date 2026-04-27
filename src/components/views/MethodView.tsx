import React from "react";
import "./views.css";

const STEPS = [
  {
    n: "01",
    t: "Ingestion",
    d: "We crawl state education agencies, board filings, and rule-making dockets weekly. Documents are deduplicated, OCR'd where needed, and stored as immutable artifacts with provenance metadata.",
  },
  {
    n: "02",
    t: "Structured coding",
    d: "Each document is segmented and labeled across four domains — Governance, Instruction, Privacy, and Professional learning. A panel of agents proposes spans; a second pass adjudicates conflicts. Every claim must be tied to evidence spans.",
  },
  {
    n: "03",
    t: "Confidence weighting",
    d: "Every claim carries an evidence basis (Strong / Moderate / Limited / Emerging) and an uncertainty band. Low-evidence claims are flagged in the UI and excluded from comparative aggregates.",
  },
  {
    n: "04",
    t: "Release",
    d: "Coded records are versioned. The map view always reflects the most recently released coding; previous versions remain queryable in the Source library.",
  },
];

const MethodView: React.FC = () => {
  return (
    <article className="aied-method">
      <div className="aied-method__kicker">Methodology</div>
      <h1 className="aied-method__title">How we code AI education policy</h1>
      <p className="aied-method__lede">
        The Observatory applies an agentic policy-surveillance framework to public source documents. Each
        state record is the result of three pipelines: ingestion, structured coding, and confidence weighting.
      </p>
      {STEPS.map(s => (
        <section key={s.n} className="aied-method__step">
          <div className="aied-method__step-n">{s.n}</div>
          <div>
            <div className="aied-method__step-t">{s.t}</div>
            <p className="aied-method__step-d">{s.d}</p>
          </div>
        </section>
      ))}
    </article>
  );
};

export default MethodView;
