import { useMemo, useState } from "react";
import canonicalRecords from "../../data/canonical/policy-records.json";

interface DistrictLayerPanelProps {
  stateAbbr: string;
}

type Classification = "primary_pdf" | "primary_html" | "secondary" | "unknown";

interface DistrictRow {
  recordId: string;
  jurisdictionName: string;
  classification: Classification;
  classificationLabel: string;
  policyRef?: string;
  date?: string;
  sourceUrl?: string;
  note: string;
}

/**
 * Parse a canonical district record into the display row.
 * Classification is lifted from the `[2026-04-22 body extraction]` tag we
 * wrote into verification_notes — no new schema field required.
 */
function toRow(rec: any): DistrictRow {
  const notes: string = rec.verification_notes || "";
  const src = (rec.source_documents || [])[0] || {};

  let classification: Classification = "unknown";
  let classificationLabel = "Uncoded";
  if (/primary_pdf/i.test(notes)) {
    classification = "primary_pdf";
    classificationLabel = "PDF";
  } else if (/primary_html/i.test(notes)) {
    classification = "primary_html";
    classificationLabel = "HTML";
  } else if (/secondary_reporting/i.test(notes)) {
    classification = "secondary";
    classificationLabel = "News";
  }

  // pull a policy number (e.g. "Policy 4.9.6", "Policy 7.17") or date hint.
  const polMatch = notes.match(/Policy\s+(\d+(?:\.\d+)*)/i);
  const dateMatch =
    notes.match(/dated\s+(\d{2}\/\d{2}\/\d{4})/i) ||
    notes.match(/(\d{4}-\d{2}-\d{2})/);

  const jurisdictionName =
    rec.jurisdiction_name ||
    (rec.record_id || "")
      .replace(/^district-al-/, "")
      .replace(/-v\d+$/, "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c: string) => c.toUpperCase());

  return {
    recordId: rec.record_id,
    jurisdictionName,
    classification,
    classificationLabel,
    policyRef: polMatch ? `Policy ${polMatch[1]}` : undefined,
    date: dateMatch ? dateMatch[1] : undefined,
    sourceUrl: src.url,
    note: notes
  };
}

export function DistrictLayerPanel({ stateAbbr }: DistrictLayerPanelProps) {
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = useMemo<DistrictRow[]>(() => {
    return (canonicalRecords as Array<any>)
      .filter(
        (r) =>
          r.state_abbr === stateAbbr &&
          r.jurisdiction_type === "district"
      )
      .map(toRow)
      .sort((a, b) => {
        const rank: Record<Classification, number> = {
          primary_pdf: 0,
          primary_html: 1,
          secondary: 2,
          unknown: 3
        };
        return (
          rank[a.classification] - rank[b.classification] ||
          a.jurisdictionName.localeCompare(b.jurisdictionName)
        );
      });
  }, [stateAbbr]);

  if (rows.length === 0) return null;

  const counts = rows.reduce(
    (acc, r) => {
      acc[r.classification] = (acc[r.classification] || 0) + 1;
      return acc;
    },
    {} as Record<Classification, number>
  );
  const primaryCount =
    (counts.primary_pdf || 0) + (counts.primary_html || 0);

  return (
    <section
      className="district-layer-panel"
      aria-label={`District layer (${rows.length} LEAs)`}
    >
      <button
        type="button"
        className="district-layer-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="material-symbols-outlined">
          {open ? "expand_more" : "chevron_right"}
        </span>
        <strong>District layer</strong>
        <span className="district-layer-count">{rows.length} LEAs</span>
        <span className="district-layer-split">
          {primaryCount}/{rows.length} primary
        </span>
      </button>

      {open && (
        <div className="district-layer-body">
          <p className="district-layer-finding">
            Of {rows.length} sampled {stateAbbr} LEAs,{" "}
            <strong>{primaryCount}</strong> publish primary AI-policy text
            {counts.primary_pdf
              ? ` (${counts.primary_pdf} PDF${counts.primary_pdf > 1 ? "s" : ""}`
              : ""}
            {counts.primary_html
              ? `${counts.primary_pdf ? ", " : " ("}${counts.primary_html} HTML`
              : ""}
            {primaryCount ? ")" : ""}; the remaining{" "}
            <strong>{counts.secondary || 0}</strong> are news-level reporting
            only. Template-adoption check against the ALSDE/
            aiforeducation.io LEA model came back NEGATIVE for every
            district tested — Alabama districts draft locally.
          </p>

          <ul className="district-layer-list">
            {rows.map((row) => (
              <li key={row.recordId} className="district-layer-row">
                <button
                  type="button"
                  className="district-layer-row-head"
                  onClick={() =>
                    setExpanded((prev) =>
                      prev === row.recordId ? null : row.recordId
                    )
                  }
                  aria-expanded={expanded === row.recordId}
                >
                  <span
                    className={`district-pill district-pill-${row.classification}`}
                    title={row.classificationLabel}
                  >
                    {row.classificationLabel}
                  </span>
                  <span className="district-layer-name">
                    {row.jurisdictionName}
                  </span>
                  <span className="district-layer-meta">
                    {row.policyRef || ""}
                    {row.policyRef && row.date ? " · " : ""}
                    {row.date || ""}
                  </span>
                  <span className="material-symbols-outlined district-layer-caret">
                    {expanded === row.recordId
                      ? "expand_less"
                      : "expand_more"}
                  </span>
                </button>

                {expanded === row.recordId && (
                  <div className="district-layer-row-body">
                    <p className="district-layer-note">{row.note}</p>
                    {row.sourceUrl && (
                      <a
                        className="district-layer-source"
                        href={row.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="material-symbols-outlined">
                          open_in_new
                        </span>
                        Source
                      </a>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
