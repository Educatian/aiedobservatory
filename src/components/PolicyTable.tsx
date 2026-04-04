import {
  formatConfidence,
  formatScoreLabel,
  getPolicyStageLabel,
  getPriorityDomains
} from "../data/policyData";
import type { PolicyRecord } from "../types";

interface PolicyTableProps {
  records: PolicyRecord[];
  selectedState: string;
  onSelect: (stateAbbr: string) => void;
}

export function PolicyTable({ records, selectedState, onSelect }: PolicyTableProps) {
  return (
    <section className="table-section">
      <div className="section-kicker">Dataset preview</div>
      <div className="table-header">
        <div>
          <h2>Row-based tracker table</h2>
          <p>
            One coded record per region-year snapshot, ready to join to map layers later through a
            stable geographic key.
          </p>
        </div>
      </div>

      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>State</th>
              <th>Status</th>
              <th>Policy stage</th>
              <th>Policy domains</th>
              <th>Strength</th>
              <th>Confidence</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr
                key={record.regionId}
                className={record.stateAbbr === selectedState ? "selected" : ""}
                onClick={() => onSelect(record.stateAbbr)}
              >
                <td>
                  <button type="button" className="table-state-button">
                    <span>{record.stateName}</span>
                    <small>{record.stateAbbr}</small>
                  </button>
                </td>
                <td>{record.snapshotStatus}</td>
                <td>{getPolicyStageLabel(record.implementationStage)}</td>
                <td>{getPriorityDomains(record).join(" • ") || "Not coded"}</td>
                <td>{formatScoreLabel(record)}</td>
                <td>{formatConfidence(record.confidence)}</td>
                <td>{record.lastUpdated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
