import { startTransition, useDeferredValue, useEffect, useEffectEvent, useMemo, useState } from "react";
import { CompareMatrixView } from "./components/CompareMatrixView";
import { ExecutiveBriefPanel } from "./components/ExecutiveBriefPanel";
import { ImplementationReadinessSection } from "./components/ImplementationReadinessSection";
import { AppIcon } from "./components/AppIcon";
import { LandingPage } from "./components/LandingPage";
import { LiveActivityRail } from "./components/LiveActivityRail";
import { LoginModal, type WorkspaceSession } from "./components/LoginModal";
import { MethodologySection } from "./components/MethodologySection";
import { NewAnalysisDrawer } from "./components/NewAnalysisDrawer";
import { OperatorSurface } from "./components/OperatorSurface";
import { PolicyChangeLog } from "./components/PolicyChangeLog";
import { PolicyDetailPanel } from "./components/PolicyDetailPanel";
import { DistrictLayerPanel } from "./components/DistrictLayerPanel";
import { PolicyDomainsSection } from "./components/PolicyDomainsSection";
import { PolicyStageSection } from "./components/PolicyStageSection";
import { PolicyTable } from "./components/PolicyTable";
import { PolicyTileMap } from "./components/PolicyTileMap";
import { ProjectOverviewPage } from "./components/ProjectOverviewPage";
import { DeveloperPage } from "./components/DeveloperPage";
import { SecondarySignalsPanel } from "./components/SecondarySignalsPanel";
import { SourceLibrarySection } from "./components/SourceLibrarySection";
import { TeacherGuidancePanel } from "./components/TeacherGuidancePanel";
import { TrustPanel } from "./components/TrustPanel";
import { WhatsNewModal } from "./components/WhatsNewModal";
import { SideRail, TopBar, type FilterDimension, type TopBarView } from "./components/shell";
import { SegmentControl } from "./components/ui";
import { getPolicyStageLabel, policyRecords as initialPolicyRecords } from "./data/policyData";
import { currentRelease } from "./data/releaseNotes";
import type { PolicyEvent, PolicyRecord } from "./types";

const PROJECT_POLICY_DOMAINS = ["AI Use", "Assessment", "Privacy", "Teacher PD"];

function activeSectionToTopBarView(section: NavSection): TopBarView {
  if (section === "policy-domains" || section === "table-view") return "map-view";
  return section;
}

const WHATS_NEW_KEY = "aiedob.whatsNewSeenVersion";

type CoverageFilter = "all" | "coded" | "queued";
type AppPage = "landing" | "dashboard" | "projectoverview" | "developer";
type NavSection =
  | "map-view"
  | "compare"
  | "policy-stage"
  | "source-library"
  | "methodology"
  | "policy-domains"
  | "table-view";

const WORKSPACE_SESSION_KEY = "academic-sentinel.workspace-session";
const TEST_WORKSPACE_SESSION: WorkspaceSession = {
  displayName: "Observatory Access",
  email: "workspace@local.aied-policy-atlas",
  organization: "AI Education Policy Observatory Lab"
};

function getAppPageFromPath(pathname: string): AppPage {
  const normalized = pathname.toLowerCase();
  if (normalized.startsWith("/projectoverview")) return "projectoverview";
  if (normalized.startsWith("/developer")) return "developer";
  if (normalized.startsWith("/app")) return "dashboard";
  return "landing";
}

function getActiveSectionFromHash(hash: string): NavSection {
  const normalized = hash.replace(/^#/, "");

  switch (normalized) {
    case "compare":
    case "policy-stage":
    case "source-library":
    case "methodology":
    case "policy-domains":
    case "table-view":
      return normalized;
    case "timeline":
      return "policy-stage";
    case "map-view":
    default:
      return "map-view";
  }
}

function mergeLiveRecords(currentRecords: PolicyRecord[], incomingRecords: PolicyRecord[]): PolicyRecord[] {
  const incomingByState = new Map(incomingRecords.map((record) => [record.stateAbbr, record]));
  return currentRecords.map((record) => incomingByState.get(record.stateAbbr) ?? record);
}

function readWorkspaceSession(): WorkspaceSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(WORKSPACE_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<WorkspaceSession>;
    const displayName = parsed.displayName?.trim() ?? "";
    const email = parsed.email?.trim() ?? "";
    const organization = parsed.organization?.trim() ?? "";

    if (!displayName || !email || !organization) {
      return null;
    }

    if (
      displayName === "Dr. Sarah Chen" ||
      displayName === "Sarah Chen" ||
      organization.toLowerCase() === "sett"
    ) {
      return TEST_WORKSPACE_SESSION;
    }

    return { displayName, email, organization };
  } catch {
    return null;
  }
}

function isLocalWorkspaceSession(session: WorkspaceSession | null): boolean {
  return Boolean(session?.email.endsWith("@local.aied-policy-atlas"));
}

function getWorkspaceLabel(session: WorkspaceSession | null): string {
  if (!session) return "Research Workspace";
  if (isLocalWorkspaceSession(session)) return "Observatory Access";
  return session.displayName;
}

function App() {
  const [records, setRecords] = useState(initialPolicyRecords);
  const [policyEvents, setPolicyEvents] = useState<PolicyEvent[]>([]);
  const [selectedState, setSelectedState] = useState("CA");
  const [coverageFilter, setCoverageFilter] = useState<CoverageFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [compareStates, setCompareStates] = useState<string[]>(["CA", "TX", "FL"]);
  const [isAnalysisDrawerOpen, setIsAnalysisDrawerOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [livePolling, setLivePolling] = useState(true);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [playbackRunning, setPlaybackRunning] = useState(false);
  const [workspaceSession, setWorkspaceSession] = useState<WorkspaceSession | null>(() =>
    readWorkspaceSession()
  );
  const [teacherMode, setTeacherMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches
  );
  const [whatsNewOpen, setWhatsNewOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(WHATS_NEW_KEY) !== currentRelease.version;
    } catch {
      return false;
    }
  });
  const closeWhatsNew = () => {
    setWhatsNewOpen(false);
    try {
      window.localStorage.setItem(WHATS_NEW_KEY, currentRelease.version);
    } catch {
      /* noop */
    }
  };
  const openWhatsNew = () => setWhatsNewOpen(true);
  useEffect(() => {
    const onPrep = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail === "enable_teacher_mode") setTeacherMode(true);
    };
    window.addEventListener("aiedob:release-prep", onPrep);
    return () => window.removeEventListener("aiedob:release-prep", onPrep);
  }, []);
  const [inspectorTab, setInspectorTab] = useState<"brief" | "activity" | "log">("brief");
  const [activeFilter, setActiveFilter] = useState<FilterDimension>("geo");
  const [viewMode, setViewMode] = useState<"state" | "district">("state");
  const [showBroadbandOverlay, setShowBroadbandOverlay] = useState(false);
  const [broadbandPatternHatched, setBroadbandPatternHatched] = useState(false);
  const [pendingDashboardSection, setPendingDashboardSection] = useState<NavSection>("map-view");
  const [currentPage, setCurrentPage] = useState<AppPage>(() =>
    typeof window === "undefined" ? "landing" : getAppPageFromPath(window.location.pathname)
  );
  const [activeSection, setActiveSection] = useState<NavSection>(() =>
    typeof window === "undefined" ? "map-view" : getActiveSectionFromHash(window.location.hash)
  );
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

  const codedRecords = useMemo(
    () => records.filter((record) => record.snapshotStatus === "coded"),
    [records]
  );

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesCoverage =
        coverageFilter === "all" ? true : record.snapshotStatus === coverageFilter;
      const matchesQuery =
        normalizedQuery.length === 0
          ? true
          : record.stateName.toLowerCase().includes(normalizedQuery) ||
            record.stateAbbr.toLowerCase().includes(normalizedQuery);

      return matchesCoverage && matchesQuery;
    });
  }, [coverageFilter, normalizedQuery, records]);

  const filteredStateIds = useMemo(
    () => new Set(filteredRecords.map((record) => record.stateAbbr)),
    [filteredRecords]
  );

  const selectedRecord = records.find((record) => record.stateAbbr === selectedState) ?? records[0];

  const benchmarkRecords = useMemo(
    () => codedRecords.filter((record) => record.stateAbbr !== selectedRecord.stateAbbr).slice(0, 5),
    [codedRecords, selectedRecord.stateAbbr]
  );

  const totalCount = records.length;
  const codedCount = codedRecords.length;
  const highConfidenceCount = records.filter((record) => record.confidence >= 0.85).length;
  const releasedGuidanceCount = records.filter((record) => record.implementationStage >= 3).length;
  const dominantStage = getPolicyStageLabel(
    Math.round(
      codedRecords.reduce((sum, record) => sum + record.implementationStage, 0) /
        Math.max(codedCount, 1)
    )
  );

  const recentEvents = useMemo(() => {
    const sourceEvents = policyEvents
      .filter((event) => event.eventType === "source_added" || event.eventType === "record_created")
      .slice(0, 4);
    const routingEvents = policyEvents
      .filter((event) =>
        ["approval_route_changed", "review_status_changed", "stage_changed"].includes(event.eventType)
      )
      .slice(0, 4);
    const scoringEvents = policyEvents
      .filter((event) => ["confidence_changed", "record_updated"].includes(event.eventType))
      .slice(0, 4);

    return [...sourceEvents, ...routingEvents, ...scoringEvents]
      .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
      .slice(0, 12);
  }, [policyEvents]);

  const playbackTimeline = useMemo(() => [...recentEvents].reverse(), [recentEvents]);
  const safePlaybackIndex =
    playbackTimeline.length === 0 ? 0 : Math.min(playbackIndex, playbackTimeline.length - 1);
  const activePlaybackEvent = playbackTimeline[safePlaybackIndex] ?? null;
  const latestChangedLabel = recentEvents[0]
    ? new Date(recentEvents[0].occurredAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      })
    : "April 4, 2026";

  const pulseStateIds = useMemo(
    () =>
      new Set(
        policyEvents
          .filter((event) =>
            ["record_created", "record_updated", "review_status_changed", "stage_changed"].includes(
              event.eventType
            )
          )
          .map((event) => event.stateAbbr)
          .slice(0, 8)
      ),
    [policyEvents]
  );

  const confidenceShiftStateIds = useMemo(
    () =>
      new Set(
        policyEvents
          .filter((event) => event.eventType === "confidence_changed")
          .map((event) => event.stateAbbr)
          .slice(0, 8)
      ),
    [policyEvents]
  );

  const sourceAddedStateIds = useMemo(
    () =>
      new Set(
        policyEvents
          .filter((event) => event.eventType === "source_added" || event.eventType === "record_created")
          .map((event) => event.stateAbbr)
          .slice(0, 8)
      ),
    [policyEvents]
  );

  const refreshLiveData = useEffectEvent(async () => {
    try {
      const [recordsResponse, eventsResponse] = await Promise.all([
        fetch(`/policy-records.json?ts=${Date.now()}`, { cache: "no-store" }),
        fetch(`/policy-events.json?ts=${Date.now()}`, { cache: "no-store" })
      ]);

      if (recordsResponse.ok) {
        const nextRecords = (await recordsResponse.json()) as PolicyRecord[];
        startTransition(() => {
          setRecords((current) => mergeLiveRecords(current, nextRecords));
        });
      }

      if (eventsResponse.ok) {
        const nextEvents = (await eventsResponse.json()) as PolicyEvent[];
        startTransition(() => {
          setPolicyEvents(nextEvents);
        });
      }
    } catch {
      // Keep local fallback snapshot.
    }
  });

  useEffect(() => {
    const fallbackPool = codedRecords.map((record) => record.stateAbbr);
    setCompareStates((current) => {
      const next = [selectedState, ...current.filter((state) => state !== selectedState)];
      for (const candidate of fallbackPool) {
        if (next.length >= 3) break;
        if (!next.includes(candidate)) next.push(candidate);
      }
      return next.slice(0, 3);
    });
  }, [codedRecords, selectedState]);

  useEffect(() => {
    void refreshLiveData();
    if (!livePolling) return undefined;

    const intervalId = window.setInterval(() => {
      void refreshLiveData();
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [livePolling, refreshLiveData]);

  useEffect(() => {
    function handleLocationChange() {
      setCurrentPage(getAppPageFromPath(window.location.pathname));
      setActiveSection(getActiveSectionFromHash(window.location.hash));
    }

    window.addEventListener("hashchange", handleLocationChange);
    window.addEventListener("popstate", handleLocationChange);
    handleLocationChange();

    return () => {
      window.removeEventListener("hashchange", handleLocationChange);
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, []);

  useEffect(() => {
    if (!workspaceSession && currentPage === "dashboard" && typeof window !== "undefined") {
      window.history.replaceState({}, "", "/");
      setCurrentPage("landing");
    }
  }, [currentPage, workspaceSession]);

  useEffect(() => {
    document.title =
      currentPage === "projectoverview"
        ? "Project Overview - AI Education Policy Observatory"
        : currentPage === "landing"
          ? "AI Education Policy Observatory"
          : "AI Education Policy Observatory | Workspace";
  }, [currentPage]);

  function selectState(nextState: string) {
    startTransition(() => {
      setSelectedState(nextState);
    });
  }

  function openDashboard(section: NavSection = "map-view") {
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", `/app#${section}`);
      setCurrentPage("dashboard");
      setActiveSection(section);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function navigateToDashboard(section: NavSection = "map-view") {
    if (!workspaceSession && typeof window !== "undefined") {
      setPendingDashboardSection(section);
      setIsLoginModalOpen(true);
      return;
    }

    openDashboard(section);
  }

  function navigateToDeveloper() {
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", "/developer");
      setCurrentPage("developer");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function navigateToProjectOverview() {
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", "/projectoverview");
      setCurrentPage("projectoverview");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function navigateToLanding() {
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", "/");
      setCurrentPage("landing");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleWorkspaceLogin(session: WorkspaceSession) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(WORKSPACE_SESSION_KEY, JSON.stringify(session));
    }

    setWorkspaceSession(session);
    setIsLoginModalOpen(false);
    openDashboard(pendingDashboardSection);
  }

  function handleSkipTesting() {
    handleWorkspaceLogin(TEST_WORKSPACE_SESSION);
  }

  function handleWorkspaceLogout() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(WORKSPACE_SESSION_KEY);
    }

    setWorkspaceSession(null);
    setIsAnalysisDrawerOpen(false);
    navigateToLanding();
  }

  function changeCompareState(slot: number, nextState: string) {
    setCompareStates((current) => {
      const next = [...current];
      const existingIndex = next.findIndex((state, index) => state === nextState && index !== slot);
      if (existingIndex >= 0) {
        next[existingIndex] = next[slot];
      }
      next[slot] = nextState;
      return next;
    });
  }

  if (currentPage === "landing") {
    return (
      <>
        <LandingPage
          isAuthenticated={Boolean(workspaceSession)}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onOpenDashboard={() => navigateToDashboard("map-view")}
          onOpenProjectOverview={navigateToProjectOverview}
          onOpenDeveloper={navigateToDeveloper}
          onSkipTesting={handleSkipTesting}
        />
        <LoginModal
          open={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSubmit={handleWorkspaceLogin}
          onSkipTesting={handleSkipTesting}
        />
      </>
    );
  }

  if (currentPage === "developer") {
    return (
      <>
        <DeveloperPage
          onOpenDashboard={() => navigateToDashboard("map-view")}
          onOpenLanding={navigateToLanding}
        />
        <LoginModal
          open={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSubmit={handleWorkspaceLogin}
          onSkipTesting={handleSkipTesting}
        />
      </>
    );
  }

  if (currentPage === "projectoverview") {
    return (
      <>
        <ProjectOverviewPage records={records} onOpenDashboard={navigateToDashboard} />
        <LoginModal
          open={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSubmit={handleWorkspaceLogin}
          onSkipTesting={handleSkipTesting}
        />
      </>
    );
  }

  return (
    <div className="aied-app aied-themed">
      <NewAnalysisDrawer
        open={isAnalysisDrawerOpen}
        records={records}
        selectedState={selectedState}
        onClose={() => setIsAnalysisDrawerOpen(false)}
        onNavigate={navigateToDashboard}
        onSelectState={selectState}
      />

      <LoginModal
        open={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSubmit={handleWorkspaceLogin}
        onSkipTesting={handleSkipTesting}
      />

      <TopBar
        activeView={activeSectionToTopBarView(activeSection)}
        onSelectView={navigateToDashboard}
        search={searchQuery}
        onSearch={setSearchQuery}
        onOpenWhatsNew={openWhatsNew}
        whatsNewVersion={currentRelease.version}
        workspaceSession={
          workspaceSession
            ? {
                displayName: getWorkspaceLabel(workspaceSession),
                organization: workspaceSession.organization,
              }
            : null
        }
        onLogout={handleWorkspaceLogout}
        teacherMode={teacherMode}
        onToggleTeacherMode={() => setTeacherMode((v) => !v)}
        onHomeClick={navigateToLanding}
      />

      <div className="aied-app__body">
        <SideRail
          open={!sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((v) => !v)}
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
          onNewAnalysis={() => setIsAnalysisDrawerOpen(true)}
          workspaceSession={
            workspaceSession
              ? {
                  displayName: getWorkspaceLabel(workspaceSession),
                  organization: workspaceSession.organization,
                }
              : null
          }
          onLogout={handleWorkspaceLogout}
          filterPanelProps={{
            geoMode: viewMode,
            onChangeGeoMode: setViewMode,
            coverage: coverageFilter,
            onChangeCoverage: setCoverageFilter,
            policyDomains: PROJECT_POLICY_DOMAINS,
          }}
        />

        <main className="aied-app__main">
          <div className="aied-workspace">
            <aside className="aied-inspector" aria-label={`${selectedRecord.stateName} inspector`}>
              <header className="aied-inspector__header">
                <div className="aied-inspector__state-row">
                  <h2 className="aied-inspector__state-name">{selectedRecord.stateName}</h2>
                  <span className="aied-inspector__state-abbr">{selectedRecord.stateAbbr}</span>
                  <span className="aied-inspector__live-dot" aria-hidden="true" />
                  <span className="aied-inspector__updated">{latestChangedLabel}</span>
                </div>

                <div className="aied-inspector__stats">
                  <div className="aied-inspector__stat">
                    <span className="aied-inspector__stat-label">States</span>
                    <span className="aied-inspector__stat-value">{totalCount}</span>
                  </div>
                  <div className="aied-inspector__stat">
                    <span className="aied-inspector__stat-label">Coded</span>
                    <span className="aied-inspector__stat-value">{codedCount}</span>
                  </div>
                  <div className="aied-inspector__stat">
                    <span className="aied-inspector__stat-label">Guidance</span>
                    <span className="aied-inspector__stat-value">{releasedGuidanceCount}</span>
                  </div>
                  <div className="aied-inspector__stat">
                    <span className="aied-inspector__stat-label">Stage</span>
                    <span className="aied-inspector__stat-value">{dominantStage}</span>
                  </div>
                </div>

                <nav className="aied-inspector__tabs" role="tablist" aria-label="Inspector tabs">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={inspectorTab === "brief"}
                    className={`aied-inspector__tab${inspectorTab === "brief" ? " aied-inspector__tab--selected" : ""}`}
                    onClick={() => setInspectorTab("brief")}
                  >Brief</button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={inspectorTab === "activity"}
                    className={`aied-inspector__tab${inspectorTab === "activity" ? " aied-inspector__tab--selected" : ""}`}
                    onClick={() => setInspectorTab("activity")}
                  >Activity</button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={inspectorTab === "log"}
                    className={`aied-inspector__tab${inspectorTab === "log" ? " aied-inspector__tab--selected" : ""}`}
                    onClick={() => setInspectorTab("log")}
                  >Details</button>
                </nav>
              </header>

              <div className="aied-inspector__body">
                <DistrictLayerPanel stateAbbr={selectedRecord.stateAbbr} />

                {inspectorTab === "brief" && (
                  <ExecutiveBriefPanel record={selectedRecord} benchmarkRecords={benchmarkRecords} />
                )}

                {inspectorTab === "activity" && (
                  <LiveActivityRail
                    events={recentEvents}
                    livePolling={livePolling}
                    playbackIndex={safePlaybackIndex}
                    playbackRunning={playbackRunning}
                    onToggleLivePolling={() => setLivePolling((current) => !current)}
                    onTogglePlayback={() => setPlaybackRunning((current) => !current)}
                    onPlaybackIndexChange={setPlaybackIndex}
                    onSelectEvent={(event, index) => {
                      setPlaybackIndex(Math.max(index, 0));
                      setPlaybackRunning(false);
                      selectState(event.stateAbbr);
                    }}
                  />
                )}

                {inspectorTab === "log" && (
                  <>
                    <PolicyChangeLog
                      stateAbbr={selectedRecord.stateAbbr}
                      stateName={selectedRecord.stateName}
                      events={policyEvents}
                      maxItems={5}
                    />
                    {teacherMode ? (
                      <TeacherGuidancePanel record={selectedRecord} />
                    ) : (
                      <PolicyDetailPanel record={selectedRecord} />
                    )}
                  </>
                )}
              </div>
            </aside>

            <section className="aied-map-ground">
              <PolicyTileMap
                records={records}
                selectedState={selectedState}
                visibleIds={filteredStateIds}
                pulseStates={pulseStateIds}
                confidenceShiftStates={confidenceShiftStateIds}
                sourceAddedStates={sourceAddedStateIds}
                playbackState={activePlaybackEvent?.stateAbbr ?? null}
                viewMode={viewMode}
                showBroadbandOverlay={showBroadbandOverlay}
                broadbandPatternHatched={broadbandPatternHatched}
                onSelect={selectState}
              />

              <div className="aied-map-controls">
                <SegmentControl
                  value={viewMode}
                  onChange={setViewMode}
                  options={[
                    { value: "state", label: "State" },
                    { value: "district", label: "District" },
                  ]}
                  ariaLabel="Map granularity"
                />

                {viewMode === "district" && (
                  <div className="aied-broadband-toggle">
                    <label className="aied-broadband-toggle__row">
                      <input
                        type="checkbox"
                        checked={showBroadbandOverlay}
                        onChange={(e) => setShowBroadbandOverlay(e.target.checked)}
                      />
                      <span>Broadband overlay (ACS 2023)</span>
                    </label>
                    {showBroadbandOverlay && (
                      <label className="aied-broadband-toggle__row aied-broadband-toggle__row--sub">
                        <input
                          type="checkbox"
                          checked={broadbandPatternHatched}
                          onChange={(e) => setBroadbandPatternHatched(e.target.checked)}
                        />
                        <span>Highlight under-served counties</span>
                      </label>
                    )}
                  </div>
                )}
              </div>

              <div className="aied-legend" aria-label="Policy strength legend">
                <div className="aied-legend__title">Policy strength</div>
                <div className="aied-legend__scale" aria-hidden="true">
                  <span style={{ background: "var(--aied-strength-no-data)" }} />
                  <span style={{ background: "var(--aied-strength-emerging)" }} />
                  <span style={{ background: "var(--aied-strength-developing)" }} />
                  <span style={{ background: "var(--aied-strength-established)" }} />
                  <span style={{ background: "var(--aied-strength-robust)" }} />
                </div>
                <div className="aied-legend__labels">
                  <span>Weak</span>
                  <span>Robust</span>
                </div>
                <ul className="aied-legend__buckets">
                  <li className="aied-legend__bucket">
                    <span className="aied-legend__swatch" style={{ background: "var(--aied-strength-emerging)" }} />
                    Emerging · 5–8
                  </li>
                  <li className="aied-legend__bucket">
                    <span className="aied-legend__swatch" style={{ background: "var(--aied-strength-developing)" }} />
                    Developing · 9–11
                  </li>
                  <li className="aied-legend__bucket">
                    <span className="aied-legend__swatch" style={{ background: "var(--aied-strength-established)" }} />
                    Established · 12–13
                  </li>
                  <li className="aied-legend__bucket">
                    <span className="aied-legend__swatch" style={{ background: "var(--aied-strength-robust)" }} />
                    Robust · 14–16
                  </li>
                </ul>
              </div>

              {activeSection !== "map-view" && (
                <div className="aied-section-overlay">
                  <div className="aied-section-overlay__body">
                    {activeSection === "compare" && (
                      <CompareMatrixView
                        records={codedRecords}
                        compareStates={compareStates}
                        onChangeState={changeCompareState}
                      />
                    )}
                    {activeSection === "policy-stage" && (
                      <>
                        <ImplementationReadinessSection
                          records={records}
                          selectedState={selectedState}
                          onSelectState={selectState}
                        />
                        <PolicyStageSection records={records} onSelectState={selectState} />
                      </>
                    )}
                    {activeSection === "policy-domains" && (
                      <PolicyDomainsSection records={records} onSelectState={selectState} />
                    )}
                    {activeSection === "source-library" && (
                      <SourceLibrarySection records={codedRecords} onSelectState={selectState} />
                    )}
                    {activeSection === "methodology" && (
                      <MethodologySection records={records} />
                    )}
                    {activeSection === "table-view" && (
                      <PolicyTable records={filteredRecords} selectedState={selectedState} onSelect={selectState} />
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
      <WhatsNewModal release={currentRelease} open={whatsNewOpen} onClose={closeWhatsNew} />
    </div>
  );
}

export default App;
