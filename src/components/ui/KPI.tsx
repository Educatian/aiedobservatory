import React from "react";
import "./KPI.css";

export type KPITrend = "up" | "down" | "flat";

export interface KPIProps {
  label: string;
  value: React.ReactNode;
  /** Subtext below the value. */
  sub?: React.ReactNode;
  /** Optional trend indicator coloring the sub text. */
  trend?: KPITrend;
  /** Optional small icon shown before the label. */
  icon?: React.ReactNode;
  /** Optional sparkline rendered to the right of the value. */
  sparkline?: React.ReactNode;
  className?: string;
}

const KPI: React.FC<KPIProps> = ({ label, value, sub, trend, icon, sparkline, className }) => {
  const subClasses = [
    "aied-kpi__sub",
    trend ? `aied-kpi__sub--${trend}` : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={`aied-kpi ${className ?? ""}`.trim()}>
      <div className="aied-kpi__head">
        {icon && <span className="aied-kpi__icon">{icon}</span>}
        <span className="aied-kpi__label">{label}</span>
      </div>
      <div className="aied-kpi__row">
        <span className="aied-kpi__value">{value}</span>
        {sparkline && <span className="aied-kpi__spark">{sparkline}</span>}
      </div>
      {sub && <div className={subClasses}>{sub}</div>}
    </div>
  );
};

export default KPI;
