import type { InstrumentType, PolicyRecord, SourceDocument } from "../types";

interface InstrumentTimelineSvgProps {
  record: PolicyRecord;
}

const FAMILY_COLORS: Record<string, string> = {
  exec: "#d97706", // amber-600
  legis: "#7c3aed", // violet-600
  k12: "#0d9488", // teal-600
  highered: "#4f46e5", // indigo-600
  unknown: "#94a3b8" // slate-400
};

const INSTRUMENT_FAMILY: Record<InstrumentType, "exec" | "legis" | "k12" | "highered"> = {
  acceptable_use_policy: "exec",
  governance_body_charter: "exec",
  task_force_report: "exec",
  bill: "legis",
  legislative_study_report: "legis",
  district_position_statement: "k12",
  curricular_program: "k12",
  consortium_track: "highered",
  faculty_guideline: "highered",
  institutional_policy: "highered"
};

interface Dot {
  doc: SourceDocument;
  time: number;
  x: number;
  y: number;
  family: string;
}

function getDate(doc: SourceDocument): number | null {
  const iso = doc.effectiveDate ?? doc.issuedDate ?? doc.publishedDateGuess ?? null;
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : null;
}

export function InstrumentTimelineSvg({ record }: InstrumentTimelineSvgProps) {
  const dated = record.sourceDocuments
    .map((doc) => ({ doc, time: getDate(doc) }))
    .filter((e): e is { doc: SourceDocument; time: number } => e.time != null);

  if (dated.length < 2) return null;

  const times = dated.map((d) => d.time);
  const min = Math.min(...times);
  const max = Math.max(...times);
  const span = Math.max(max - min, 1);

  const width = 480;
  const height = 120;
  const padX = 32;
  const padY = 28;
  const innerW = width - padX * 2;

  // Greedy lane packing
  const laneCount = 3;
  const laneY = [padY, padY + 28, padY + 56];
  const lastX: number[] = new Array(laneCount).fill(-Infinity);

  const dots: Dot[] = dated
    .sort((a, b) => a.time - b.time)
    .map((entry) => {
      const x = padX + ((entry.time - min) / span) * innerW;
      let lane = 0;
      for (let i = 0; i < laneCount; i++) {
        if (x - lastX[i] > 18) {
          lane = i;
          break;
        }
        if (i === laneCount - 1) lane = 0;
      }
      lastX[lane] = x;
      const family = entry.doc.instrumentType
        ? INSTRUMENT_FAMILY[entry.doc.instrumentType]
        : "unknown";
      return {
        doc: entry.doc,
        time: entry.time,
        x,
        y: laneY[lane],
        family
      };
    });

  const minYear = new Date(min).getUTCFullYear();
  const maxYear = new Date(max).getUTCFullYear();

  return (
    <div className="instrument-timeline" role="img" aria-label="Instrument timeline">
      <div className="instrument-timeline-header">
        <span className="mini-heading">Instrument timeline</span>
        <span className="instrument-timeline-range">
          {minYear}–{maxYear} · {dots.length} instruments
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
        <line
          x1={padX}
          y1={height - padY}
          x2={width - padX}
          y2={height - padY}
          stroke="#cbd5e1"
          strokeWidth={1}
        />
        {dots.map((d, i) => (
          <g key={i}>
            <line
              x1={d.x}
              y1={d.y}
              x2={d.x}
              y2={height - padY}
              stroke={FAMILY_COLORS[d.family]}
              strokeWidth={1}
              strokeDasharray="2 3"
              opacity={0.5}
            />
            <circle cx={d.x} cy={d.y} r={6} fill={FAMILY_COLORS[d.family]}>
              <title>
                {d.doc.title ?? d.doc.documentId ?? d.doc.url}
                {d.doc.issuerName ? ` — ${d.doc.issuerName}` : ""}
                {d.doc.effectiveDate ? ` (effective ${d.doc.effectiveDate})` : ""}
                {d.doc.status ? ` · ${d.doc.status}` : ""}
              </title>
            </circle>
          </g>
        ))}
        <text x={padX} y={height - 8} fontSize={10} fill="#64748b">
          {minYear}
        </text>
        <text x={width - padX} y={height - 8} fontSize={10} fill="#64748b" textAnchor="end">
          {maxYear}
        </text>
      </svg>
      <div className="instrument-timeline-legend">
        <span className="itl-swatch itl-exec" /> Executive
        <span className="itl-swatch itl-legis" /> Legislative
        <span className="itl-swatch itl-k12" /> K-12 District
        <span className="itl-swatch itl-highered" /> Higher-Ed
      </div>
    </div>
  );
}
