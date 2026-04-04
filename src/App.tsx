import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { CompareMatrixView } from "./components/CompareMatrixView";
import { MethodologySection } from "./components/MethodologySection";
import { NewAnalysisDrawer } from "./components/NewAnalysisDrawer";
import { PolicyDetailPanel } from "./components/PolicyDetailPanel";
import { PolicyDomainsSection } from "./components/PolicyDomainsSection";
import { PolicyStageSection } from "./components/PolicyStageSection";
import { PolicyTable } from "./components/PolicyTable";
import { PolicyTileMap } from "./components/PolicyTileMap";
import { SourceLibrarySection } from "./components/SourceLibrarySection";
import { getPolicyStageLabel } from "./data/policyData";
import { policyRecords } from "./data/policyData";

type CoverageFilter = "all" | "coded" | "queued";
type NavSection =
  | "map-view"
  | "compare"
  | "policy-stage"
  | "source-library"
  | "methodology"
  | "policy-domains"
  | "table-view";

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

function App() {
  const [selectedState, setSelectedState] = useState("CA");
  const [coverageFilter, setCoverageFilter] = useState<CoverageFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [compareStates, setCompareStates] = useState<string[]>(["CA", "TX", "FL"]);
  const [isAnalysisDrawerOpen, setIsAnalysisDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<NavSection>(() =>
    typeof window === "undefined" ? "map-view" : getActiveSectionFromHash(window.location.hash)
  );
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

  const filteredRecords = useMemo(() => {
    return policyRecords.filter((record) => {
      const matchesCoverage =
        coverageFilter === "all" ? true : record.snapshotStatus === coverageFilter;
      const matchesQuery =
        normalizedQuery.length === 0
          ? true
          : record.stateName.toLowerCase().includes(normalizedQuery) ||
            record.stateAbbr.toLowerCase().includes(normalizedQuery);

      return matchesCoverage && matchesQuery;
    });
  }, [coverageFilter, normalizedQuery]);

  const filteredStateIds = useMemo(
    () => new Set(filteredRecords.map((record) => record.stateAbbr)),
    [filteredRecords]
  );

  const selectedRecord =
    policyRecords.find((record) => record.stateAbbr === selectedState) ?? policyRecords[0];

  const codedRecords = useMemo(
    () => policyRecords.filter((record) => record.snapshotStatus === "coded"),
    []
  );

  const totalCount = policyRecords.length;
  const codedCount = policyRecords.filter((record) => record.snapshotStatus === "coded").length;
  const highConfidenceCount = policyRecords.filter((record) => record.confidence >= 0.85).length;
  const releasedGuidanceCount = policyRecords.filter((record) => record.implementationStage >= 3).length;
  const dominantStage = getPolicyStageLabel(
    Math.round(
      policyRecords
        .filter((record) => record.snapshotStatus === "coded")
        .reduce((sum, record) => sum + record.implementationStage, 0) / Math.max(codedCount, 1)
    )
  );

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
    function handleHashChange() {
      setActiveSection(getActiveSectionFromHash(window.location.hash));
    }

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  function selectState(nextState: string) {
    startTransition(() => {
      setSelectedState(nextState);
    });
  }

  function handleNavClick(section: NavSection) {
    setActiveSection(section);
    if (typeof window !== "undefined") {
      window.location.hash = section;
    }
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

  return (
    <div className="sentinel-shell">
      <aside className="side-nav">
        <div className="side-brand">
          <div className="brand-mark">AS</div>
          <div>
            <h1>AI Policy Tracker</h1>
            <p>The Academic Sentinel</p>
          </div>
        </div>

        <button className="side-cta" type="button" onClick={() => setIsAnalysisDrawerOpen(true)}>
          <span className="material-symbols-outlined">add_circle</span>
          New Analysis
        </button>

        <nav className="side-links" aria-label="Core filters">
          <p>Core Filters</p>
          <a
            className={activeSection === "map-view" ? "active" : ""}
            href="#map-view"
            onClick={() => handleNavClick("map-view")}
          >
            <span className="material-symbols-outlined">public</span>
            Geography
          </a>
          <a
            className={activeSection === "policy-domains" ? "active" : ""}
            href="#policy-domains"
            onClick={() => handleNavClick("policy-domains")}
          >
            <span className="material-symbols-outlined">domain</span>
            Policy Domains
          </a>
          <a
            className={activeSection === "policy-stage" ? "active" : ""}
            href="#policy-stage"
            onClick={() => handleNavClick("policy-stage")}
          >
            <span className="material-symbols-outlined">step</span>
            Policy Stage
          </a>
          <a
            className={activeSection === "table-view" ? "active" : ""}
            href="#table-view"
            onClick={() => handleNavClick("table-view")}
          >
            <span className="material-symbols-outlined">verified</span>
            Confidence
          </a>
          <a
            className={activeSection === "table-view" ? "active" : ""}
            href="#table-view"
            onClick={() => handleNavClick("table-view")}
          >
            <span className="material-symbols-outlined">schedule</span>
            Time
          </a>
        </nav>

        <div className="side-profile">
          <div className="profile-avatar">SC</div>
          <div>
            <strong>Dr. Sarah Chen</strong>
            <span>Senior Policy Analyst</span>
          </div>
          <span className="material-symbols-outlined">settings</span>
        </div>
      </aside>

      <div className="main-shell">
        <NewAnalysisDrawer
          open={isAnalysisDrawerOpen}
          records={policyRecords}
          selectedState={selectedState}
          onClose={() => setIsAnalysisDrawerOpen(false)}
          onNavigate={handleNavClick}
          onSelectState={selectState}
        />

        <header className="top-nav">
          <div className="top-brand">
            <h2>Academic Sentinel: AI in Education</h2>
            <nav>
              <a
                className={activeSection === "map-view" ? "active" : ""}
                href="#map-view"
                onClick={() => handleNavClick("map-view")}
              >
                Map View
              </a>
              <a
                className={activeSection === "compare" ? "active" : ""}
                href="#compare"
                onClick={() => handleNavClick("compare")}
              >
                Compare Regions
              </a>
              <a
                className={activeSection === "policy-stage" ? "active" : ""}
                href="#policy-stage"
                onClick={() => handleNavClick("policy-stage")}
              >
                Policy Timeline
              </a>
              <a
                className={activeSection === "source-library" ? "active" : ""}
                href="#source-library"
                onClick={() => handleNavClick("source-library")}
              >
                Source Library
              </a>
              <a
                className={activeSection === "methodology" ? "active" : ""}
                href="#methodology"
                onClick={() => handleNavClick("methodology")}
              >
                Methodology
              </a>
            </nav>
          </div>

          <div className="top-actions">
            <label className="top-search">
              <span className="material-symbols-outlined">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search policies..."
              />
            </label>

            <button type="button" className="icon-button" aria-label="History">
              <span className="material-symbols-outlined">history</span>
            </button>
            <button type="button" className="icon-button" aria-label="Notifications">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button type="button" className="export-button">
              <span className="material-symbols-outlined">download</span>
              Export Data
            </button>
          </div>
        </header>

        <main className="content-shell">
          <section className="page-header">
            <div>
              <span className="page-kicker">Map View</span>
              <h3>AI in Education Policy Tracker</h3>
              <p>
                Mapping state, district, and school-level AI policy variation across the United States
                with a benchmarked research-dashboard shell.
              </p>
            </div>
            <div className="header-stamp">
              <span>Last Updated</span>
              <strong>April 4, 2026</strong>
            </div>
          </section>

          <section className="hero-metrics">
            <div>
              <span>States + DC</span>
              <strong>{totalCount}</strong>
            </div>
            <div>
              <span>High confidence</span>
              <strong>{highConfidenceCount}</strong>
            </div>
            <div>
              <span>Released guidance</span>
              <strong>{releasedGuidanceCount}</strong>
            </div>
            <div>
              <span>Typical stage</span>
              <strong>{dominantStage}</strong>
            </div>
          </section>

          <section className="dashboard-grid" id="map-view">
            <div className="map-column">
              <div className="map-card">
                <div className="map-overlay">
                  <div className="view-toggle">
                    <button type="button" className="active">State</button>
                    <button
                      type="button"
                      className="is-soon"
                      aria-label="District view is in development"
                    >
                      District
                      <span className="view-toggle-hint" role="tooltip">
                        District view is in development
                      </span>
                    </button>
                  </div>

                  <div className="legend-card" aria-label="Policy strength legend">
                    <p>Policy Strength</p>
                    <div className="legend-scale" />
                    <div className="legend-labels">
                      <span>Weak</span>
                      <span>Robust</span>
                    </div>
                  </div>
                </div>

                <div className="map-canvas">
                  <PolicyTileMap
                    records={policyRecords}
                    selectedState={selectedState}
                    visibleIds={filteredStateIds}
                    onSelect={selectState}
                  />
                </div>
              </div>

              <div className="summary-row">
                <article className="summary-card">
                  <h4>Policy Distribution</h4>
                  <div className="mini-bars" aria-hidden="true">
                    <span style={{ height: "28%" }} />
                    <span style={{ height: "58%" }} />
                    <span style={{ height: "86%" }} />
                    <span style={{ height: "44%" }} />
                  </div>
                  <p>Current coding suggests a center of gravity around emerging state guidance.</p>
                </article>

                <article className="summary-card">
                  <h4>Coverage Filter</h4>
                  <label className="field">
                    <span>Snapshot coverage</span>
                    <select
                      value={coverageFilter}
                      onChange={(event) => setCoverageFilter(event.target.value as CoverageFilter)}
                    >
                      <option value="all">All states</option>
                      <option value="coded">Coded only</option>
                      <option value="queued">Queued only</option>
                    </select>
                  </label>
                </article>

                <article className="summary-card">
                  <h4>Research Note</h4>
                  <p>
                    Current coded states skew toward released guidance, with confidence and domain mix
                    now exposed directly in the inspector and table.
                  </p>
                </article>
              </div>
            </div>

            <div className="inspector-column">
              <div className="inspector-toolbar">
                <label className="field">
                  <span>Search scope</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="CA, Texas, New York..."
                  />
                </label>
              </div>

              <PolicyDetailPanel record={selectedRecord} />
            </div>
          </section>

          <CompareMatrixView
            records={codedRecords}
            compareStates={compareStates}
            onChangeState={changeCompareState}
          />

          <section className="schema-strip">
            <div>
              <span className="page-kicker">Schema Notes</span>
              <h4>Canonical fields behind the comparison</h4>
            </div>
            <div className="schema-list">
              <span>`region_id`</span>
              <span>`state_abbr`</span>
              <span>`region_type`</span>
              <span>`year`</span>
              <span>`ai_use_allowed`</span>
              <span>`assessment_policy`</span>
              <span>`privacy_policy`</span>
              <span>`teacher_pd_support`</span>
              <span>`implementation_stage`</span>
              <span>`policy_strength`</span>
              <span>`confidence`</span>
              <span>`approval_route`</span>
            </div>
          </section>

          <PolicyDomainsSection records={policyRecords} onSelectState={selectState} />

          <PolicyStageSection records={policyRecords} onSelectState={selectState} />

          <SourceLibrarySection records={codedRecords} onSelectState={selectState} />

          <MethodologySection records={policyRecords} />

          <div id="table-view">
            <PolicyTable records={filteredRecords} selectedState={selectedState} onSelect={selectState} />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
