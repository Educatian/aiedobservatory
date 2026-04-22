import { AppIcon } from "./AppIcon";

interface LandingPageProps {
  isAuthenticated: boolean;
  onOpenLogin: () => void;
  onOpenDashboard: () => void;
  onOpenProjectOverview: () => void;
  onOpenDeveloper: () => void;
  onSkipTesting: () => void;
}

export function LandingPage({
  isAuthenticated,
  onOpenLogin,
  onOpenDashboard,
  onOpenProjectOverview,
  onOpenDeveloper,
  onSkipTesting
}: LandingPageProps) {
  return (
    <div className="landing-shell">
      <header className="landing-topbar">
        <div className="landing-brand">
          <div className="landing-brand-mark">
            <AppIcon className="brand-icon" decorative />
          </div>
          <strong>AI Education Policy Observatory</strong>
        </div>

        <nav className="landing-topnav" aria-label="Landing navigation">
          <button type="button" onClick={onOpenProjectOverview}>About</button>
          <button type="button" onClick={onOpenDeveloper}>Developer</button>
          <button
            type="button"
            className="landing-topnav-cta"
            onClick={isAuthenticated ? onOpenDashboard : onOpenLogin}
          >
            {isAuthenticated ? "Open workspace" : "Sign in"}
          </button>
        </nav>
      </header>

      <main className="landing-main">
        <div className="landing-bg" aria-hidden="true">
          <div className="landing-bg-glow" />
          <div className="landing-bg-grid" />
        </div>

        <div className="landing-center">
          <span className="landing-eyebrow">Independent Research · AI Policy Surveillance</span>

          <h1 className="landing-headline">
            Making AI Education<br />Policy Legible.
          </h1>

          <p className="landing-sub">
            State-by-state guidance on AI use, assessment, privacy, and implementation —
            traced to source documents.
          </p>

          <div className="landing-ctas">
            <button
              type="button"
              className="landing-btn-primary"
              onClick={isAuthenticated ? onOpenDashboard : onOpenLogin}
            >
              {isAuthenticated ? "Launch Dashboard" : "Enter Workspace"}
            </button>
            <button
              type="button"
              className="landing-btn-ghost"
              onClick={onOpenProjectOverview}
            >
              About this project
            </button>
          </div>

          <div className="landing-stats">
            <div className="landing-stat">
              <strong>51</strong>
              <span>States tracked</span>
            </div>
            <div className="landing-stat-divider" />
            <div className="landing-stat">
              <strong>248+</strong>
              <span>Source documents</span>
            </div>
            <div className="landing-stat-divider" />
            <div className="landing-stat">
              <strong>92%</strong>
              <span>Citation coverage</span>
            </div>
          </div>
        </div>

        {!isAuthenticated && (
          <button type="button" className="landing-skip-link" onClick={onSkipTesting}>
            Skip for testing →
          </button>
        )}
      </main>
    </div>
  );
}
