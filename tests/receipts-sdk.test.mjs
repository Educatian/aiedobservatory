import { generateKeyPairSync } from "node:crypto";
import test from "node:test";
import assert from "node:assert/strict";
import {
  appendLifecycleEvent,
  canonicalize,
  createReceipt,
  signReceipt,
  verifyReceipt
} from "../packages/openpolicy-receipts/src/index.mjs";
import { runConformanceSuite } from "../scripts/run-receipt-conformance.mjs";
import { runStandaloneAdapter } from "../packages/openpolicy-receipts/examples/standalone-evidence-agent.mjs";
import { runObservatoryAdapter } from "../scripts/adapters/observatory-release.mjs";

function exampleReceipt() {
  return createReceipt({
    receiptId: "opr-unit-test",
    generatedAt: "2026-08-27T20:00:00.000Z",
    actor: "test-agent",
    action: "read",
    resource: "policy://oregon/1",
    authorization: {
      allowed_actions: ["read"],
      allowed_resources: ["policy://oregon/*"],
      network_access: false,
      secrets_access: false
    }
  });
}

test("canonical serialization is independent of object insertion order", () => {
  assert.equal(canonicalize({ b: 2, a: { d: 4, c: 3 } }), canonicalize({ a: { c: 3, d: 4 }, b: 2 }));
});

test("Ed25519 receipts verify and detect content tampering", () => {
  const keys = generateKeyPairSync("ed25519");
  const signed = signReceipt(exampleReceipt(), keys.privateKey, { keyId: "test-key" });
  assert.equal(verifyReceipt(signed, keys.publicKey).ok, true);
  signed.action = "delete";
  assert.equal(verifyReceipt(signed, keys.publicKey).ok, false);
});

test("review and retirement events preserve a signed digest chain", () => {
  const keys = generateKeyPairSync("ed25519");
  const signed = signReceipt(exampleReceipt(), keys.privateKey, { keyId: "test-key" });
  const reviewed = appendLifecycleEvent(signed, {
    type: "human_review",
    actor: "reviewer-1",
    at: "2026-08-27T21:00:00.000Z",
    reason: "verified source support",
    decision: "approved"
  }, keys.privateKey, { keyId: "test-key" });
  const retired = appendLifecycleEvent(reviewed, {
    type: "retirement",
    actor: "reviewer-1",
    at: "2026-08-27T22:00:00.000Z",
    reason: "source superseded"
  }, keys.privateKey, { keyId: "test-key" });
  assert.equal(verifyReceipt(reviewed, keys.publicKey).ok, true);
  assert.equal(verifyReceipt(retired, keys.publicKey).ok, true);
  assert.equal(retired.state, "retired");
  assert.match(retired.lifecycle[1].previous_receipt_sha256, /^[a-f0-9]{64}$/);
});

test("the frozen conformance suite contains 30 passing cases", async () => {
  const report = await runConformanceSuite({ writeReport: false });
  assert.equal(report.total, 30);
  assert.equal(report.passed, 30);
  assert.equal(report.failed, 0);
});

test("both reference adapters emit verifiable receipts", async () => {
  const [standalone, observatory] = await Promise.all([
    Promise.resolve(runStandaloneAdapter()),
    runObservatoryAdapter()
  ]);
  assert.equal(standalone.verification.ok, true);
  assert.equal(observatory.verification.ok, true);
});
