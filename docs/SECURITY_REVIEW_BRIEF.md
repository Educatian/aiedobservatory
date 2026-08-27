# Independent Security Review Brief

## Review object

Review `packages/openpolicy-receipts/` at a frozen public commit. The education-policy interface and content validity are out of scope except as one adapter.

## Required reviewer checks

1. Canonical serialization ambiguity and cross-runtime stability
2. Ed25519 key generation, storage assumptions, signing, verification, and key rotation
3. Authorization scope matching, wildcard behavior, expiry, delegation, and confused-deputy risk
4. Receipt tampering, signature stripping, replay, stale receipts, and unsigned lifecycle mutation
5. Provenance omission, source retirement, correction chaining, and rollback
6. Hostile source text, prompt injection, poisoned tool output, and source-to-instruction boundary
7. Sensitive metadata leakage through receipts, logs, paths, or public error output
8. Dependency, build, release, and maintainer-compromise risks

## Deliverables

- reviewer identity or stable handle and conflict declaration;
- frozen commit and environment;
- finding ID, severity, exploit narrative, affected component, and reproduction steps;
- maintainer response and remediation status;
- retest result; and
- explicit limitations.

Findings should be public by default after a reasonable remediation window. A reviewer must not be described as independent until the declaration in `INDEPENDENCE_AND_CONFLICT.md` is complete.
