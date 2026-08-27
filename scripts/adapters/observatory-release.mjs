import { generateKeyPairSync } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createReceipt,
  describeValue,
  signReceipt,
  verifyReceipt
} from "../../packages/openpolicy-receipts/src/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");

export async function runObservatoryAdapter() {
  const claims = JSON.parse(await readFile(path.join(root, "data/release/v0.1/policy-claims.json"), "utf8"));
  const evaluation = JSON.parse(await readFile(path.join(root, "data/release/v0.1/evaluation-card.json"), "utf8"));
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const receipt = createReceipt({
    actor: "aied-observatory-release-agent",
    action: "evaluate_release",
    resource: "openpolicy://release/v0.1",
    authorization: {
      allowed_actions: ["evaluate_release"],
      allowed_resources: ["openpolicy://release/*"],
      network_access: false,
      secrets_access: false
    },
    provenance: {
      repository: "https://github.com/Educatian/aiedobservatory",
      release: "v0.1"
    },
    inputs: [{ name: "policy_claims", ...describeValue(claims) }],
    outputs: [{ name: "evaluation_card", ...describeValue(evaluation) }]
  });
  const signed = signReceipt(receipt, privateKey, { keyId: "observatory-release-example-key" });
  return {
    adapter: "aied-observatory-release",
    receipt: signed,
    public_key_pem: publicKey.export({ type: "spki", format: "pem" }),
    verification: verifyReceipt(signed, publicKey)
  };
}
