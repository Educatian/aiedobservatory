# Security policy

## Supported version

Security fixes are developed against the current `master` branch and the newest tagged release. The current working version is `0.2.0-rc.2`.

## Reporting

Do not post an exploitable vulnerability, secret, or personal information in a public issue. Email the maintainer at the public University of Alabama address listed on the project profile with the subject `AIED Observatory security report`.

The maintainer will aim to acknowledge a report within seven calendar days, triage it within 30 days, and publish a fix or documented mitigation according to severity. These are service targets, not guarantees.

## Security boundaries

- Policy documents and webpages are untrusted content.
- Source text must never grant tools, network access, or permission changes.
- The local heuristic extractor does not execute source content.
- Optional hosted-model paths must wrap source content as untrusted evidence and restrict outputs to a JSON schema.
- No student, teacher, or family personal data belongs in this public-record pipeline.
- API keys remain local and are excluded by `.gitignore`.

See `docs/THREAT_MODEL.md` and the regression tests in `tests/security.test.mjs`.
