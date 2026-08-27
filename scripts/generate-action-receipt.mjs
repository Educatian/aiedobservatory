import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const releaseDir = path.join(projectRoot, "data", "release", "v0.1");

async function describeArtifact(relativePath) {
  const absolutePath = path.join(projectRoot, relativePath);
  const [buffer, metadata] = await Promise.all([readFile(absolutePath), stat(absolutePath)]);
  return {
    path: relativePath.replaceAll("\\", "/"),
    sha256: createHash("sha256").update(buffer).digest("hex"),
    bytes: metadata.size
  };
}

function git(args, fallback) {
  try {
    return execFileSync("git", args, { cwd: projectRoot, encoding: "utf8" }).trim();
  } catch {
    return fallback;
  }
}

async function main() {
  const inputPaths = [
    "data/release/v0.1/policy-claims.json",
    "data/release/v0.1/source-rights.json"
  ];
  const outputPaths = [
    "data/release/v0.1/source-integrity.json",
    "data/release/v0.1/evaluation-card.json"
  ];
  const commit = git(["rev-parse", "HEAD"], "unavailable");
  const dirty = git(["status", "--porcelain"], "unknown").length > 0;
  const receipt = {
    receipt_version: "0.1",
    run_id: `openpolicy-${randomUUID()}`,
    generated_at: new Date().toISOString(),
    action: "assemble_and_evaluate_link_only_oregon_release_slice",
    actor: "Jewoong Moon",
    authorization_scope: {
      allowed_actions: ["read_release_inputs", "fetch_declared_sources", "write_release_audit"],
      network_access: true,
      secrets_access: false
    },
    code: {
      repository: "https://github.com/Educatian/aiedobservatory",
      commit,
      dirty
    },
    runtime: {
      node: process.version,
      platform: `${process.platform}-${process.arch}; ${os.release()}`,
      model_path: "deterministic_release_audit_no_model",
      prompt_version: null
    },
    inputs: await Promise.all(inputPaths.map(describeArtifact)),
    outputs: await Promise.all(outputPaths.map(describeArtifact)),
    review: {
      status: "pending",
      reviewer: null,
      correction_or_retirement: null
    }
  };

  await writeFile(
    path.join(releaseDir, "action-receipt.example.json"),
    JSON.stringify(receipt, null, 2),
    "utf8"
  );
  console.log(`Wrote action receipt ${receipt.run_id}; dirty=${dirty}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
