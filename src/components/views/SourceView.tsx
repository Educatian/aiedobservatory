import React, { useMemo } from "react";
import { Btn, SVGIcon, Tag } from "../ui";
import type { PolicyRecord, SourceDocument } from "../../types";
import { fillForStrength, toDisplayState } from "../../lib/displayState";
import "./views.css";

export interface SourceViewProps {
  records: PolicyRecord[];
  onSelectState: (abbr: string) => void;
}

interface FlatSource {
  id: string;
  title: string;
  state: string;
  stateName: string;
  agency: string;
  domain: string;
  date: string;
  pages: number;
  url?: string;
  confidence: string;
  strength: number;
  doc: SourceDocument;
}

function flattenSources(records: PolicyRecord[]): FlatSource[] {
  const out: FlatSource[] = [];
  for (const r of records) {
    const ds = toDisplayState(r);
    const docs = r.sourceDocuments ?? [];
    for (let i = 0; i < docs.length; i++) {
      const d = docs[i];
      const id = d.documentId ?? `${r.stateAbbr}-${i + 1}`;
      out.push({
        id,
        title: d.title || d.url,
        state: r.stateAbbr,
        stateName: r.stateName,
        agency: d.issuerName || ds.leadAgency,
        domain: r.policyDomains?.[0] || "Governance",
        date: d.issuedDate || d.publishedDateGuess || ds.updated,
        pages: 1,
        url: d.url,
        confidence: ds.confidence,
        strength: ds.strength,
        doc: d,
      });
    }
  }
  return out;
}

const SourceView: React.FC<SourceViewProps> = ({ records, onSelectState }) => {
  const sources = useMemo(() => flattenSources(records).slice(0, 200), [records]);

  return (
    <div>
      <header className="aied-pagehead">
        <div className="aied-pagehead__col">
          <span className="aied-pagehead__kicker">Source library</span>
          <h1 className="aied-pagehead__title">{sources.length.toLocaleString()} indexed documents</h1>
          <span className="aied-pagehead__sub">All claims in the dashboard trace back to one of these sources.</span>
        </div>
        <span className="aied-pagehead__spacer" />
        <div className="aied-pagehead__actions">
          <Btn kind="primary" size="sm" gradient iconLeft={<SVGIcon name="add" size={14} />}>Add source</Btn>
        </div>
      </header>

      <div className="aied-sources">
        <div className="aied-sources__head" role="row">
          <div>ID</div>
          <div>Title</div>
          <div>State</div>
          <div>Agency</div>
          <div>Domain</div>
          <div>Date</div>
          <div style={{ textAlign: "right" }}>Pages</div>
        </div>
        {sources.map(s => (
          <div
            key={`${s.state}-${s.id}-${s.title}`}
            className="aied-sources__row"
            role="row"
            onClick={() => onSelectState(s.state)}
          >
            <div className="aied-sources__id">{s.id}</div>
            <div>
              <div className="aied-sources__title">{s.title}</div>
              <div className="aied-sources__title-sub">{s.confidence} confidence</div>
            </div>
            <div>
              <Tag kind="cool">
                <span className="aied-brief__swatch" style={{ background: fillForStrength(s.strength), width: 6, height: 6 }} />
                {s.state}
              </Tag>
            </div>
            <div className="aied-sources__agency">{s.agency}</div>
            <div><Tag kind="blue">{s.domain}</Tag></div>
            <div className="aied-sources__date">{s.date}</div>
            <div className="aied-sources__pages">{s.pages}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SourceView;
