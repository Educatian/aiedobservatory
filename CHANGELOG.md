# Changelog

## 0.2.0-rc.4 — 2026-08-27

- Restricted live policy-data polling to the landing and dashboard routes.
- Removed the receipt demo's unnecessary background requests and Vercel rate-limit errors.

## 0.2.0-rc.3 — 2026-08-27

- Fixed cross-platform receipt hashing by pinning release JSON fixtures to LF line endings.
- Supersedes `v0.2.0-rc.2`, whose GitHub CI exposed the Windows/Linux newline mismatch.

## 0.2.0-rc.2 — 2026-08-27

- Added the domain-agnostic OpenPolicy Receipts release-candidate package.
- Added canonical JSON, Ed25519 signing/verification, scoped authorization, lifecycle events, and replay/staleness checks.
- Added two reference adapters and a frozen 30-case deterministic conformance suite.
- Added a public in-browser Ed25519 verification and tamper demonstration at `/receipts`.
- Added a frozen 30-decision Oregon independent-annotation packet with two blank label sheets.
- Added independence, recruitment, and accessibility execution protocols.

## 0.2.0-rc.1 — 2026-08-27

Release-readiness candidate:

- Apache-2.0 software license and explicit data-rights boundary.
- Oregon link-only/CC0-derived factual release slice.
- Source-integrity checks with canonical URL, retrieval time, and SHA-256.
- Honest evaluation separation between verified and legacy gold labels.
- Action-receipt schema and example.
- Threat model, hostile-content boundaries, regression tests, and CI.
- Maintainer, contribution, correction, and release-governance documentation.

This is a local release candidate until the checks pass from a clean clone and a public tag is created.
