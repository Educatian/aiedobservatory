import { AppIcon } from "./AppIcon";
import type { PolicyRecord } from "../types";
import latestEvaluation from "../../data/evaluation/latest-evaluation.json";

type NavTarget = "map-view" | "source-library" | "methodology";

interface ProjectOverviewPageProps {
  records: PolicyRecord[];
  onOpenDashboard: (section?: NavTarget) => void;
}

const researchReferences = [
  {
    id: "kavanagh2020",
    shortLabel: "Policy Surveillance",
    title:
      "Kavanagh, M. M., Meier, B. M., Pillinger, M., Huffstetler, H., & Burris, S. (2020). Global policy surveillance: Creating and using comparative national data on health law and policy. American Journal of Public Health, 110(12), 1805-1810.",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7661970/",
    takeaway:
      "Shows why laws and policies should be converted into structured, comparable, longitudinal datasets rather than left as scattered documents."
  },
  {
    id: "poirer2022",
    shortLabel: "Global Legal Epi",
    title:
      "Poirier, M. J. P., Viens, A. M., Penney, T. L., Van Katwyk, S. R., Astbury, C. C., Lin, G., Nanyangwe-Moyo, T., & Hoffman, S. J. (2022). Principles and methods of global legal epidemiology. Journal of Epidemiology & Community Health, 76(9), 828-832.",
    href: "https://jech.bmj.com/content/76/9/828",
    takeaway:
      "Makes the case for rigorous coding rules, cross-jurisdiction comparison, and policy mapping methods that can scale internationally."
  },
  {
    id: "ramanathan2017",
    shortLabel: "Science of Law",
    title:
      "Ramanathan, T., Hulkower, R., Holbrook, J., & Penn, M. (2017). Legal epidemiology: The science of law. Journal of Law, Medicine & Ethics, 45(S1), 69-72.",
    href: "https://philpapers.org/rec/RAMLET",
    takeaway:
      "Frames law and policy as measurable interventions, which is the conceptual basis for turning AI-in-education governance into analyzable data."
  },
  {
    id: "ifenthaler2024",
    shortLabel: "AI in Education",
    title:
      "Ifenthaler, D., Majumdar, R., Gorissen, P., Judge, M., Mishra, S., Raffaghelli, J., & Shimada, A. (2024). Artificial intelligence in education: Implications for policymakers, researchers, and practitioners. Technology, Knowledge and Learning, 29, 1693-1710.",
    href: "https://link.springer.com/article/10.1007/s10758-024-09747-0",
    takeaway:
      "Establishes that AI in education is not only a classroom issue but a governance and policy challenge requiring coordinated oversight."
  },
  {
    id: "dagdelen2024",
    shortLabel: "Structured IE",
    title:
      "Dagdelen, J., Dunn, A., Lee, S., Walker, N., Rosen, A. S., Ceder, G., Persson, K. A., & Jain, A. (2024). Structured information extraction from scientific text with large language models. Nature Communications, 15, 1418.",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10869356/",
    takeaway:
      "Provides evidence that LLMs can produce useful structured records from complex unstructured text when the output schema is well designed."
  },
  {
    id: "legen2024",
    shortLabel: "Legal IE",
    title:
      "C R, C., Kulkarni, S., Sagi, S. R. A. V., Pandey, S., Yalavarthy, R., Chakraborty, D., & Upadhyay, P. D. (2024). LeGen: Complex information extraction from legal sentences using generative models. In Proceedings of the Natural Legal Language Processing Workshop 2024 (pp. 1-17).",
    href: "https://aclanthology.org/2024.nllp-1.1/",
    takeaway:
      "Demonstrates why legal and policy text needs specialized extraction workflows instead of naïve keyword collection."
  }
];

function formatPercent(value: number | null | undefined) {
  if (typeof value !== "number") return "n/a";
  return `${Math.round(value * 100)}%`;
}

function formatNumber(value: number | null | undefined, digits = 1) {
  if (typeof value !== "number") return "n/a";
  return value.toFixed(digits);
}

export function ProjectOverviewPage({ records, onOpenDashboard }: ProjectOverviewPageProps) {
  const evaluation = latestEvaluation as {
    gold_record_count?: number;
    citation_support_rate?: number;
    review_queue_rate?: number;
    packet_backed_subset?: { gold_record_count?: number };
    approval_route_distribution?: Record<string, number>;
  };

  const codedRecords = records.filter((record) => record.snapshotStatus === "coded");
  const publishedRecords = records.filter(
    (record) =>
      record.approvalRoute === "auto_approve" ||
      record.approvalRoute === "sample_audit" ||
      record.auditStatus === "completed"
  );
  const totalSources = codedRecords.reduce(
    (sum, record) => sum + (record.sourceDocuments?.length ?? 0),
    0
  );
  const highConfidenceCount = codedRecords.filter((record) => record.confidence >= 0.85).length;
  const averageStrength =
    codedRecords.reduce((sum, record) => sum + record.policyStrength, 0) / Math.max(codedRecords.length, 1);
  const reviewQueueCount =
    (evaluation.approval_route_distribution?.human_review ?? 0) +
    (evaluation.approval_route_distribution?.sample_audit ?? 0);

  return (
    <div className="overview-shell aied-themed">
      <header className="overview-topbar">
        <div className="overview-topbar-brand">
          <span className="overview-topbar-mark">
            <AppIcon className="brand-icon" decorative />
          </span>
          <div>
            <strong>AI Education Policy Observatory</strong>
            <span>An Agentic Policy Surveillance Framework</span>
          </div>
        </div>

        <nav className="overview-topbar-nav" aria-label="Project overview navigation">
          <a href="#why-it-matters">Why It Matters</a>
          <a href="#system-design">System Design</a>
          <a href="#research-grounding">Research Grounding</a>
        </nav>

        <button type="button" className="overview-topbar-button" onClick={() => onOpenDashboard("map-view")}>
          Open Tracker
        </button>
      </header>

      <main className="overview-content">
        <section className="overview-hero">
          <div className="overview-hero-copy">
            <span className="overview-kicker">Project Overview</span>
            <h1>A policy observatory for AI in education.</h1>
            <p>
              The system combines policy surveillance, evidence-grounded extraction, and selective
              review routing so researchers and leadership teams can monitor how states govern AI
              use, assessment, privacy, professional learning, and implementation readiness.
            </p>

            <div className="overview-hero-actions">
              <button type="button" className="overview-primary-action" onClick={() => onOpenDashboard("map-view")}>
                Enter Dashboard
              </button>
              <button
                type="button"
                className="overview-secondary-action"
                onClick={() => onOpenDashboard("source-library")}
              >
                Browse Source Library
              </button>
            </div>

            <div className="overview-proofline">
              <span>Grounded in policy surveillance and legal epidemiology</span>
              <span>Built for agentic extraction, not opaque scoring</span>
              <span>Designed for auditability, provenance, and update cycles</span>
            </div>
          </div>

          <div className="overview-hero-panel">
            <div className="overview-panel-card">
              <span>Published jurisdictions</span>
              <strong>{publishedRecords.length}</strong>
              <p>States currently surfaced in the public dashboard after routing and publication rules.</p>
            </div>

            <div className="overview-panel-grid">
              <article>
                <span>Source documents</span>
                <strong>{totalSources}</strong>
              </article>
              <article>
                <span>High-confidence coded states</span>
                <strong>{highConfidenceCount}</strong>
              </article>
              <article>
                <span>Gold-set records</span>
                <strong>{evaluation.gold_record_count ?? "n/a"}</strong>
              </article>
              <article>
                <span>Citation support</span>
                <strong>{formatPercent(evaluation.citation_support_rate)}</strong>
              </article>
            </div>
          </div>
        </section>

        <section className="overview-section" id="why-it-matters">
          <div className="overview-section-header">
            <span className="overview-kicker">Why This Project Is Needed</span>
            <h2>Policy change is outpacing conventional monitoring.</h2>
          </div>

          <div className="overview-rationale-grid">
            <article className="overview-rationale-card">
              <span className="overview-chip">1</span>
              <h3>Policy guidance is distributed across pages, PDFs, letters, press releases, and local implementation notes.</h3>
              <p>
                Policy surveillance research shows that laws and policy signals are often influential
                long before they are easy to compare. That makes a structured source registry and
                coding system necessary, not optional.
              </p>
              <a href={researchReferences[0].href} target="_blank" rel="noreferrer">
                Kavanagh et al. (2020)
              </a>
            </article>

            <article className="overview-rationale-card">
              <span className="overview-chip">2</span>
              <h3>Cross-jurisdiction comparison requires explicit codebooks, reproducible methods, and longitudinal records.</h3>
              <p>
                Global legal epidemiology emphasizes that policy datasets need formal inclusion rules,
                repeatable coding procedures, and methods that can support both mapping and causal
                analysis over time.
              </p>
              <a href={researchReferences[1].href} target="_blank" rel="noreferrer">
                Poirier et al. (2022)
              </a>
            </article>

            <article className="overview-rationale-card">
              <span className="overview-chip">3</span>
              <h3>AI in education is a governance problem as much as a pedagogical one.</h3>
              <p>
                Recent education research argues that AI adoption changes assessment, teacher support,
                oversight, and accountability. A tracker is useful only if it captures those governance
                dimensions with evidence.
              </p>
              <a href={researchReferences[3].href} target="_blank" rel="noreferrer">
                Ifenthaler et al. (2024)
              </a>
            </article>
          </div>
        </section>

        <section className="overview-section overview-section-alt" id="system-design">
          <div className="overview-section-header">
            <span className="overview-kicker">System Design</span>
            <h2>An agentic workflow with evidence first, structured coding second, and human review only where it actually matters.</h2>
          </div>

          <div className="overview-process">
            <article>
              <span>01</span>
              <h3>Source Registry</h3>
              <p>Collect official statewide pages, PDFs, memos, model policies, and implementation artifacts into a governed intake layer.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Raw Document Store</h3>
              <p>Preserve raw HTML, PDF, and imported local files so every coding decision can be traced back to source text.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Evidence Index</h3>
              <p>Chunk and score source text for retrieval so extraction is grounded in explicit evidence spans rather than free-form summaries.</p>
            </article>
            <article>
              <span>04</span>
              <h3>Structured Extraction</h3>
              <p>Convert policy language into comparable fields such as AI use, assessment, privacy, teacher PD, and implementation stage.</p>
            </article>
            <article>
              <span>05</span>
              <h3>Approval Routing</h3>
              <p>Send high-confidence records to auto-approval, medium-confidence records to sample audit, and true hard cases to human review.</p>
            </article>
            <article>
              <span>06</span>
              <h3>Public Dashboard</h3>
              <p>Publish only the routed canonical records, preserving citations, APA references, and source-level provenance for every visible state.</p>
            </article>
          </div>

          <div className="overview-system-grid">
            <article className="overview-system-card">
              <span className="overview-chip">Research Goal</span>
              <h3>Make policy monitoring measurable</h3>
              <p>
                This project is designed to ask whether an agentic pipeline can reduce manual review
                burden without sacrificing evidence support, route accuracy, or update traceability.
              </p>
            </article>

            <article className="overview-system-card">
              <span className="overview-chip">Current Snapshot</span>
              <h3>Operational metrics from the live prototype</h3>
              <ul className="overview-metric-list">
                <li>
                  <strong>{codedRecords.length}</strong>
                  <span>coded jurisdictions in the current dashboard layer</span>
                </li>
                <li>
                  <strong>{formatNumber(averageStrength, 1)}</strong>
                  <span>average policy strength across coded states</span>
                </li>
                <li>
                  <strong>{reviewQueueCount}</strong>
                  <span>records currently routed to sample or human review</span>
                </li>
                <li>
                  <strong>{formatPercent(evaluation.review_queue_rate)}</strong>
                  <span>review-queue rate after current routing policy</span>
                </li>
              </ul>
            </article>
          </div>
        </section>

        <section className="overview-section">
          <div className="overview-section-header">
            <span className="overview-kicker">Research Contribution</span>
            <h2>The value of this system is not just visualization. It is the combination of extraction, provenance, and evaluation.</h2>
          </div>

          <div className="overview-contribution-grid">
            <article>
              <h3>Policy surveillance adapted for AI governance</h3>
              <p>
                The tracker treats education AI policy as a living, coded dataset instead of a one-off
                report, enabling versioned comparisons and structured updates.
              </p>
            </article>
            <article>
              <h3>Evidence-grounded LLM extraction</h3>
              <p>
                Instead of trusting abstract summaries, the system keeps field-level evidence spans and
                approval routes tied to source authority and confidence thresholds.
              </p>
            </article>
            <article>
              <h3>Human-on-the-loop rather than human-in-the-loop</h3>
              <p>
                The goal is selective audit, not permanent manual coding. High-confidence cases should
                flow automatically, while conflict and citation gaps become the main escalation signals.
              </p>
            </article>
          </div>
        </section>

        <section className="overview-section overview-section-alt" id="research-grounding">
          <div className="overview-section-header">
            <span className="overview-kicker">Academic Grounding</span>
            <h2>The project is intentionally anchored in peer-reviewed work on policy surveillance, legal text extraction, and AI governance.</h2>
          </div>

          <div className="overview-reference-stack">
            {researchReferences.map((reference) => (
              <article key={reference.id} className="overview-reference-card">
                <div className="overview-reference-meta">
                  <span>{reference.shortLabel}</span>
                  <a href={reference.href} target="_blank" rel="noreferrer">
                    Open source
                  </a>
                </div>
                <p>{reference.title}</p>
                <strong>Why it matters here</strong>
                <span>{reference.takeaway}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="overview-final-band">
          <div>
            <span className="overview-kicker">Why This Matters Now</span>
            <h2>Without a living evidence layer, AI education policy quickly becomes anecdotal, outdated, and impossible to compare.</h2>
          </div>
          <p>
            The point of this project is to make policy change legible: what exists, where it came
            from, how confident we are, what still needs review, and how that picture evolves over
            time.
          </p>
          <div className="overview-hero-actions">
            <button type="button" className="overview-primary-action" onClick={() => onOpenDashboard("map-view")}>
              View Live Dashboard
            </button>
            <button
              type="button"
              className="overview-secondary-action"
              onClick={() => onOpenDashboard("methodology")}
            >
              Read Methodology
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
