import {
  formatConfidence,
  formatScoreLabel,
  getPolicyStageLabel,
  getPriorityDomains,
  scoringLabels
} from "../data/policyData";
import type { EvidenceSpan, PolicyRecord } from "../types";
import { InstrumentTimelineSvg } from "./InstrumentTimelineSvg";

interface PolicyDetailPanelProps {
  record: PolicyRecord;
}

const FIELD_LABELS: Record<string, string> = {
  ai_use_allowed: "Use",
  assessment_policy: "Assessment",
  privacy_policy: "Privacy",
  teacher_pd_support: "Teacher PD",
  implementation_stage: "Implementation",
  policy_orientation: "Orientation"
};

function formatEvidenceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getFieldEvidence(record: PolicyRecord, field: string): EvidenceSpan[] {
  return record.evidenceSpans.filter((span) => span.field === field).slice(0, 2);
}

function formatApaDate(dateGuess?: string | null): string {
  if (!dateGuess) {
    return "(n.d.).";
  }

  const parsed = new Date(dateGuess);
  if (Number.isNaN(parsed.getTime())) {
    return `(${dateGuess}).`;
  }

  const hasDay = /\b\d{1,2},\s+\d{4}\b/.test(dateGuess);
  const hasMonth = /January|February|March|April|May|June|July|August|September|October|November|December/i.test(
    dateGuess
  );

  const year = parsed.getUTCFullYear();
  if (!hasMonth) {
    return `(${year}).`;
  }

  const month = parsed.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  if (!hasDay) {
    return `(${year}, ${month}).`;
  }

  const day = parsed.getUTCDate();
  return `(${year}, ${month} ${day}).`;
}

function formatApaReference(record: PolicyRecord, source: PolicyRecord["sourceDocuments"][number]): string {
  const agency = `${record.stateName} Department of Education`;
  const title = source.title ?? source.url;
  return `${agency}. ${formatApaDate(source.publishedDateGuess)} *${title}*.`;
}

function EvidenceHover({
  label,
  evidence
}: {
  label: string;
  evidence: EvidenceSpan[];
}) {
  if (evidence.length === 0) {
    return null;
  }

  return (
    <span className="citation-chip" tabIndex={0} aria-label={`${label} evidence`}>
      Cite
      <span className="citation-popover" role="tooltip">
        <span className="citation-title">{label} evidence</span>
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

function ScoreRow({
  label,
  value,
  evidence
}: {
  label: string;
  value: number;
  evidence: EvidenceSpan[];
}) {
  const width = `${Math.min(value, 4) * 25}%`;

  return (
    <div className="score-row">
      <div className="score-label-row">
        <span>{label}</span>
        <div className="score-value-meta">
          <strong>{value}</strong>
          <EvidenceHover label={label} evidence={evidence} />
        </div>
      </div>
      <div className="score-bar">
        <span style={{ width }} />
      </div>
      <small>{scoringLabels[value] ?? "Coded value"}</small>
    </div>
  );
}

export function PolicyDetailPanel({ record }: PolicyDetailPanelProps) {
  const strengthEvidence = record.evidenceSpans.filter((span) => FIELD_LABELS[span.field]).slice(0, 3);
  const orientationEvidence = getFieldEvidence(record, "policy_orientation");
  const stageEvidence = getFieldEvidence(record, "implementation_stage");
  const priorityDomains = getPriorityDomains(record);

  return (
    <aside className="detail-panel">
      <div className="detail-header">
        <div>
          <div className="section-kicker">{record.regionType}</div>
          <h3>
            {record.stateName} <span>{record.stateAbbr}</span>
          </h3>
        </div>
        <div className={`status-pill ${record.snapshotStatus}`}>
          {record.snapshotStatus === "coded" ? "Coded snapshot" : "Queued"}
        </div>
      </div>

      <InstrumentTimelineSvg record={record} />

      <div className="detail-highlight">
        <div>
          <span className="detail-label">Policy strength</span>
          <div className="detail-highlight-value">
            <strong>{formatScoreLabel(record)}</strong>
            <EvidenceHover label="Policy strength" evidence={strengthEvidence} />
          </div>
        </div>
        <div>
          <span className="detail-label">Policy stage</span>
          <div className="detail-highlight-value">
            <strong>{getPolicyStageLabel(record.implementationStage)}</strong>
            <EvidenceHover label="Policy stage" evidence={stageEvidence} />
          </div>
        </div>
        <div>
          <span className="detail-label">Confidence</span>
          <strong>{formatConfidence(record.confidence)}</strong>
        </div>
      </div>

      <div className="detail-block">
        <p className="detail-note">{record.notes}</p>
      </div>

      <div className="detail-block">
        <div className="trust-boundary-row">
          <span className="trust-boundary-chip primary">Primary evidence layer</span>
          <span className="trust-boundary-chip provisional">
            {record.snapshotStatus === "coded" ? "Canonical coded record" : "Provisional queued record"}
          </span>
        </div>
      </div>

      <div className="detail-block">
        <div className="mini-heading">Coding profile</div>
        <ScoreRow
          label="Use"
          value={record.aiUseAllowed}
          evidence={getFieldEvidence(record, "ai_use_allowed")}
        />
        <ScoreRow
          label="Assessment"
          value={record.assessmentPolicy}
          evidence={getFieldEvidence(record, "assessment_policy")}
        />
        <ScoreRow
          label="Privacy"
          value={record.privacyPolicy}
          evidence={getFieldEvidence(record, "privacy_policy")}
        />
        <ScoreRow
          label="Teacher PD"
          value={record.teacherPdSupport}
          evidence={getFieldEvidence(record, "teacher_pd_support")}
        />
        <ScoreRow
          label="Implementation"
          value={record.implementationStage}
          evidence={getFieldEvidence(record, "implementation_stage")}
        />
      </div>

      <div className="detail-block">
        <div className="mini-heading">Priority policy domains</div>
        {priorityDomains.length > 0 ? (
          <ul className="inline-list">
            {priorityDomains.map((domain) => (
              <li key={domain}>{domain}</li>
            ))}
          </ul>
        ) : (
          <p>No domain pattern coded yet.</p>
        )}
      </div>

      <div className="detail-block">
        <div className="mini-heading">Orientation</div>
        <div className="detail-inline-meta">
          <p>{record.policyOrientation}</p>
          <EvidenceHover label="Orientation" evidence={orientationEvidence} />
        </div>
      </div>

      <div className="detail-block">
        <div className="mini-heading">Approved tools</div>
        {record.approvedTools.length > 0 ? (
          <ul className="inline-list">
            {record.approvedTools.map((tool) => (
              <li key={tool}>{tool}</li>
            ))}
          </ul>
        ) : (
          <p>No approved-tool detail coded yet.</p>
        )}
      </div>

      <div className="detail-block">
        <div className="mini-heading">APA references</div>
        {record.sourceDocuments.length > 0 ? (
          <ol className="reference-list">
            {record.sourceDocuments.map((source) => (
              <li key={source.url}>
                <span>{formatApaReference(record, source)} </span>
                <a href={source.url} target="_blank" rel="noreferrer">
                  Link
                </a>
              </li>
            ))}
          </ol>
        ) : (
          <p>No source references attached yet.</p>
        )}
      </div>

      <div className="detail-block meta-grid">
        <div>
          <span className="detail-label">Year</span>
          <strong>{record.year}</strong>
        </div>
        <div>
          <span className="detail-label">Updated</span>
          <strong>{record.lastUpdated}</strong>
        </div>
        <div>
          <span className="detail-label">Source</span>
          <strong>{record.sourceTitle}</strong>
        </div>
      </div>
    </aside>
  );
}
