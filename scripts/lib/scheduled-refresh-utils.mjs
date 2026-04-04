import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");

export const refreshConfigPath = path.join(rootDir, "config", "policy-refresh.json");
export const refreshStatePath = path.join(rootDir, "data", "generated", "pipeline-run-state.json");

export function getProjectRoot() {
  return rootDir;
}

export function readJsonFile(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJsonFile(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function loadRefreshConfig() {
  return readJsonFile(refreshConfigPath, {
    enabled: true,
    cadenceDays: 14,
    cronSchedule: "17 9 * * *",
    runEvaluate: true,
    runDeepResearch: false,
    steps: []
  });
}

export function loadRefreshState(config = loadRefreshConfig()) {
  return readJsonFile(refreshStatePath, {
    workflowId: "biweekly-policy-refresh",
    cadenceDays: config.cadenceDays ?? 14,
    lastAttemptAt: null,
    lastSuccessfulRunAt: null,
    lastStatus: "idle",
    lastTrigger: null,
    lastRunId: null,
    nextDueAt: null,
    stepResults: [],
    lastError: null
  });
}

export function saveRefreshState(state) {
  writeJsonFile(refreshStatePath, state);
}

export function computeNextDueAt(fromIso, cadenceDays) {
  if (!fromIso) return null;
  const date = new Date(fromIso);
  date.setUTCDate(date.getUTCDate() + cadenceDays);
  return date.toISOString();
}

export function isRefreshDue(state, config, now = new Date()) {
  if (!config.enabled) return false;
  if (!state.lastSuccessfulRunAt) return true;

  const lastSuccess = new Date(state.lastSuccessfulRunAt);
  const elapsedMs = now.getTime() - lastSuccess.getTime();
  const cadenceMs = (config.cadenceDays ?? 14) * 24 * 60 * 60 * 1000;
  return elapsedMs >= cadenceMs;
}

export function createRunId(now = new Date()) {
  return `refresh_${now.toISOString().replace(/[:.]/g, "-")}`;
}
