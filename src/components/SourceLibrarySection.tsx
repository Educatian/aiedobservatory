import { useMemo, useState } from "react";
import { formatConfidence } from "../data/policyData";
import type { EvidenceSpan, PolicyRecord } from "../types";

interface SourceLibrarySectionProps {
  records: PolicyRecord[];
  onSelectState: (stateAbbr: string) => void;
}

interface SourceRow {
  id: string;
  record: PolicyRecord;
  stateAbbr: string;
  stateName: string;
  title: string;
  url: string;
  publishedDateGuess?: string | null;
  sourceAuthority?: string;
  approvalRoute?: PolicyRecord["approvalRoute"];
  auditStatus?: PolicyRecord["auditStatus"];
  confidence: number;
  evidence: EvidenceSpan[];
}

const PAGE_SIZE = 12;

function formatPolicyLevel(authority?: string): string {
  switch (authority) {
    case "binding_law_or_regulation":
      return "Regulation";
    case "official_guidance":
      return "State Guidance";
    case "official_model_policy":
      return "Model Policy";
    case "official_press_release":
      return "Press Release";
    case "secondary_reporting":
      return "Secondary";
    default:
      return "Reference";
  }
}

function formatDateLabel(dateGuess?: string | null): string {
  if (!dateGuess) return "Date unknown";
  const parsed = new Date(dateGuess);
  if (Number.isNaN(parsed.getTime())) return dateGuess;
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function getConfidenceTone(confidence: number): "high" | "medium" | "low" {
  if (confidence >= 0.85) return "high";
  if (confidence >= 0.65) return "medium";
  return "low";
}

function formatApprovalRoute(route?: PolicyRecord["approvalRoute"]): string {
  switch (route) {
    case "auto_approve":
      return "Auto-approved";
    case "sample_audit":
      return "Sample audit";
    case "human_review":
      return "Human-reviewed";
    default:
      return "Unrouted";
  }
}

function formatEvidenceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function formatApaDate(dateGuess?: string | null): string {
  if (!dateGuess) return "(n.d.).";

  const parsed = new Date(dateGuess);
  if (Number.isNaN(parsed.getTime())) return `(${dateGuess}).`;

  const hasDay = /\b\d{1,2},\s+\d{4}\b/.test(dateGuess);
  const hasMonth = /January|February|March|April|May|June|July|August|September|October|November|December/i.test(
    dateGuess
  );

  const year = parsed.getUTCFullYear();
  if (!hasMonth) return `(${year}).`;

  const month = parsed.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  if (!hasDay) return `(${year}, ${month}).`;

  return `(${year}, ${month} ${parsed.getUTCDate()}).`;
}

function formatApaReference(row: SourceRow): string {
  const agency = `${row.stateName} Department of Education`;
  return `${agency}. ${formatApaDate(row.publishedDateGuess)} *${row.title}*.`;
}

function formatRoutingReason(reason: string): string {
  return reason
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function SourceEvidenceHover({ evidence }: { evidence: EvidenceSpan[] }) {
  if (evidence.length === 0) return null;

  return (
    <span className="source-citation-chip" tabIndex={0}>
      Cite
      <span className="citation-popover" role="tooltip">
        <span className="citation-title">Source evidence</span>
        {evidence.map((item, index) => (
          <span className="citation-entry" key={`${item.chunkId ?? item.sourceUrl}-${index}`}>
            <span className="citation-quote">"{item.quote}"</span>
            <a href={item.sourceUrl} target="_blank" rel="noreferrer">
              {formatEvidenceHost(item.sourceUrl)}
            </a>
          </span>
        ))}
      </span>
    </span>
  );
}

export function SourceLibrarySection({ records, onSelectState }: SourceLibrarySectionProps) {
  const [query, setQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);

  const sourceRows = useMemo<SourceRow[]>(() => {
    return records
      .filter((record) => record.snapshotStatus === "coded")
      .flatMap((record) =>
        record.sourceDocuments.map((source, index) => ({
          id: `${record.stateAbbr}-${index}-${source.url}`,
          record,
          stateAbbr: record.stateAbbr,
          stateName: record.stateName,
          title: source.title ?? source.url,
          url: source.url,
          publishedDateGuess: source.publishedDateGuess ?? null,
          sourceAuthority: record.sourceAuthority,
          approvalRoute: record.approvalRoute,
          auditStatus: record.auditStatus,
          confidence: record.confidence,
          evidence: record.evidenceSpans.filter((span) => span.sourceUrl === source.url).slice(0, 2)
        }))
      )
      .sort((left, right) => {
        const leftDate = new Date(left.publishedDateGuess ?? 0).getTime();
        const rightDate = new Date(right.publishedDateGuess ?? 0).getTime();
        return rightDate - leftDate || left.stateName.localeCompare(right.stateName);
      });
  }, [records]);

  const regionOptions = useMemo(
    () => ["all", ...new Set(sourceRows.map((row) => row.stateAbbr))],
    [sourceRows]
  );

  const levelOptions = useMemo(
    () => ["all", ...new Set(sourceRows.map((row) => formatPolicyLevel(row.sourceAuthority)))],
    [sourceRows]
  );

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return sourceRows.filter((row) => {
      const matchesQuery =
        normalized.length === 0
          ? true
          : row.title.toLowerCase().includes(normalized) ||
            row.stateName.toLowerCase().includes(normalized) ||
            row.url.toLowerCase().includes(normalized);

      const matchesRegion = regionFilter === "all" ? true : row.stateAbbr === regionFilter;
      const matchesLevel =
        levelFilter === "all" ? true : formatPolicyLevel(row.sourceAuthority) === levelFilter;

      return matchesQuery && matchesRegion && matchesLevel;
    });
  }, [levelFilter, query, regionFilter, sourceRows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const paginatedRows = filteredRows.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const activeRow = sourceRows.find((row) => row.id === activeRowId) ?? null;

  return (
    <section className="source-library-section" id="source-library">
      <div className="source-library-header">
        <span className="page-kicker">Archive &amp; Framework</span>
        <h4>Source Library</h4>
        <p>
          Access the primary guidance documents, implementation frameworks, and evidence pages that
          inform the current AI policy tracker.
        </p>
      </div>

      <div className="source-library-card">
        <div className="source-library-toolbar">
          <label className="source-search">
            <span className="material-symbols-outlined">manage_search</span>
            <input
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(0);
              }}
              placeholder="Search by document title, keywords, or issuing body..."
            />
          </label>

          <div className="source-toolbar-actions">
            <label className="source-filter-pill">
              <span className="material-symbols-outlined">filter_alt</span>
              <select
                value={regionFilter}
                onChange={(event) => {
                  setRegionFilter(event.target.value);
                  setPage(0);
                }}
              >
                {regionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "all" ? "All regions" : option}
                  </option>
                ))}
              </select>
            </label>

            <label className="source-filter-pill">
              <span className="material-symbols-outlined">policy</span>
              <select
                value={levelFilter}
                onChange={(event) => {
                  setLevelFilter(event.target.value);
                  setPage(0);
                }}
              >
                {levelOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "all" ? "All policy levels" : option}
                  </option>
                ))}
              </select>
            </label>

            <button className="source-apply-button" type="button">
              Apply Filters
            </button>
          </div>
        </div>

        <div className="source-table-shell">
          <table className="source-table">
            <thead>
              <tr>
                <th>Region</th>
                <th>Source Title</th>
                <th>Date</th>
                <th>Policy Level</th>
                <th>Confidence</th>
                <th aria-label="Open source" />
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => {
                const tone = getConfidenceTone(row.confidence);
                return (
                  <tr key={row.id} onClick={() => setActiveRowId(row.id)}>
                    <td>
                      <div className="source-region-cell">
                        <div className="source-flag" />
                        <span>{row.stateName}</span>
                      </div>
                    </td>
                    <td>
                      <span className="source-title">{row.title}</span>
                      <span className="source-url">{row.url.replace(/^https?:\/\//, "")}</span>
                      <div className="source-meta-row">
                        <span className={`source-route-badge ${row.approvalRoute ?? "unrouted"}`}>
                          {formatApprovalRoute(row.approvalRoute)}
                        </span>
                        <SourceEvidenceHover evidence={row.evidence} />
                      </div>
                    </td>
                    <td>{formatDateLabel(row.publishedDateGuess)}</td>
                    <td>
                      <span className="source-level-pill">{formatPolicyLevel(row.sourceAuthority)}</span>
                    </td>
                    <td>
                      <div className={`source-confidence ${tone}`}>
                        <span className="source-confidence-dot" />
                        <span>{formatConfidence(row.confidence)}</span>
                      </div>
                    </td>
                    <td className="source-link-cell">
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${row.title}`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <span className="material-symbols-outlined">open_in_new</span>
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="source-table-footer">
          <p>
            Showing {filteredRows.length === 0 ? 0 : currentPage * PAGE_SIZE + 1}-
            {Math.min((currentPage + 1) * PAGE_SIZE, filteredRows.length)} of {filteredRows.length} documents
          </p>
          <div className="source-pagination">
            <button type="button" onClick={() => setPage((value) => Math.max(0, value - 1))}>
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {activeRow ? (
        <div className="source-drawer-backdrop" onClick={() => setActiveRowId(null)}>
          <aside className="source-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="source-drawer-header">
              <div>
                <span className="page-kicker">Document Record</span>
                <h5>{activeRow.title}</h5>
                <p>
                  {activeRow.stateName} · {formatPolicyLevel(activeRow.sourceAuthority)} ·{" "}
                  {formatDateLabel(activeRow.publishedDateGuess)}
                </p>
              </div>
              <button type="button" className="source-drawer-close" onClick={() => setActiveRowId(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="source-drawer-block">
              <span className="mini-heading">APA reference</span>
              <p className="source-drawer-reference">{formatApaReference(activeRow)}</p>
              <a href={activeRow.url} target="_blank" rel="noreferrer">
                Open source link
              </a>
            </div>

            <div className="source-drawer-meta-grid">
              <div>
                <span className="detail-label">Approval route</span>
                <strong>{formatApprovalRoute(activeRow.approvalRoute)}</strong>
              </div>
              <div>
                <span className="detail-label">Audit status</span>
                <strong>{activeRow.auditStatus ?? "Unknown"}</strong>
              </div>
              <div>
                <span className="detail-label">Confidence</span>
                <strong>{formatConfidence(activeRow.confidence)}</strong>
              </div>
              <div>
                <span className="detail-label">Authority</span>
                <strong>{formatPolicyLevel(activeRow.sourceAuthority)}</strong>
              </div>
            </div>

            <div className="source-drawer-block">
              <span className="mini-heading">Approval reason</span>
              <p>
                {activeRow.record.verificationNotes ??
                  activeRow.record.notes ??
                  "No approval note is attached to this document yet."}
              </p>
            </div>

            <div className="source-drawer-block">
              <span className="mini-heading">Routing reasons</span>
              {activeRow.record.routingReasons && activeRow.record.routingReasons.length > 0 ? (
                <ul className="inline-list">
                  {activeRow.record.routingReasons.map((reason) => (
                    <li key={reason}>{formatRoutingReason(reason)}</li>
                  ))}
                </ul>
              ) : (
                <p>No routing reasons attached.</p>
              )}
            </div>

            {activeRow.record.deepResearchRecommended ? (
              <div className="source-drawer-block">
                <span className="mini-heading">Deep research flag</span>
                <p>
                  This document is marked for escalation because the pipeline detected unresolved
                  discovery or verification risk.
                </p>
                {activeRow.record.deepResearchReasons &&
                activeRow.record.deepResearchReasons.length > 0 ? (
                  <ul className="inline-list">
                    {activeRow.record.deepResearchReasons.map((reason) => (
                      <li key={reason}>{formatRoutingReason(reason)}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            <div className="source-drawer-block">
              <span className="mini-heading">Evidence excerpts</span>
              {activeRow.evidence.length > 0 ? (
                <div className="source-drawer-evidence-list">
                  {activeRow.evidence.map((item, index) => (
                    <article key={`${item.chunkId ?? item.sourceUrl}-${index}`} className="source-drawer-evidence-item">
                      <p>"{item.quote}"</p>
                      <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                        {formatEvidenceHost(item.sourceUrl)}
                      </a>
                    </article>
                  ))}
                </div>
              ) : (
                <p>No source-specific evidence span is attached yet.</p>
              )}
            </div>

            <div className="source-drawer-actions">
              <button type="button" className="source-drawer-primary" onClick={() => onSelectState(activeRow.stateAbbr)}>
                View {activeRow.stateName}
              </button>
              <button type="button" className="source-drawer-secondary" onClick={() => setActiveRowId(null)}>
                Close
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
