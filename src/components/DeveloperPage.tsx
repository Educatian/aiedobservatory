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
 * Selected peer-reviewed publications rendered in APA 7th-edition style.
 * `apa` is the final rendered text; `doi` / `url` render as trailing links.
 * Sourced from Dr. Jewoong Moon's CV (April 2026).
 */
const REFERENCES: ReferenceEntry[] = [
  {
    apa:
      "Uddin, M., Moon, J., & Abu, S. (2026). An ethical framework for conversational AI in higher education: Toward an evidence-based ethical governance. *AI & Ethics*.",
    doi: "10.1007/s43681-026-01056-9"
  },
  {
    apa:
      "Aldemir, T., Kilinc, S., Bicer, A., Moon, J., & Kwok, M. (2025). Exploring emergent AI-TPACK competencies in a two-week AI literacy module for preservice teachers. *Teaching and Teacher Education*, 105231.",
    doi: "10.1016/j.tate.2025.105231"
  },
  {
    apa:
      "Lim, J., Lee, U., Koh, J., Jung, Y., Jung, H., Lee, Y., Byun, G., Jang, Y., Lee, S., & Moon, J. (2025). Development and implementation of a generative artificial intelligence-enhanced simulation to enhance problem-solving skills for pre-service teachers. *Computers & Education*, 105306.",
    doi: "10.1016/j.compedu.2025.105306"
  },
  {
    apa:
      "Moon, J., Lee, U., Koh, J., Jeong, Y., Byun, G., Lee, Y., & Lim, J. (2024). Generative artificial intelligence in educational game design: Nuanced challenges, design implications, and future research. *Technology, Knowledge and Learning*.",
    doi: "10.1007/s10758-024-09756-z"
  },
  {
    apa:
      "Bae, H., Hur, J., Park, J., Choi, G. W., & Moon, J. (2024). Pre-service teachers' dual perspectives on generative AI: Benefits, challenges, and integrating into teaching and learning. *Online Learning*, 28(3).",
    doi: "10.24059/olj.v28i3.4543"
  },
  {
    apa:
      "Choi, G. W., Lee, D., Kim, S. H., & Moon, J. (2024). Utilizing generative artificial intelligence for instructional design: Exploring strengths, weaknesses, opportunities, and threats. *TechTrends*.",
    doi: "10.1007/s11528-024-00967-w"
  },
  {
    apa:
      "Moon, J., McNeill, L., Edmonds, C., Banihashem, K., & Noroozi, O. (2024). Using learning analytics to explore peer learning patterns in asynchronous gamified environments. *International Journal of Educational Technology in Higher Education*, 21.",
    doi: "10.1186/s41239-024-00476-z"
  },
  {
    apa:
      "Moon, J., Yeo, S., Banihashem, K., & Noroozi, O. (2024). Using multimodal learning analytics as a formative assessment tool: Exploring collaborative dynamics in mathematics teacher education. *Journal of Computer Assisted Learning*.",
    doi: "10.1111/jcal.13028"
  }
];

const ACKNOWLEDGEMENTS = [
  {
    group: "Scholarly lineage",
    body:
      "This observatory grows out of research in AI-enhanced instructional systems, learning analytics, and educational data mining conducted in the ADIE Lab at The University of Alabama. Its coding approach to state-level AI guidance draws on the policy-surveillance tradition and on structured-extraction practice from LLM-assisted scientific text work."
  },
  {
    group: "Funding",
    body:
      "Work that informed this platform is supported in part by the Alabama Generative Engineering Textbook (AL-GET, OSP, UA), the COE RisingTide LLM-based Cyber Sentinel Co-Pilot project, the ISSR THRIVE Fellowship, the Alabama Commission on Higher Education TeachPlay award, and the OSP CREATE AI-Powered 3D Simulation program at The University of Alabama."
  },
  {
    group: "Primary sources",
    body:
      "State Education Agencies (ADE, CDE, NYSED, TEA, FDOE, OSPI, ISBE, DPI, and counterparts), offices of governors, state legislatures' bill trackers, and higher-education coordinators (CSU, SUNY, THECB, ACHE, UW System) whose public documents underwrite every coded record."
  },
  {
    group: "Tooling",
    body:
      "React, TypeScript, Vite, and Material Symbols; Gemini structured-extraction pipeline for PDF sources; hand-coded canonical records where public documents required close reading (Alabama as the reference case)."
  },
  {
    group: "Limitations",
    body:
      "Thirty-six state records were back-coded with rule-based derivations from existing signals (ai_use_allowed, privacy_policy, policy_orientation). The teacher-guidance fields on those states should be read as provisional until a layer-by-layer human review or a higher-confidence extraction pass is completed."
  }
];

export function DeveloperPage({ onOpenDashboard, onOpenLanding }: DeveloperPageProps) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="developer-shell aied-themed">
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
                alt="Dr. Jewoong Moon"
                onError={() => setImgFailed(true)}
              />
            )}
          </div>

          <div className="developer-hero-text">
            <span className="developer-eyebrow">Developer · Principal Investigator</span>
            <h1>Dr. Jewoong Moon</h1>
            <p className="developer-affiliation">
              Assistant Professor, Instructional Technology<br />
              Department of Educational Leadership, Policy, and Technology Studies<br />
              The University of Alabama · Tuscaloosa, AL
            </p>
            <p className="developer-tagline">
              Research at the intersection of AI-enhanced learning, immersive and
              game-based learning design, and learning analytics — now extended
              to state-by-state surveillance of U.S. AI education policy.
            </p>
            <div className="developer-links">
              <a
                href="mailto:jmoon19@ua.edu"
                className="developer-link-btn"
                aria-label="Email Dr. Moon"
              >
                <span className="material-symbols-outlined">mail</span>
                jmoon19@ua.edu
              </a>
              <a
                href="https://jmoon.people.ua.edu"
                target="_blank"
                rel="noreferrer"
                className="developer-link-btn"
              >
                <span className="material-symbols-outlined">person</span>
                Homepage
              </a>
              <a
                href="https://adielab.ua.edu"
                target="_blank"
                rel="noreferrer"
                className="developer-link-btn"
              >
                <span className="material-symbols-outlined">science</span>
                ADIE Lab
              </a>
              <a
                href="https://www.researchgate.net/profile/Jewoong-Moon"
                target="_blank"
                rel="noreferrer"
                className="developer-link-btn"
              >
                <span className="material-symbols-outlined">article</span>
                ResearchGate
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
            </div>
          </div>
        </section>

        <section className="developer-section">
          <h2>Biography</h2>
          <p>
            Dr. Jewoong Moon is an Assistant Professor of Instructional Technology
            at The University of Alabama, where he directs the ADIE Lab. He earned
            his Ph.D. in Instructional Systems and Learning Technologies from
            Florida State University in 2021, following an M.A. and B.Ed. at
            Chonnam National University in South Korea. His research program spans
            digital game-based learning, inclusive and immersive learning design
            in extended reality (XR), learning analytics and educational data
            mining, and adaptive learning systems for engineering and teacher
            education. This observatory extends that agenda into the policy
            layer — tracing how U.S. states translate AI guidance into binding
            rules, teacher-facing guardrails, and higher-education practice.
            Contributions and corrections are welcome via the repository.
          </p>
        </section>

        <section className="developer-section">
          <h2>Research expertise</h2>
          <ul className="developer-expertise">
            <li>Digital Game-Based Learning</li>
            <li>Immersive Learning Design (XR / VR)</li>
            <li>Learning Analytics &amp; Educational Data Mining</li>
            <li>Adaptive Learning System Design</li>
            <li>Generative AI in Teacher Education</li>
            <li>Engineering Education</li>
          </ul>
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
            <h2>Selected references</h2>
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
          <p className="developer-ref-footnote">
            A complete publication list (57 peer-reviewed articles, 8 book
            chapters, 1 edited book) is available on the{" "}
            <a href="https://jmoon.people.ua.edu" target="_blank" rel="noreferrer">
              lab homepage
            </a>{" "}
            and{" "}
            <a
              href="https://www.researchgate.net/profile/Jewoong-Moon"
              target="_blank"
              rel="noreferrer"
            >
              ResearchGate
            </a>
            .
          </p>
        </section>

        <section className="developer-section developer-cite-block">
          <h2>Cite this observatory</h2>
          <p className="developer-cite-hint">APA 7</p>
          <blockquote className="developer-cite-sample">
            Moon, J. (2026). <em>AI Education Policy Observatory</em> [Web application].
            ADIE Lab, The University of Alabama.
            https://github.com/Educatian/aiedobservatory
          </blockquote>
        </section>
      </main>

      <footer className="developer-footer">
        <span>© 2026 Jewoong Moon · ADIE Lab · The University of Alabama</span>
        <button type="button" onClick={onOpenDashboard}>
          Open workspace →
        </button>
      </footer>
    </div>
  );
}
