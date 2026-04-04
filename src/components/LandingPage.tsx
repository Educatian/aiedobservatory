import { AppIcon } from "./AppIcon";
import { AmbientMapBackground } from "./AmbientMapBackground";

interface LandingPageProps {
  isAuthenticated: boolean;
  onOpenLogin: () => void;
  onOpenDashboard: () => void;
  onOpenProjectOverview: () => void;
  onSkipTesting: () => void;
}

const featureCards = [
  {
    title: "Map View",
    description:
      "Track state-by-state guidance with a living surveillance layer that makes policy maturity, confidence, and review posture visible.",
    accent: "public",
    tone: "blue"
  },
  {
    title: "Comparison",
    description:
      "Benchmark regions across governance, assessment, privacy, and professional learning with uncertainty signals preserved.",
    accent: "compare_arrows",
    tone: "slate"
  },
  {
    title: "Source Library",
    description:
      "Inspect the actual documents, evidence spans, approval routes, and reference trail behind every visible policy record.",
    accent: "library_books",
    tone: "ink"
  }
];

const metricCards = [
  { label: "Documents traced", value: "248+", note: "official source artifacts indexed" },
  { label: "States surfaced", value: "24", note: "currently published in the tracker" },
  { label: "Citation support", value: "92%", note: "coded fields backed by source evidence" },
  { label: "Refresh mode", value: "Evented", note: "updates reflected through the event layer" }
];

export function LandingPage({
  isAuthenticated,
  onOpenLogin,
  onOpenDashboard,
  onOpenProjectOverview,
  onSkipTesting
}: LandingPageProps) {
  return (
    <div className="landing-shell">
      <header className="landing-topbar">
        <div className="landing-brand">
          <div className="landing-brand-mark">
            <AppIcon className="brand-icon" decorative />
          </div>
          <div>
            <strong>AI Education Policy Observatory</strong>
            <span>An Agentic Policy Surveillance Framework</span>
          </div>
        </div>

        <nav className="landing-topnav" aria-label="Landing navigation">
          <button type="button" onClick={onOpenProjectOverview}>
            Project overview
          </button>
          <button type="button" onClick={isAuthenticated ? onOpenDashboard : onOpenLogin}>
            {isAuthenticated ? "Open workspace" : "Sign in"}
          </button>
        </nav>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-backdrop" aria-hidden="true">
            <AmbientMapBackground />
            <div className="landing-aurora" />
            <div className="landing-glow landing-glow-a" />
            <div className="landing-glow landing-glow-b" />
            <div className="landing-orbit landing-orbit-a" />
            <div className="landing-orbit landing-orbit-b" />
            <div className="landing-signal-pulse landing-signal-pulse-a" />
            <div className="landing-signal-pulse landing-signal-pulse-b" />
            <div className="landing-gridlines" />
          </div>

          <div className="landing-hero-copy">
            <span className="landing-kicker">Independent Research Workspace</span>
            <h1>Making AI Education Policy Legible.</h1>
            <p>
              An agentic observatory for state guidance, source documents, and policy change across AI
              use, assessment, privacy, and implementation.
            </p>

            <div className="landing-actions">
              <button
                type="button"
                className="landing-primary-button"
                onClick={isAuthenticated ? onOpenDashboard : onOpenLogin}
              >
                {isAuthenticated ? "Launch Dashboard" : "Sign In To Workspace"}
              </button>
              <button type="button" className="landing-secondary-button" onClick={onOpenProjectOverview}>
                Explore Methodology
              </button>
              {!isAuthenticated ? (
                <button type="button" className="landing-secondary-button" onClick={onSkipTesting}>
                  Skip For Testing
                </button>
              ) : null}
            </div>

            <div className="landing-proofline">
              <span>Evidence-grounded extraction</span>
              <span>Selective audit, not manual coding by default</span>
              <span>Built for leadership, policy, and research workflows</span>
            </div>
          </div>

          <div className="landing-hero-panel">
            <div className="landing-panel-card landing-panel-card-primary">
              <span>Coverage snapshot</span>
              <strong>{isAuthenticated ? "Live workspace" : "24 published states"}</strong>
              <p>
                {isAuthenticated
                  ? "Your workspace is connected and ready to open the live policy dashboard."
                  : "Current publication reflects routed and reviewed state records in the observatory."}
              </p>
            </div>

            <div className="landing-panel-grid">
              {metricCards.map((metric) => (
                <article key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <p>{metric.note}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section">
          <div className="landing-section-header">
            <span className="landing-kicker">Research Surface</span>
            <h2>Rigorous policy intelligence, built as a living product rather than a static report.</h2>
            <p>
              The platform is designed to help leadership teams understand what exists, what changed, how
              certain the evidence is, and where policy readiness is strong enough to support action.
            </p>
          </div>

          <div className="landing-feature-grid">
            {featureCards.map((feature) => (
              <article key={feature.title} className={`landing-feature-card tone-${feature.tone}`}>
                <div className="landing-feature-icon">
                  <span className="material-symbols-outlined">{feature.accent}</span>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section landing-section-split">
          <div className="landing-editorial-card">
            <span className="landing-kicker">Why it matters</span>
            <h2>Policy change is outpacing conventional monitoring.</h2>
            <p>
              AI guidance now affects classroom use, assessment, privacy, and implementation support.
              Without a living evidence layer, cross-state comparison quickly becomes outdated.
            </p>
          </div>

          <div className="landing-detail-stack">
            <article>
              <span>Structured provenance</span>
              <p>Every published record carries source documents, evidence spans, and approval-route context.</p>
            </article>
            <article>
              <span>Leadership usability</span>
              <p>Executive briefs, readiness signals, and change logs turn research outputs into action-ready views.</p>
            </article>
            <article>
              <span>Research integrity</span>
              <p>Gold-set evaluation, trust panels, and routing rules keep the system interpretable under change.</p>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
