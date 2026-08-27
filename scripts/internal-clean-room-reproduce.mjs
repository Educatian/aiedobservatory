import { spawnSync } from "node:child_process";
import { cp, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const tempBase = path.resolve(os.tmpdir());
const tempRoot = await mkdtemp(path.join(tempBase, "openpolicy-clean-room-"));
const copyRoot = path.join(tempRoot, "project");
const reportDir = path.join(root, "data", "reproduction");
const reportPath = path.join(reportDir, "internal-clean-room-latest.json");

if (!path.resolve(tempRoot).startsWith(`${tempBase}${path.sep}`)) {
  throw new Error(`Refusing temporary operation outside OS temp directory: ${tempRoot}`);
}

const excludedPrefixes = [
  ".git",
  "node_modules",
  "dist",
  "data/generated/raw",
  "data/generated/chunks"
];

function includeSource(source) {
  const relative = path.relative(root, source).replaceAll("\\", "/");
  return !excludedPrefixes.some((prefix) => relative === prefix || relative.startsWith(`${prefix}/`));
}

function runNpm(args) {
  const npmExecPath = process.env.npm_execpath;
  if (!npmExecPath) throw new Error("npm_execpath is required; run this script through npm run reproduce:internal");
  const startedAt = Date.now();
  const result = spawnSync(process.execPath, [npmExecPath, ...args], {
    cwd: copyRoot,
    encoding: "utf8",
    env: { ...process.env, CI: "true" },
    maxBuffer: 20 * 1024 * 1024
  });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
  return {
    command: `npm ${args.join(" ")}`,
    exit_code: result.status,
    elapsed_ms: Date.now() - startedAt,
    output_tail: output.split(/\r?\n/).slice(-25)
  };
}

let report;
try {
  await cp(root, copyRoot, { recursive: true, filter: includeSource });
  const checks = [
    runNpm(["ci", "--ignore-scripts"]),
    runNpm(["test"]),
    runNpm(["run", "build"]),
    runNpm(["run", "benchmark:validate"]),
    runNpm(["run", "receipt:conformance"])
  ];
  report = {
    reproduction_type: "internal_clean_room_not_independent_external_reproduction",
    generated_at: new Date().toISOString(),
    source_state: "current_working_tree_copy_excluding_git_node_modules_dist_and_large_raw_cache",
    environment: {
      platform: `${process.platform}-${process.arch}`,
      node: process.version,
      temp_root_redacted: true
    },
    checks,
    passed: checks.every((check) => check.exit_code === 0),
    limitations: [
      "The project maintainer initiated this run, so it does not satisfy the independent reproduction gate.",
      "The run exercises the current working tree, not a public clean git tag.",
      "Large raw crawl caches are excluded because the release contract does not require them."
    ]
  };
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}

await mkdir(reportDir, { recursive: true });
await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
console.log(`Internal clean-room reproduction passed=${report.passed}; report=${reportPath}`);
if (!report.passed) process.exitCode = 1;
