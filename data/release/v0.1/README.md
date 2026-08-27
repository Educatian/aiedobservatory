# v0.1 Oregon release slice

This release candidate is deliberately small: one official Oregon guidance source family, six project-authored factual claims, no raw third-party source redistribution, and explicit pending independent review.

## Reproduce

```bash
npm ci
npm run audit:sources
npm run pipeline:evaluate:release
npm run receipt:example
npm test
```

## Interpretation

- `source-rights.json` records why source materials remain link-only.
- `source-integrity.json` records HTTP status, final URL, retrieval time, and SHA-256.
- `policy-claims.json` is CC0 factual coding, not a copy of the source documents.
- `evaluation-card.json` reports completeness and independent-review coverage honestly.
- `action-receipt.example.json` binds release artifacts to hashes and a code state.
- `corrections.json` preserves future correction and retirement decisions.

The slice is not an independent gold set and must not be used to claim general extraction accuracy.
