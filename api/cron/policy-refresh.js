import { spawnSync } from "node:child_process";
import {
  loadRefreshConfig,
  loadRefreshState
} from "../../scripts/lib/scheduled-refresh-utils.mjs";

function isAuthorized(request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;

  const authHeader = request.headers.authorization;
  return authHeader === `Bearer ${cronSecret}`;
}

export default function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!isAuthorized(request)) {
    return response.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const config = loadRefreshConfig();
  const state = loadRefreshState(config);
  const nodeCommand = process.execPath;
  const result = spawnSync(
    nodeCommand,
    ["scripts/run-scheduled-policy-refresh.mjs", "--trigger=cron"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: "pipe"
    }
  );

  let payload;

  try {
    payload = JSON.parse((result.stdout ?? "").trim() || "{}");
  } catch {
    payload = {
      ok: result.status === 0,
      parseError: true,
      stdout: (result.stdout ?? "").trim().slice(-4000),
      stderr: (result.stderr ?? "").trim().slice(-4000)
    };
  }

  return response.status(result.status === 0 ? 200 : 500).json({
    ok: result.status === 0,
    workflowId: state.workflowId ?? "biweekly-policy-refresh",
    cadenceDays: config.cadenceDays ?? 14,
    schedule: config.cronSchedule ?? null,
    result: payload
  });
}
