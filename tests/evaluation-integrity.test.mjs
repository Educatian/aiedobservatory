import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

test("primary performance is withheld when no verified independent gold records exist", async () => {
  const evaluation = JSON.parse(
    await readFile(path.join(root, "data", "evaluation", "latest-evaluation.json"), "utf8")
  );
  assert.match(evaluation.metrics_scope, /no_verified_independent_gold/);
  assert.equal(evaluation.verified_independent_subset.matched_record_count, 0);
  for (const value of Object.values(evaluation.field_accuracy)) {
    assert.equal(value, null);
  }
  assert.ok(evaluation.warnings.some((warning) => /withheld/i.test(warning)));
});
