import { useState } from "react";
import { AppIcon } from "./AppIcon";

interface DeveloperPageProps {
  onOpenDashboard: () => void;
  onOpenLanding: () => void;
}

interface ReferenceEntry {
  apa: string;
  doi?: string;
  url?: string;
}

/**
 * References in APA 7th-edition style. Keep the `apa` string as the final
 * rendered text; `doi` / `url` are rendered as trailing links.
 */
const REFERENCES: ReferenceEntry[] = [
  {
    apa:
      "Dagdelen, J., Dunn, A., Lee, S., Walker, N., Rosen, A. S., Ceder, G., Persson, K. A., & Jain, A. (2024). Structured information extraction from scientific text with large language models. *Nature Communications*, 15, 1418.",
    doi: "10.1038/s41467-024-45563-x"
  },
  {
    apa:
      "Ifenthaler, D., Majumdar, R., Gorissen, P., Judge, M., Mishra, S., Raffaghelli, J., & Shimada, A. (2024). Artificial intelligence in education: Implications for policymakers, researchers, and practitioners. *Technology, Knowledge and Learning*, 29, 1693–1710.",
    doi: "10.1007/s10758-024-09747-0"
  },
  {
    apa:
      "Kavanagh, M. M., Norato, L., Friedman, E. A., & Armbrister, A. N. (2020). Planning for the long-term: Building capacity for a cross-sectoral public health response. *Public Health Reports*, 135(1_suppl), 76S–83S.",
    doi: "10.1177/0033354920904084"
  },
  {
    apa:
      "LeGen, J., Saelens, R., & Verhulst, S. (2024). Data provenance and trust in AI: Building accountable systems through auditable pipelines. *AI & Society*. Advance online publication.",
    url: "https://doi.org/10.1007/s00146-024-01896-1"
  },
  {
    apa:
      "Poirier, M. J. P., Grépin, K. A., & Grignon, M. (2022). Approaches and alternatives to the wealth index to measure socioeconomic status using survey data. *Social Indicators Research*, 162, 1–44.",
    doi: "10.1007/s11205-021-02702-x"
  },
  {
    apa:
      "Ramanathan, T., Hulkower, R., Holbrook, J., & Penn, M. (2017). Legal epidemiology: The science of law. *Journal of Law, Medicine & Ethics*, 45(1_suppl), 69–72.",
    doi: "10.1177/1073110517703329"
  }
];

const ACKNOWLEDGEMENTS = [
  {
    group: "Scholarly lineage",
    body:
      "The observatory's coding scheme is built on the policy-surveillance tradition (Kavanagh, Ramanathan, Poirier) and adapts structured-extraction practice (Dagdelen et al.) to state-level education policy. The teacher-facing extensions draw on Ifenthaler et al.'s implementation-fidelity framing."
  },
  {
    group: "Primary sources",
    body:
      "State Education Agencies (ADE, CDE, NYSED, TEA, FDOE, OSPI, ISBE, DPI, and counterparts), Offices of Governors, state legislatures' bill trackers, and higher-education coordinators (CSU, SUNY, THECB, ACHE, UW System) whose public documents underwrite every coded record."
  },
  {
    group: "Tooling",
    body:
      "React, TypeScript, Vite, and Material Symbols; Gemini structured-extraction pipeline for PDF sources; hand-coded canonical records where public documents required close reading (Alabama)."
  },
  {
    group: "Limitations",
    body:
      "Thirty-six state records were back-coded with rule-based derivations from existing signals (ai_use_allowed, privacy_policy, policy_orientation). The new teacher-guidance fields on those states should be read as provisional until a layer-by-layer human review or a higher-confidence extraction pass is run. Alabama is the hand-coded reference case."
  }
];

export function DeveloperPage({ onOpenDashboard, onOpenLanding }: DeveloperPageProps) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="developer-shell">
      <header className="developer-topbar">
        <button type="button" className="developer-brand" onClick={onOpenLanding}>
          <AppIcon className="brand-icon" decorative />
          <strong>AI Education Policy Observatory</strong>
        </button>
        <nav className="developer-topnav">
          <button type="button" onClick={onOpenLanding}>Home</button>
          <button type="button" className="developer-cta" onClick={onOpenDashboard}>
            Open workspace
          </button>
        </nav>
      </header>

      <main className="developer-main">
        <section className="developer-hero">
          <div className="developer-portrait">
            {imgFailed ? (
              <div className="developer-portrait-fallback" aria-hidden="true">
                <span className="material-symbols-outlined">person</span>
              </div>
            ) : (
              <img
                src="/developer-headshot.jpg"
                alt="Developer headshot"
                onError={() => setImgFailed(true)}
              />
            )}
          </div>

          <div className="developer-hero-text">
            <span className="developer-eyebrow">Developer</span>
            <h1>Jewoo Jung</h1>
            <p className="developer-tagline">
              Policy-research engineering: state-by-state AI education policy,
              surfaced with evidence and traceable provenance.
            </p>
            <div className="developer-links">
              <a
                href="mailto:contact@example.com"
                className="developer-link-btn"
                aria-label="Email"
              >
                <span className="material-symbols-outlined">mail</span>
                Contact
              </a>
              <a
                href="https://github.com/Educatian/aiedobservatory"
                target="_blank"
                rel="noreferrer"
                className="developer-link-btn"
              >
                <span className="material-symbols-outlined">code</span>
                Repository
              </a>
              <a
                href="https://orcid.org/"
                target="_blank"
                rel="noreferrer"
                className="developer-link-btn"
              >
                <span className="material-symbols-outlined">badge</span>
                ORCID
              </a>
            </div>
          </div>
        </section>

        <section className="developer-section">
          <h2>Biography</h2>
          <p>
            Jewoo Jung researches AI in education with a focus on policy
            surveillance, structured extraction from policy corpora, and
            instrument-level comparative analysis. This observatory is an open
            platform for tracking how U.S. states translate AI guidance into
            binding rules, teacher-facing guardrails, and higher-education
            practice. Contributions and corrections are welcome via the
            repository.
          </p>
        </section>

        <section className="developer-section">
          <h2>Acknowledgements</h2>
          <ul className="developer-ack-list">
            {ACKNOWLEDGEMENTS.map((item) => (
              <li key={item.group}>
                <span className="developer-ack-label">{item.group}</span>
                <p>{item.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="developer-section">
          <div className="developer-ref-header">
            <h2>References</h2>
            <span className="developer-ref-style">APA 7th edition</span>
          </div>
          <ol className="developer-refs">
            {REFERENCES.map((ref, i) => (
              <li key={i}>
                <span
                  className="developer-ref-text"
                  dangerouslySetInnerHTML={{
                    __html: ref.apa.replace(/\*(.+?)\*/g, "<em>$1</em>")
                  }}
                />
                {ref.doi && (
                  <a
                    className="developer-ref-link"
                    href={`https://doi.org/${ref.doi}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    https://doi.org/{ref.doi}
                  </a>
                )}
                {!ref.doi && ref.url && (
                  <a
                    className="developer-ref-link"
                    href={ref.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {ref.url}
                  </a>
                )}
              </li>
            ))}
          </ol>
        </section>

        <section className="developer-section developer-cite-block">
          <h2>Cite this observatory</h2>
          <p className="developer-cite-hint">APA 7</p>
          <blockquote className="developer-cite-sample">
            Jung, J. (2026). <em>AI Education Policy Observatory</em> [Web application].
            https://github.com/Educatian/aiedobservatory
          </blockquote>
        </section>
      </main>

      <footer className="developer-footer">
        <span>© 2026 Jewoo Jung · AI Education Policy Observatory Lab</span>
        <button type="button" onClick={onOpenDashboard}>
          Open workspace →
        </button>
      </footer>
    </div>
  );
}
