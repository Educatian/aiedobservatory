import { generateKeyPairSync } from "node:crypto";
import {
  createReceipt,
  describeValue,
  signReceipt,
  verifyReceipt
} from "../src/index.mjs";

export function runStandaloneAdapter() {
  const source = {
    url: "https://example.gov/guidance",
    retrieved_at: "2026-08-27T20:00:00.000Z",
    text: "The agency publishes guidance for local implementation."
  };
  const output = { claim: "The agency publishes implementation guidance.", confidence: 0.92 };
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const receipt = createReceipt({
    receiptId: "opr-standalone-example",
    generatedAt: "2026-08-27T20:01:00.000Z",
    actor: "standalone-evidence-agent",
    action: "extract_claim",
    resource: source.url,
    authorization: {
      allowed_actions: ["extract_claim"],
      allowed_resources: ["https://example.gov/*"],
      network_access: false,
      secrets_access: false
    },
    provenance: { source_url: source.url, source_sha256: describeValue(source).sha256 },
    inputs: [{ name: "source", ...describeValue(source) }],
    outputs: [{ name: "claim", ...describeValue(output) }]
  });
  const signed = signReceipt(receipt, privateKey, { keyId: "standalone-example-key" });
  return { receipt: signed, verification: verifyReceipt(signed, publicKey) };
}

if (process.argv[1]?.endsWith("standalone-evidence-agent.mjs")) {
  console.log(JSON.stringify(runStandaloneAdapter(), null, 2));
}
