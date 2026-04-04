import { getPolicyStageLabel } from "../data/policyData";
import type { PolicyRecord } from "../types";

interface PolicyStageSectionProps {
  records: PolicyRecord[];
  onSelectState: (stateAbbr: string) => void;
}

const STAGE_LEVELS = [4, 3, 2, 1, 0] as const;

const STAGE_NOTES: Record<number, string> = {
  4: "Operational policies with active implementation or institutionalized guidance.",
  3: "Released state guidance with meaningful public framing for adoption.",
  2: "Framework-stage materials that signal direction but remain partial.",
  1: "Early signals, pilots, or weak statewide references.",
  0: "No verified coded stage yet."
};

export function PolicyStageSection({
  records,
  onSelectState
}: PolicyStageSectionProps) {
  const codedRecords = records.filter((record) => record.snapshotStatus === "coded");

  return (
    <section className="stage-section" id="policy-stage">
      <div className="stage-header">
        <span className="page-kicker">Maturity Lens</span>
        <h4>Policy Stage</h4>
        <p>
          See how states distribute across early signals, framework guidance, released policy, and
          operationalized implementation.
        </p>
      </div>

      <div className="stage-board">
        {STAGE_LEVELS.map((stage) => {
          const stageRecords = codedRecords
            .filter((record) => record.implementationStage === stage)
            .sort((left, right) => right.confidence - left.confidence || left.stateName.localeCompare(right.stateName));

          return (
            <article className="stage-column" key={stage}>
              <div className="stage-column-head">
                <div>
                  <span className="detail-label">Stage {stage}</span>
                  <h5>{getPolicyStageLabel(stage)}</h5>
                </div>
                <strong>{stageRecords.length}</strong>
              </div>
              <p>{STAGE_NOTES[stage]}</p>

              <div className="stage-state-list">
                {stageRecords.length > 0 ? (
                  stageRecords.map((record) => (
                    <button
                      type="button"
                      className="stage-state-pill"
                      key={`${stage}-${record.stateAbbr}`}
                      onClick={() => onSelectState(record.stateAbbr)}
                    >
                      <span>{record.stateName}</span>
                      <small>{Math.round(record.confidence * 100)}%</small>
                    </button>
                  ))
                ) : (
                  <div className="stage-empty">No states currently coded at this stage.</div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
