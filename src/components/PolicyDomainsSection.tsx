import type { PolicyRecord } from "../types";

interface PolicyDomainsSectionProps {
  records: PolicyRecord[];
  onSelectState: (stateAbbr: string) => void;
}

interface DomainSummary {
  key: "aiUseAllowed" | "assessmentPolicy" | "privacyPolicy" | "teacherPdSupport";
  label: string;
  description: string;
}

const DOMAIN_SUMMARIES: DomainSummary[] = [
  {
    key: "aiUseAllowed",
    label: "AI Use",
    description: "How explicitly classroom or educator-facing AI use is permitted and scoped."
  },
  {
    key: "assessmentPolicy",
    label: "Assessment",
    description: "Whether the state addresses disclosure, misuse, redesign, or AI-aware assessment practice."
  },
  {
    key: "privacyPolicy",
    label: "Privacy",
    description: "How strongly the policy addresses student data protection, procurement, and governance controls."
  },
  {
    key: "teacherPdSupport",
    label: "Teacher PD",
    description: "Whether teacher professional learning and implementation support are institutionally backed."
  }
];

function getTopStates(records: PolicyRecord[], key: DomainSummary["key"]) {
  return [...records]
    .sort((left, right) => right[key] - left[key] || right.confidence - left.confidence)
    .slice(0, 3);
}

export function PolicyDomainsSection({
  records,
  onSelectState
}: PolicyDomainsSectionProps) {
  const codedRecords = records.filter((record) => record.snapshotStatus === "coded");

  return (
    <section className="domains-section" id="policy-domains">
      <div className="domains-header">
        <span className="page-kicker">Domain Lens</span>
        <h4>Policy Domains</h4>
        <p>
          Compare how state policy coverage concentrates across use permissions, assessment rules,
          privacy safeguards, and teacher support.
        </p>
      </div>

      <div className="domains-grid">
        {DOMAIN_SUMMARIES.map((domain) => {
          const maxValue = Math.max(...codedRecords.map((record) => record[domain.key]), 1);
          const codedShare =
            codedRecords.length > 0
              ? Math.round(
                  (codedRecords.filter((record) => record[domain.key] > 0).length / codedRecords.length) * 100
                )
              : 0;
          const averageScore =
            codedRecords.length > 0
              ? (
                  codedRecords.reduce((sum, record) => sum + record[domain.key], 0) / codedRecords.length
                ).toFixed(1)
              : "0.0";
          const topStates = getTopStates(codedRecords, domain.key);

          return (
            <article className="domain-card" key={domain.key}>
              <div className="domain-card-head">
                <div>
                  <span className="detail-label">Coverage share</span>
                  <strong>{codedShare}%</strong>
                </div>
                <div className="domain-score-chip">Avg {averageScore}/4</div>
              </div>

              <h5>{domain.label}</h5>
              <p>{domain.description}</p>

              <div className="domain-toplist">
                {topStates.map((record) => (
                  <button
                    type="button"
                    className="domain-top-row"
                    key={`${domain.key}-${record.stateAbbr}`}
                    onClick={() => onSelectState(record.stateAbbr)}
                  >
                    <span className="domain-top-name">
                      {record.stateName}
                      <small>{record.stateAbbr}</small>
                    </span>
                    <span className="domain-top-meter">
                      <i style={{ width: `${(record[domain.key] / maxValue) * 100}%` }} />
                    </span>
                    <strong>{record[domain.key]}</strong>
                  </button>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
