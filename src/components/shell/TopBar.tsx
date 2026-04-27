import React from "react";
import { Btn, SVGIcon, TextField } from "../ui";
import "./TopBar.css";

export type TopBarView = "map-view" | "compare" | "policy-stage" | "source-library" | "methodology";

export interface TopBarSession {
  displayName: string;
  organization: string;
}

export interface TopBarProps {
  activeView: TopBarView;
  onSelectView: (next: TopBarView) => void;
  search: string;
  onSearch: (next: string) => void;
  onExport?: () => void;
  onOpenWhatsNew?: () => void;
  whatsNewVersion?: string;
  manualHref?: string;
  workspaceSession: TopBarSession | null;
  onLogout: () => void;
  teacherMode: boolean;
  onToggleTeacherMode: () => void;
  onHomeClick?: () => void;
}

const TABS: Array<{ id: TopBarView; label: string }> = [
  { id: "map-view", label: "Map view" },
  { id: "compare", label: "Compare regions" },
  { id: "policy-stage", label: "Policy timeline" },
  { id: "source-library", label: "Source library" },
  { id: "methodology", label: "Methodology" },
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

const TopBar: React.FC<TopBarProps> = ({
  activeView,
  onSelectView,
  search,
  onSearch,
  onExport,
  onOpenWhatsNew,
  whatsNewVersion,
  manualHref = "/guides/manual.html",
  workspaceSession,
  onLogout,
  teacherMode,
  onToggleTeacherMode,
  onHomeClick,
}) => {
  return (
    <header className="aied-topbar">
      <button type="button" className="aied-topbar__brand" onClick={onHomeClick}>
        <span className="aied-topbar__brand-mark" aria-hidden>
          <SVGIcon name="compass" size={16} color="#fff" />
        </span>
        <span className="aied-topbar__brand-text">
          <span className="aied-topbar__brand-title">AI Education Policy</span>
          <span className="aied-topbar__brand-sub">Observatory</span>
        </span>
      </button>

      <nav className="aied-topbar__tabs" aria-label="Primary views">
        {TABS.map(tab => {
          const selected = activeView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`aied-topbar__tab${selected ? " aied-topbar__tab--selected" : ""}`}
              aria-current={selected ? "page" : undefined}
              onClick={() => onSelectView(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="aied-topbar__search">
        <TextField
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search policies, states, agencies…"
          iconLeft={<SVGIcon name="search" size={14} />}
          shortcut="⌘K"
          size="sm"
          aria-label="Search the observatory"
        />
      </div>

      <div className="aied-topbar__actions">
        <Btn
          kind="ghost"
          size="md"
          iconOnly
          active={teacherMode}
          onClick={onToggleTeacherMode}
          aria-label="Toggle teacher mode"
          aria-pressed={teacherMode}
          title={teacherMode ? "Teacher mode on" : "Teacher mode"}
        >
          <SVGIcon name="school" size={16} />
        </Btn>

        <a
          className="aied-topbar__icon-link"
          href={manualHref}
          target="_blank"
          rel="noopener"
          aria-label="Reader's manual"
          title="Reader's manual"
        >
          <SVGIcon name="book2" size={16} />
        </a>

        {onOpenWhatsNew && (
          <Btn
            kind="ghost"
            size="md"
            iconOnly
            onClick={onOpenWhatsNew}
            aria-label={whatsNewVersion ? `What's new — v${whatsNewVersion}` : "What's new"}
            title={whatsNewVersion ? `What's new · v${whatsNewVersion}` : "What's new"}
          >
            <SVGIcon name="bell" size={16} />
          </Btn>
        )}

        <Btn kind="ghost" size="md" iconOnly aria-label="Help" title="Help">
          <SVGIcon name="help" size={16} />
        </Btn>

        <span className="aied-topbar__divider" aria-hidden />

        {onExport && (
          <Btn
            kind="primary"
            size="sm"
            gradient
            onClick={onExport}
            iconLeft={<SVGIcon name="download" size={14} />}
          >
            Export data
          </Btn>
        )}

        {workspaceSession && (
          <button
            type="button"
            className="aied-topbar__avatar"
            onClick={onLogout}
            title={`${workspaceSession.displayName} · Click to sign out`}
            aria-label={`Sign out ${workspaceSession.displayName}`}
          >
            {getInitials(workspaceSession.displayName)}
          </button>
        )}
      </div>
    </header>
  );
};

export default TopBar;
