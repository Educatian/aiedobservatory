import React from "react";
import { Btn, SVGIcon, type IconName } from "../ui";
import FilterPanel, { type FilterDimension, type FilterPanelProps } from "./FilterPanel";
import "./SideRail.css";

export interface SideRailSession {
  displayName: string;
  organization: string;
}

export interface SideRailProps {
  open: boolean;
  onToggle: () => void;
  activeFilter: FilterDimension;
  onSelectFilter: (next: FilterDimension) => void;
  onNewAnalysis: () => void;
  workspaceSession: SideRailSession | null;
  onLogout: () => void;
  /** Wired-through props for the filter panel content. */
  filterPanelProps?: Omit<FilterPanelProps, "activeFilter">;
}

interface FilterItem {
  id: FilterDimension;
  label: string;
  icon: IconName;
}

const FILTERS: FilterItem[] = [
  { id: "geo",        label: "Geography",      icon: "geo" },
  { id: "domains",    label: "Policy domains", icon: "domain" },
  { id: "stage",      label: "Policy stage",   icon: "flow" },
  { id: "confidence", label: "Confidence",     icon: "shield" },
  { id: "time",       label: "Time",           icon: "clock" },
];

function getInitials(value: string): string {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase() ?? "")
      .join("") || "AO"
  );
}

const SideRail: React.FC<SideRailProps> = ({
  open,
  onToggle,
  activeFilter,
  onSelectFilter,
  onNewAnalysis,
  workspaceSession,
  onLogout,
  filterPanelProps,
}) => {
  if (!open) {
    return (
      <aside className="aied-rail aied-rail--collapsed" aria-label="Filters (collapsed)">
        <Btn kind="ghost" size="md" iconOnly onClick={onToggle} title="Expand sidebar" aria-label="Expand sidebar">
          <SVGIcon name="menu" size={16} />
        </Btn>
        <button
          type="button"
          className="aied-rail__new aied-rail__new--icon"
          onClick={onNewAnalysis}
          aria-label="New analysis"
          title="New analysis"
        >
          <SVGIcon name="plus" size={16} color="#fff" />
        </button>
        <div className="aied-rail__divider" aria-hidden />
        {FILTERS.map(item => {
          const selected = activeFilter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`aied-rail__pill aied-rail__pill--icon${selected ? " aied-rail__pill--selected" : ""}`}
              onClick={() => onSelectFilter(item.id)}
              title={item.label}
              aria-label={item.label}
              aria-current={selected ? "true" : undefined}
            >
              <SVGIcon name={item.icon} size={16} />
            </button>
          );
        })}
      </aside>
    );
  }

  return (
    <aside className="aied-rail" aria-label="Filters">
      <div className="aied-rail__header">
        <button type="button" className="aied-rail__collapse" onClick={onToggle}>
          <SVGIcon name="chevLeft" size={14} />
          <span>Collapse</span>
        </button>
      </div>

      <div className="aied-rail__cta">
        <button type="button" className="aied-rail__new" onClick={onNewAnalysis}>
          <SVGIcon name="plus" size={14} color="#fff" />
          <span>New analysis</span>
        </button>
      </div>

      <div className="aied-rail__section-label">Core filters</div>

      <div className="aied-rail__pills">
        {FILTERS.map(item => {
          const selected = activeFilter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`aied-rail__pill${selected ? " aied-rail__pill--selected" : ""}`}
              onClick={() => onSelectFilter(item.id)}
              aria-current={selected ? "true" : undefined}
            >
              <SVGIcon name={item.icon} size={16} />
              <span className="aied-rail__pill-label">{item.label}</span>
              {selected && <span className="aied-rail__pill-marker" aria-hidden />}
            </button>
          );
        })}
      </div>

      <div className="aied-rail__spacer" />

      <FilterPanel activeFilter={activeFilter} {...filterPanelProps} />

      {workspaceSession && (
        <div className="aied-rail__account">
          <div className="aied-rail__avatar" aria-hidden>
            {getInitials(workspaceSession.displayName)}
          </div>
          <div className="aied-rail__account-text">
            <div className="aied-rail__account-name">{workspaceSession.displayName}</div>
            <div className="aied-rail__account-org">{workspaceSession.organization}</div>
          </div>
          <button
            type="button"
            className="aied-rail__logout"
            onClick={onLogout}
            aria-label="Sign out"
            title="Sign out"
          >
            <SVGIcon name="arrowRight" size={14} />
          </button>
        </div>
      )}
    </aside>
  );
};

export default SideRail;
