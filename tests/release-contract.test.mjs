import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const releaseDir = path.join(root, "data", "release", "v0.1");

async function readJson(name) {
  return JSON.parse(await readFile(path.join(releaseDir, name), "utf8"));
}

async function hash(relativePath) {
  return createHash("sha256")
    .update(await readFile(path.join(root, relativePath)))
    .digest("hex");
}

test("release claims have a declared source, rights decision, and honest review status", async () => {
  const [claims, rights] = await Promise.all([
    readJson("policy-claims.json"),
    readJson("source-rights.json")
  ]);
  const sources = new Map(rights.sources.map((source) => [source.source_id, source]));
  assert.ok(claims.claims.length >= 1);
  for (const claim of claims.claims) {
    assert.ok(sources.has(claim.source_id));
    assert.equal(sources.get(claim.source_id).source_material_decision, "link_only");
    assert.ok(["pending", "verified"].includes(claim.independent_review_status));
  }
  assert.equal(rights.raw_source_redistribution, false);
});

test("stored integrity audit covers every release source", async () => {
  const [rights, integrity] = await Promise.all([
    readJson("source-rights.json"),
    readJson("source-integrity.json")
  ]);
  assert.equal(integrity.all_sources_ok, true);
  assert.equal(integrity.results.length, rights.sources.length);
  for (const source of integrity.results) {
    assert.equal(source.ok, true);
    assert.match(source.sha256, /^[a-f0-9]{64}$/);
  }
});

test("action receipt hashes match current release artifacts", async () => {
  const receipt = await readJson("action-receipt.example.json");
  assert.equal(receipt.receipt_version, "0.1");
  assert.equal(receipt.authorization_scope.secrets_access, false);
  for (const artifact of [...receipt.inputs, ...receipt.outputs]) {
    assert.equal(await hash(artifact.path), artifact.sha256, artifact.path);
  }
});

test("evaluation card does not imply independent validation", async () => {
  const card = await readJson("evaluation-card.json");
  assert.equal(card.evaluation_type, "release_contract_completeness_not_model_accuracy");
  assert.equal(card.independent_review_rate, 0);
  assert.equal(card.source_link_rate, 1);
  assert.equal(card.source_integrity_rate, 1);
});
