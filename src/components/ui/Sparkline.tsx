import React from "react";

export interface SparklineProps {
  points: number[];
  /** Fill color/token reference. */
  color?: string;
  width?: number;
  height?: number;
  /** Render area fill below the line. */
  fill?: boolean;
  /** Stroke width in px. */
  stroke?: number;
  className?: string;
}

const Sparkline: React.FC<SparklineProps> = ({
  points,
  color = "var(--cds-button-primary)",
  width = 100,
  height = 28,
  fill = true,
  stroke = 1.5,
  className,
}) => {
  const reactId = React.useId().replace(/[:]/g, "");
  if (!points || points.length === 0) return null;

  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1 || 1)) * width;
      const y = height - ((p - min) / span) * (height - 2) - 1;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const gradientId = `aied-spark-${reactId}`;

  return (
    <svg
      width={width}
      height={height}
      className={className}
      style={{ display: "block" }}
      role="img"
      aria-hidden="true"
      focusable={false}
    >
      {fill && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {fill && <path d={`${path} L ${width} ${height} L 0 ${height} Z`} fill={`url(#${gradientId})`} />}
      <path d={path} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
    </svg>
  );
};

export default Sparkline;
