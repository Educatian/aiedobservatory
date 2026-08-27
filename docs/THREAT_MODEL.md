# Threat model

## Assets

- Source and version provenance.
- Claim-to-source linkage.
- Human review and correction history.
- Release artifacts and evaluation results.
- API credentials used by optional hosted-model paths.

## Trust boundaries

- All crawled pages, PDFs, metadata, and embedded instructions are untrusted.
- Model output is untrusted until schema validation and approval routing complete.
- A high confidence value is an extraction signal, not proof of policy correctness.
- External links can decay or change after retrieval.

## Primary threats and controls

| Threat | Consequence | Current control | Remaining work |
|---|---|---|---|
| Prompt injection in a source | Model follows document instructions | Untrusted-content wrappers, schema-constrained output, regression tests | Expand hostile corpus and run CI on every prompt change |
| Poisoned or substituted source | False policy claim | Canonical URL, retrieval time, content hash, link-only release | Signed archives where rights permit |
| Over-broad tool permission | Agent changes files or calls tools beyond scope | Explicit allowed-action checking in the receipt layer | Sandboxed execution adapter |
| Stale or broken source | Claim cannot be checked | Integrity audit and stale/unverified states | Scheduled audit and archive policy |
| Evaluation leakage | Inflated accuracy | Verified-gold manifest and separate legacy diagnostics | Independent dual annotation |
| Secret exposure | Credential compromise | Local `.env`, ignored secrets, no source credentials | Automated secret scanning |
| False automation confidence | Users treat structural validation as correctness | Separate schema, source, extraction, and human-review states | User-facing calibration study |

## Security acceptance tests

- Embedded “ignore previous instructions” text is detected and remains data.
- Source text cannot request tool scope.
- Receipt inputs and outputs have SHA-256 hashes.
- A released claim has a source, rights decision, and integrity record.
- Critical hostile-corpus regressions block release.
