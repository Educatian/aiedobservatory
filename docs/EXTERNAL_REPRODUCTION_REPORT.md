# External Reproduction Report

Use this form only for a person who is independent of the release implementation and who runs the repository in a clean environment. Do not prefill results.

## Reproducer

- Name or stable public handle:
- Affiliation, if any:
- Relationship to project:
- Conflict-of-interest statement:
- Date and time zone:

## Environment

- Operating system:
- Node.js and npm versions:
- Repository commit:
- Clean checkout confirmed: yes / no
- Network restrictions or proxy:

## Procedure

```bash
git clone https://github.com/Educatian/aiedobservatory.git
cd aiedobservatory
npm ci
npm run release:check
```

## Results

- Dependency installation: pass / fail
- Source integrity audit: pass / fail
- Release evaluation: pass / fail
- Unit and contract tests: pass / fail
- Canonical validation: pass / fail
- Production build: pass / fail
- Total elapsed time:
- Output log or public artifact URL:

## Deviations and failures

Describe every command change, warning, failure, workaround, and unresolved issue. Attach the full terminal log with secrets removed.

## Independence attestation

I did not write the release implementation or its expected outputs, and I report the observed result without alteration.

- Signature or stable public confirmation:
- Date:
