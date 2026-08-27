# OpenPolicy Receipts SDK

This release-candidate package creates and verifies deterministic, tamper-evident action receipts for public-interest AI agents. It is domain-agnostic and uses only Node.js built-ins.

Implemented now:

- canonical JSON serialization and SHA-256 digests;
- Ed25519 signing and verification;
- action, resource, expiry, network, and secrets scope declarations and verifier checks;
- human-review, correction, and retirement lifecycle events;
- tamper, replay, stale-receipt, wrong-key, and malformed-signature detection; and
- a frozen 30-case conformance suite.

The package is a release candidate. It does not sandbox an agent or enforce a runtime policy. A valid Ed25519 signature proves integrity relative to the supplied public key, not a real-world agent identity; trusted issuer registries and key rotation remain future work. Receipts support inspection and reproduction attempts but do not preserve every runtime or model artifact. Independent security review, external reproduction, and stable-version guarantees remain pending.

Version `0.1.0-rc.1` names the implemented seed package and schema. The proposed grant output is the first stable `1.0.0` contract, including cross-runtime vectors, key rotation and revocation semantics, hardened delegation, migration guidance, and compatibility tests; calling the current seed “1.0” would be premature.

## Minimal example

```js
import { generateKeyPairSync } from "node:crypto";
import {
  createReceipt,
  signReceipt,
  verifyReceipt
} from "@openpolicy/receipts";

const { privateKey, publicKey } = generateKeyPairSync("ed25519");
const receipt = createReceipt({
  actor: "example-agent",
  action: "summarize",
  resource: "https://example.gov/policy",
  authorization: {
    allowed_actions: ["summarize"],
    allowed_resources: ["https://example.gov/*"],
    network_access: true,
    secrets_access: false
  }
});

const signed = signReceipt(receipt, privateKey, { keyId: "example-key" });
console.log(verifyReceipt(signed, publicKey));
```

Apache-2.0. The SDK carries metadata; it does not grant rights to third-party source content.
