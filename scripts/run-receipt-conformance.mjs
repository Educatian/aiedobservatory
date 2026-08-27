import { generateKeyPairSync } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  appendLifecycleEvent,
  canonicalize,
  createReceipt,
  signReceipt,
  verifyReceipt
} from "../packages/openpolicy-receipts/src/index.mjs";
import { detectInjectionSignals } from "./lib/untrusted-content.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const suitePath = path.join(root, "data", "conformance", "v0.1", "cases.json");
const reportPath = path.join(root, "data", "conformance", "v0.1", "report.json");

const FIXED_TIME = "2026-08-27T20:00:00.000Z";

function baselineReceipt() {
  return createReceipt({
    receiptId: "opr-conformance-baseline",
    generatedAt: FIXED_TIME,
    actor: "conformance-agent",
    action: "summarize",
    resource: "https://example.gov/policy/1",
    authorization: {
      allowed_actions: ["summarize"],
      allowed_resources: ["https://example.gov/policy/*"],
      network_access: true,
      secrets_access: false,
      expires_at: "2026-08-28T20:00:00.000Z"
    },
    provenance: {
      source_url: "https://example.gov/policy/1",
      source_sha256: "1".repeat(64)
    },
    inputs: [{ name: "source", sha256: "2".repeat(64) }],
    outputs: [{ name: "summary", sha256: "3".repeat(64) }]
  });
}

function setPath(object, dottedPath, value) {
  const parts = dottedPath.split(".");
  let target = object;
  for (const part of parts.slice(0, -1)) {
    target = /^\d+$/.test(part) ? target[Number(part)] : target[part];
  }
  const last = parts.at(-1);
  target[/^\d+$/.test(last) ? Number(last) : last] = value;
}

function didReject(fn) {
  try {
    fn();
    return false;
  } catch {
    return true;
  }
}

function runCase(testCase, keys, wrongKeys) {
  const sign = (receipt) => signReceipt(receipt, keys.privateKey, { keyId: "conformance-key" });
  if (testCase.mode === "baseline") return verifyReceipt(sign(baselineReceipt()), keys.publicKey).ok;
  if (testCase.mode === "canonical_order") {
    return canonicalize({ z: 1, a: { y: 2, b: 3 } }) === canonicalize({ a: { b: 3, y: 2 }, z: 1 });
  }
  if (testCase.mode.startsWith("lifecycle_")) {
    const type = testCase.mode.replace("lifecycle_", "");
    const event = {
      type: type === "review" ? "human_review" : type,
      actor: "independent-reviewer",
      at: "2026-08-27T21:00:00.000Z",
      reason: `${type} conformance case`,
      ...(type === "review" ? { decision: "approved" } : {})
    };
    const updated = appendLifecycleEvent(sign(baselineReceipt()), event, keys.privateKey, { keyId: "conformance-key" });
    return verifyReceipt(updated, keys.publicKey).ok &&
      (type !== "retirement" || updated.state === "retired");
  }
  if (testCase.mode === "tamper") {
    const receipt = sign(baselineReceipt());
    setPath(receipt, testCase.path, testCase.value);
    return !verifyReceipt(receipt, keys.publicKey).ok;
  }
  if (testCase.mode === "unauthorized_action") {
    return didReject(() => createReceipt({
      ...baselineReceipt(),
      action: "delete",
      authorization: baselineReceipt().authorization
    }));
  }
  if (testCase.mode === "unauthorized_resource") {
    return didReject(() => createReceipt({
      ...baselineReceipt(),
      resource: "https://private.example/secret",
      authorization: baselineReceipt().authorization
    }));
  }
  if (testCase.mode === "expired_scope") {
    const base = baselineReceipt();
    return didReject(() => createReceipt({
      ...base,
      generatedAt: "2026-08-29T20:00:00.000Z",
      authorization: base.authorization
    }));
  }
  if (testCase.mode === "empty_actions" || testCase.mode === "empty_resources") {
    const base = baselineReceipt();
    const authorization = structuredClone(base.authorization);
    authorization[testCase.mode === "empty_actions" ? "allowed_actions" : "allowed_resources"] = [];
    return didReject(() => createReceipt({ ...base, authorization }));
  }
  if (testCase.mode === "missing_signature") {
    return !verifyReceipt(baselineReceipt(), keys.publicKey).ok;
  }
  if (testCase.mode === "wrong_key") {
    return !verifyReceipt(sign(baselineReceipt()), wrongKeys.publicKey).ok;
  }
  if (["wrong_algorithm", "wrong_digest", "malformed_signature"].includes(testCase.mode)) {
    const receipt = sign(baselineReceipt());
    if (testCase.mode === "wrong_algorithm") receipt.signature.algorithm = "RS256";
    if (testCase.mode === "wrong_digest") receipt.signature.signed_digest_sha256 = "f".repeat(64);
    if (testCase.mode === "malformed_signature") receipt.signature.value_base64 = "%%%";
    return !verifyReceipt(receipt, keys.publicKey).ok;
  }
  if (testCase.mode === "replay") {
    const receipt = sign(baselineReceipt());
    return !verifyReceipt(receipt, keys.publicKey, { seenReceiptIds: new Set([receipt.receipt_id]) }).ok;
  }
  if (testCase.mode === "stale") {
    const receipt = sign(baselineReceipt());
    return !verifyReceipt(receipt, keys.publicKey, {
      now: "2026-08-30T20:00:00.000Z",
      maxAgeMs: 24 * 60 * 60 * 1000
    }).ok;
  }
  if (testCase.mode === "hostile") return detectInjectionSignals(testCase.text).length > 0;
  throw new Error(`Unknown conformance mode: ${testCase.mode}`);
}

export async function runConformanceSuite({ writeReport = true } = {}) {
  const suite = JSON.parse(await readFile(suitePath, "utf8"));
  const keys = generateKeyPairSync("ed25519");
  const wrongKeys = generateKeyPairSync("ed25519");
  const results = suite.cases.map((testCase) => {
    try {
      return { id: testCase.id, category: testCase.category, passed: runCase(testCase, keys, wrongKeys) };
    } catch (error) {
      return { id: testCase.id, category: testCase.category, passed: false, error: error.message };
    }
  });
  const categorySummary = Object.fromEntries(
    [...new Set(results.map((result) => result.category))].map((category) => {
      const group = results.filter((result) => result.category === category);
      return [category, { passed: group.filter((result) => result.passed).length, total: group.length }];
    })
  );
  const report = {
    suite: suite.suite,
    version: suite.version,
    frozen_at: suite.frozen_at,
    evaluation_type: "deterministic_conformance_not_independent_security_review",
    total: results.length,
    passed: results.filter((result) => result.passed).length,
    failed: results.filter((result) => !result.passed).length,
    category_summary: categorySummary,
    results
  };
  if (writeReport) await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = await runConformanceSuite();
  console.log(`Receipt conformance: ${report.passed}/${report.total} passed`);
  if (report.failed > 0) process.exitCode = 1;
}
