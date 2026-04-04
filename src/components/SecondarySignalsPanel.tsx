import { buildSecondarySignalCards } from "../data/secondaryAiSignals";
import type { PolicyRecord } from "../types";

interface SecondarySignalsPanelProps {
  record: PolicyRecord;
}

export function SecondarySignalsPanel({ record }: SecondarySignalsPanelProps) {
  const cards = buildSecondarySignalCards(record);

  return (
    <section className="secondary-signals-section" id="secondary-signals">
      <div className="secondary-signals-header">
        <div>
          <span className="page-kicker">AI Context Layer</span>
          <h4>State policy, read against external AI benchmarks</h4>
          <p>
            These signals do not replace the coded policy record. They help interpret it against a
            state-edtech trend baseline, international readiness frameworks, and a federal guidance layer.
          </p>
          <div className="trust-boundary-row">
            <span className="trust-boundary-chip primary">Primary evidence lives in the coded record</span>
            <span className="trust-boundary-chip secondary">Secondary context only</span>
          </div>
        </div>
        <div className="secondary-signals-focus">
          <span>Selected state</span>
          <strong>{record.stateName}</strong>
          <small>{record.stateAbbr}</small>
        </div>
      </div>

      <div className="secondary-signals-grid">
        {cards.map((card) => (
          <article className="secondary-signal-card" key={card.id}>
            <div className="secondary-signal-topline">
              <span>{card.label}</span>
              <a href={card.sourceHref} target="_blank" rel="noreferrer">
                Source
              </a>
            </div>
            <h5>{card.sourceTitle}</h5>
            <p>{card.benchmarkValue}</p>

            <div className="secondary-signal-flag">
              <span className="detail-label">Selected-state reading</span>
              <strong>{card.selectedStateSignal}</strong>
            </div>

            <p className="secondary-signal-note">{card.interpretation}</p>
            <div className="secondary-signal-footer">Interpretive benchmark layer, not policy evidence.</div>
          </article>
        ))}
      </div>
    </section>
  );
}
