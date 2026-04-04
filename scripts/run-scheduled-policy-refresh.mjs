import { spawnSync } from "node:child_process";
import {
  computeNextDueAt,
  createRunId,
  getProjectRoot,
  isRefreshDue,
  loadRefreshConfig,
  loadRefreshState,
  saveRefreshState
} from "./lib/scheduled-refresh-utils.mjs";

const argv = new Set(process.argv.slice(2));
const force = argv.has("--force");
const triggerArg = [...argv].find((value) => value.startsWith("--trigger="));
const trigger = triggerArg ? triggerArg.slice("--trigger=".length) : "manual";

const config = loadRefreshConfig();
const state = loadRefreshState(config);
const now = new Date();
const rootDir = getProjectRoot();

const runId = createRunId(now);
const due = force || isRefreshDue(state, config, now);

if (!due) {
  const summary = {
    ok: true,
    skipped: true,
    reason: "cadence_not_reached",
    runId,
    trigger,
    lastSuccessfulRunAt: state.lastSuccessfulRunAt,
    nextDueAt: state.nextDueAt ?? computeNextDueAt(state.lastSuccessfulRunAt, config.cadenceDays ?? 14)
  };

  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

const nextState = {
  ...state,
  cadenceDays: config.cadenceDays ?? 14,
  lastAttemptAt: now.toISOString(),
  lastStatus: "running",
  lastTrigger: trigger,
  lastRunId: runId,
  stepResults: [],
  lastError: null
};

saveRefreshState(nextState);

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const startedAt = Date.now();

for (const step of config.steps ?? []) {
  const startedStepAt = new Date().toISOString();
  const result = spawnSync(step.command === "npm" ? npmCommand : step.command, step.args ?? [], {
    cwd: rootDir,
    encoding: "utf8",
    stdio: "pipe"
  });

  const stepResult = {
    id: step.id,
    label: step.label,
    command: [step.command, ...(step.args ?? [])].join(" "),
    startedAt: startedStepAt,
    completedAt: new Date().toISOString(),
    ok: result.status === 0,
    exitCode: result.status ?? 1,
    stdout: (result.stdout ?? "").trim().slice(-4000),
    stderr: (result.stderr ?? "").trim().slice(-4000)
  };

  nextState.stepResults.push(stepResult);
  saveRefreshState(nextState);

  if (result.status !== 0) {
    nextState.lastStatus = "failed";
    nextState.lastError = {
      stepId: step.id,
      message: stepResult.stderr || `Step ${step.id} failed with exit code ${stepResult.exitCode}`
    };
    nextState.nextDueAt = computeNextDueAt(
      nextState.lastSuccessfulRunAt,
      config.cadenceDays ?? 14
    );
    saveRefreshState(nextState);

    console.error(JSON.stringify({ ok: false, runId, trigger, failedStep: step.id, state: nextState }, null, 2));
    process.exit(result.status ?? 1);
  }
}

nextState.lastStatus = "success";
nextState.lastSuccessfulRunAt = new Date().toISOString();
nextState.nextDueAt = computeNextDueAt(nextState.lastSuccessfulRunAt, config.cadenceDays ?? 14);
nextState.lastError = null;
saveRefreshState(nextState);

console.log(
  JSON.stringify(
    {
      ok: true,
      runId,
      trigger,
      durationMs: Date.now() - startedAt,
      nextDueAt: nextState.nextDueAt,
      steps: nextState.stepResults.map((step) => ({
        id: step.id,
        ok: step.ok,
        exitCode: step.exitCode
      }))
    },
    null,
    2
  )
);
