import {
  loadRefreshConfig,
  loadRefreshState
} from "../../scripts/lib/scheduled-refresh-utils.mjs";

export default function handler(_request, response) {
  const config = loadRefreshConfig();
  const state = loadRefreshState(config);

  return response.status(200).json({
    ok: true,
    workflowId: state.workflowId,
    cadenceDays: config.cadenceDays ?? 14,
    cronSchedule: config.cronSchedule ?? null,
    state
  });
}
