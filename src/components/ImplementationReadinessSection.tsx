import { getPolicyStageLabel, getPriorityDomains } from "../data/policyData";
import type { PolicyRecord } from "../types";

interface ImplementationReadinessSectionProps {
  records: PolicyRecord[];
  selectedState: string;
  onSelectState: (stateAbbr: string) => void;
}

type ReadinessDimension = {
  key: string;
  label: string;
  value: (record: PolicyRecord) => number;
  note: string;
};

const DIMENSIONS: ReadinessDimension[] = [
  {
    key: "governance",
    label: "Governance",
    value: (record) => record.implementationStage,
    note: "Whether statewide guidance has moved into operational governance."
  },
  {
    key: "instruction",
    label: "Instruction",
    value: (record) => Math.max(record.aiUseAllowed, record.assessmentPolicy),
    note: "How clearly classroom use and assessment adaptation are addressed."
  },
  {
    key: "privacy",
    label: "Privacy",
    value: (record) => record.privacyPolicy,
    note: "How strongly student data, procurement, and vendor controls are specified."
  },
  {
    key: "professional-learning",
    label: "Professional Learning",
    value: (record) => record.teacherPdSupport,
    note: "Whether teacher training is paired with implementation support."
  }
];

function getReadinessClass(value: number): string {
  if (value >= 3) return "is-strong";
  if (value >= 2) return "is-mid";
  if (value >= 1) return "is-light";
  return "is-empty";
}

export function ImplementationReadinessSection({
  records,
  selectedState,
  onSelectState
}: ImplementationReadinessSectionProps) {
  const codedRecords = records.filter((record) => record.snapshotStatus === "coded");
  const selectedRecord =
    codedRecords.find((record) => record.stateAbbr === selectedState) ?? codedRecords[0] ?? null;

  if (!selectedRecord) {
    return null;
  }

  return (
    <section className="readiness-section" id="implementation-readiness">
      <div className="readiness-header">
        <div>
          <span className="page-kicker">Implementation Readiness</span>
          <h4>Where guidance is operational enough to act on</h4>
          <p>
            This layer separates policy presence from implementation readiness so leadership teams can see
            where governance, instruction, privacy, and educator support are mature enough for operational planning.
          </p>
        </div>
        <div className="readiness-selected-state">
          <span>Selected benchmark</span>
          <strong>{selectedRecord.stateName}</strong>
          <small>{getPolicyStageLabel(selectedRecord.implementationStage)}</small>
        </div>
      </div>

      <div className="readiness-grid">
        {DIMENSIONS.map((dimension) => {
          const ranked = [...codedRecords]
            .sort((left, right) => {
              const delta = dimension.value(right) - dimension.value(left);
              if (delta !== 0) return delta;
              return right.confidence - left.confidence;
            })
            .slice(0, 3);

          return (
            <article className="readiness-card" key={dimension.key}>
              <div className="readiness-card-head">
                <div>
                  <span className="readiness-overline">Coverage share</span>
                  <strong>
                    {Math.round(
                      (codedRecords.filter((record) => dimension.value(record) >= 2).length /
                        Math.max(codedRecords.length, 1)) *
                        100
                    )}
                    %
                  </strong>
                </div>
                <div className="readiness-pill">
                  Avg{" "}
                  {(
                    codedRecords.reduce((sum, record) => sum + dimension.value(record), 0) /
                    Math.max(codedRecords.length, 1)
                  ).toFixed(1)}
                  /4
                </div>
              </div>

              <h5>{dimension.label}</h5>
              <p>{dimension.note}</p>

              <div className="readiness-toplist">
                {ranked.map((record) => (
                  <button
                    type="button"
                    className="readiness-state-row"
                    key={`${dimension.key}-${record.stateAbbr}`}
                    onClick={() => onSelectState(record.stateAbbr)}
                  >
                    <div className="readiness-state-copy">
                      <strong>{record.stateName}</strong>
                      <small>{record.stateAbbr}</small>
                    </div>
                    <div className="readiness-state-meter">
                      <span className={`readiness-meter-bar ${getReadinessClass(dimension.value(record))}`}>
                        <i style={{ width: `${dimension.value(record) * 25}%` }} />
                      </span>
                      <strong>{dimension.value(record)}</strong>
                    </div>
                  </button>
                ))}
              </div>

              <div className="readiness-focus-note">
                <span>Current state</span>
                <strong>{selectedRecord.stateName}</strong>
                <p>
                  {dimension.label} is currently coded at {dimension.value(selectedRecord)}/4 with{" "}
                  {getPriorityDomains(selectedRecord).join(", ") || "no dominant domains"} as the strongest visible
                  policy domains.
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
