<p align="center">
  <img src="./public/app-icon.svg" alt="AI Education Policy Observatory icon" width="112" height="112" />
</p>

# AI Education Policy Observatory

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/status-v0.2.0--rc.4-0b6b8f?style=flat-square" />
  <img alt="License" src="https://img.shields.io/badge/code-Apache--2.0-162839?style=flat-square" />
  <img alt="Tests" src="https://img.shields.io/badge/tests-14%20passing-198038?style=flat-square" />
</p>

An open, evidence-grounded prototype for making U.S. AI-in-education guidance easier to find, compare, verify, and contest.

- Live interface: https://aiedobservatory-five.vercel.app/
- Browser receipt verification demo: https://aiedobservatory-five.vercel.app/receipts
- Current maintainer and release owner: [Jewoong Moon](https://education.ua.edu/directory/jewoong-moon/)
- Code license: [Apache-2.0](./LICENSE)
- Source and data terms: [DATA_RIGHTS.md](./DATA_RIGHTS.md)

## Evidence boundary

The interface, broader policy corpus, and small release-evidence slice are distinct:

- The live interface is a research prototype, not an authoritative legal or policy service.
- The broader corpus contains mixed-stage records and must not be interpreted as uniformly verified.
- `data/release/v0.1/` is the bounded release-candidate slice: three Oregon official guidance sources and six project-authored factual claims.
- Source documents are referenced by URL and hash; the project does not redistribute their raw text.
- The six release claims have one curator review. Independent dual review is still pending and is reported as `0`, not implied.
- The legacy 35-record fixture is retained only as a pipeline diagnostic. It is not an independent gold set and does not establish general 100% accuracy.

## Five-minute local check

Requirements: Node.js 20+ and npm 10+.

```bash
git clone https://github.com/Educatian/aiedobservatory.git
cd aiedobservatory
npm ci
npm test
npm run build
npm run dev
```

The default deterministic extraction and validation path does not require an API key. Optional Gemini-assisted extraction and verification require `GEMINI_API_KEY`; see [docs/GEMINI.md](./docs/GEMINI.md).

`private: true` in `package.json` prevents accidental npm publication. It does not restrict the Apache-2.0 license.

## Reproduce the release candidate

```bash
npm ci
npm run release:check
```

That command:

1. fetches and hashes the three official source URLs;
2. checks the six released claims and review-state metadata;
3. validates the frozen 30-decision independent-annotation packet;
4. creates unsigned and Ed25519-signed receipt examples through two adapters;
5. runs the frozen 30-case conformance suite;
6. runs 14 unit and corpus-contract tests;
7. validates the canonical records; and
8. produces a production build.

Release evidence is in:

- `data/release/v0.1/source-rights.json`
- `data/release/v0.1/policy-claims.json`
- `data/release/v0.1/source-integrity.json`
- `data/release/v0.1/evaluation-card.json`
- `data/release/v0.1/action-receipt.example.json`
- `data/release/v0.1/signed-action-receipt.example.json`
- `data/evaluation/latest-evaluation.json`

The domain-agnostic release-candidate SDK is in `packages/openpolicy-receipts/`. It now implements canonical serialization, Ed25519 signatures, action/resource scope declarations and verifier checks, review/correction/retirement chains, and replay/staleness checks. It does not sandbox an agent, prove a real-world agent identity, or preserve every runtime artifact. One Observatory adapter, one standalone SDK example, and a versioned 30-case draft conformance suite are included. These are deterministic developer tests, not an independent security review or external integration proof.

The browser demo at `/receipts` recomputes the canonical SHA-256 digest, verifies the Ed25519 signature against the supplied public key, checks the declared action/resource scope, and lets a visitor mutate one output-hash character after signing. The public fixture is generated at `public/receipt-demo.json`; no private key is persisted or shipped. Passing the demo establishes fixture integrity relative to that public key, not real-world actor identity or runtime enforcement.

## Evaluation interpretation

Schema validation and pipeline consistency are not accuracy estimates. Primary extraction metrics remain `null` until records have provenance-documented, independently produced reference labels. Legacy same-lineage comparisons are reported separately as diagnostics so they cannot be presented as independent performance evidence.

The release evaluation also reports provenance completeness, source fetch integrity, independent-review coverage, and open correction counts. See [docs/EVALUATION_PLAN.md](./docs/EVALUATION_PLAN.md) and [data/gold-set/annotation-manifest.json](./data/gold-set/annotation-manifest.json).

## Source integrity and corrections

Each released claim identifies its source, locator, retrieval time, and source hash. Sources that fail integrity checks are quarantined from public-ready output until reviewed. For example, the Alabama record was quarantined after its source URLs could not be resolved and its local provenance was insufficient for claim-level verification.

Corrections are recorded in `data/release/v0.1/corrections.json`. Security issues should follow [SECURITY.md](./SECURITY.md).

## Public-value and accessibility proof

The project is designed for teachers, district and state leaders, families, researchers, journalists, and civic-technology teams—especially organizations without dedicated policy-data staff. That intended value is a hypothesis until tested. The repository therefore includes a minimum user-discovery and pilot protocol covering:

- at least five stakeholder interviews;
- one evidence-tracing task using the public interface;
- keyboard, screen-reader, mobile, low-bandwidth, and plain-language checks; and
- public reporting of failures and resulting changes.

See [docs/USER_DISCOVERY_AND_PILOT.md](./docs/USER_DISCOVERY_AND_PILOT.md), [docs/STAKEHOLDER_RECRUITMENT_PACKET.md](./docs/STAKEHOLDER_RECRUITMENT_PACKET.md), and [docs/ACCESSIBILITY_TASK_PROTOCOL.md](./docs/ACCESSIBILITY_TASK_PROTOCOL.md). No completed pilot is claimed yet.

## Pipeline

```bash
npm run crawl:sources
npm run pipeline:import:docx -- --path "C:\path\to\file.docx" --state NC --state-name "North Carolina" --agency "North Carolina Department of Public Instruction" --title "Guidebook Title"
npm run pipeline:chunk
npm run pipeline:extract:auto
npm run pipeline:route
npm run pipeline:validate
npm run pipeline:evaluate
npm run pipeline:review-queue
npm run pipeline:publish
```

Optional hosted-model and research steps:

```bash
npm run pipeline:verify:gemini
npm run pipeline:deep-research
```

Untrusted source text is wrapped and explicitly treated as data, not instructions. The action-receipt contract limits source processing to declared permission scopes. See [docs/THREAT_MODEL.md](./docs/THREAT_MODEL.md).

## Governance

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [MAINTAINERS.md](./MAINTAINERS.md)
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- [CHANGELOG.md](./CHANGELOG.md)
- [docs/RELEASE_CHECKLIST.md](./docs/RELEASE_CHECKLIST.md)
- [docs/ANNOTATION_PROTOCOL.md](./docs/ANNOTATION_PROTOCOL.md)
- [docs/INDEPENDENCE_AND_CONFLICT.md](./docs/INDEPENDENCE_AND_CONFLICT.md)
- [docs/EXTERNAL_INTEGRATION_PARTNER_PACKET.md](./docs/EXTERNAL_INTEGRATION_PARTNER_PACKET.md)
- [docs/SECURITY_REVIEW_BRIEF.md](./docs/SECURITY_REVIEW_BRIEF.md)
- [docs/MAINTAINER_RECRUITMENT.md](./docs/MAINTAINER_RECRUITMENT.md)

Before a public v0.2.0 release, the project still requires a clean external reproduction, independent reference labels for the bounded slice, and documented stakeholder testing. Those are explicit release gates rather than completed claims.
