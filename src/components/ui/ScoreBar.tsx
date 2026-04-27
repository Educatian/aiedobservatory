import React from "react";
import "./ScoreBar.css";

export interface ScoreBarProps {
  value: number;
  max?: number;
  /** Color of the filled portion. Accepts any CSS color or a token reference. */
  color?: string;
  height?: number;
  /** Show a small numeric label after the bar. */
  showLabel?: boolean;
  className?: string;
  ariaLabel?: string;
}

const ScoreBar: React.FC<ScoreBarProps> = ({
  value,
  max = 4,
  color = "var(--cds-button-primary)",
  height = 6,
  showLabel = false,
  className,
  ariaLabel,
}) => {
  const safeMax = max <= 0 ? 1 : max;
  const ratio = Math.max(0, Math.min(1, value / safeMax));
  const pct = `${(ratio * 100).toFixed(1)}%`;

  return (
    <div
      className={`aied-scorebar ${className ?? ""}`.trim()}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={value}
    >
      <div className="aied-scorebar__track" style={{ height }}>
        <div className="aied-scorebar__fill" style={{ width: pct, background: color }} />
      </div>
      {showLabel && (
        <span className="aied-scorebar__label">
          {value}<span className="aied-scorebar__label-sep">/</span>{safeMax}
        </span>
      )}
    </div>
  );
};

export default ScoreBar;
