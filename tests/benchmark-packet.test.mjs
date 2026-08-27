import test from "node:test";
import assert from "node:assert/strict";
import { validateBenchmarkPacket } from "../scripts/validate-benchmark-packet.mjs";

test("the frozen benchmark exposes 30 unlabeled decisions to two independent annotators", async () => {
  const result = await validateBenchmarkPacket();
  assert.deepEqual(result, {
    ok: true,
    claim_count: 6,
    criteria_count: 5,
    decision_count: 30,
    blank_independent_sheets: 2
  });
});
