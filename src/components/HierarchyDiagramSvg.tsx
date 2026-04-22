import type { IssuerLevel, PolicyRecord, SourceDocument } from "../types";

interface HierarchyDiagramSvgProps {
  record: PolicyRecord;
}

const LAYER_ORDER: IssuerLevel[] = [
  "governor_office",
  "state_agency",
  "legislature",
  "legislative_study_body",
  "higher_ed_coordinator",
  "k12_district",
  "higher_ed_institution"
];

const LAYER_LABEL: Record<IssuerLevel, string> = {
  governor_office: "Governor",
  state_agency: "State Agency",
  legislature: "Legislature",
  legislative_study_body: "Legis. Study Body",
  higher_ed_coordinator: "Higher-Ed Coordinator",
  k12_district: "K-12 District",
  higher_ed_institution: "Higher-Ed Institution"
};

const LAYER_COLOR: Record<IssuerLevel, string> = {
  governor_office: "#d97706",
  state_agency: "#ea580c",
  legislature: "#7c3aed",
  legislative_study_body: "#a855f7",
  higher_ed_coordinator: "#4f46e5",
  k12_district: "#0d9488",
  higher_ed_institution: "#6366f1"
};

interface Row {
  layer: IssuerLevel;
  docs: SourceDocument[];
}

export function HierarchyDiagramSvg({ record }: HierarchyDiagramSvgProps) {
  const byLayer = new Map<IssuerLevel, SourceDocument[]>();
  for (const doc of record.sourceDocuments) {
    if (!doc.issuerLevel) continue;
    const list = byLayer.get(doc.issuerLevel) ?? [];
    list.push(doc);
    byLayer.set(doc.issuerLevel, list);
  }
  const rows: Row[] = LAYER_ORDER.filter((l) => byLayer.has(l)).map((layer) => ({
    layer,
    docs: byLayer.get(layer)!
  }));

  if (rows.length < 2) return null;

  const width = 520;
  const rowH = 44;
  const padTop = 12;
  const padLeft = 160;
  const padRight = 20;
  const laneW = width - padLeft - padRight;
  const height = padTop + rows.length * rowH + 16;

  // Build a lookup from documentId → { x, y } so we can draw relation arrows.
  const position = new Map<string, { x: number; y: number }>();

  return (
    <div className="hierarchy-diagram">
      <div className="hierarchy-header">
        <span className="mini-heading">Policy hierarchy</span>
        <span className="hierarchy-range">
          {record.sourceDocuments.length} instruments · {rows.length} layers
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
        {rows.map((row, rowIdx) => {
          const y = padTop + rowIdx * rowH + rowH / 2;
          const dotCount = Math.min(row.docs.length, 8);
          return (
            <g key={row.layer}>
              <text x={padLeft - 12} y={y + 4} fontSize={11} fill="#334155" textAnchor="end">
                {LAYER_LABEL[row.layer]}
              </text>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth={1}
              />
              {row.docs.slice(0, dotCount).map((doc, i) => {
                const x = padLeft + ((i + 1) / (dotCount + 1)) * laneW;
                if (doc.documentId) position.set(doc.documentId, { x, y });
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r={7} fill={LAYER_COLOR[row.layer]}>
                      <title>
                        {doc.title ?? doc.documentId ?? doc.url}
                        {doc.issuerName ? ` — ${doc.issuerName}` : ""}
                        {doc.status ? ` · ${doc.status}` : ""}
                        {doc.effectiveDate ? ` · effective ${doc.effectiveDate}` : ""}
                      </title>
                    </circle>
                  </g>
                );
              })}
              {row.docs.length > dotCount && (
                <text
                  x={width - padRight}
                  y={y + 4}
                  fontSize={10}
                  fill="#64748b"
                  textAnchor="end"
                >
                  +{row.docs.length - dotCount}
                </text>
              )}
            </g>
          );
        })}

        {/* Relation arrows */}
        {record.sourceDocuments.map((doc) =>
          (doc.relations ?? []).map((rel, i) => {
            if (!doc.documentId) return null;
            const src = position.get(doc.documentId);
            const dst = position.get(rel.targetDocumentId);
            if (!src || !dst) return null;
            return (
              <g key={`${doc.documentId}-${i}`}>
                <line
                  x1={src.x}
                  y1={src.y}
                  x2={dst.x}
                  y2={dst.y}
                  stroke="#94a3b8"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  opacity={0.7}
                />
                <text
                  x={(src.x + dst.x) / 2}
                  y={(src.y + dst.y) / 2 - 2}
                  fontSize={8}
                  fill="#64748b"
                  textAnchor="middle"
                >
                  {rel.kind}
                </text>
              </g>
            );
          })
        )}
      </svg>
    </div>
  );
}
