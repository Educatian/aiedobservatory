# Data rights and redistribution policy

The repository separates software rights, project-authored factual data, and third-party source material.

## What may be reused

- Project software: Apache-2.0 under `LICENSE`.
- Project-authored factual release records in `data/release/`: CC0-1.0 where the release README and manifest say so.
- Project-authored schemas, evaluation cards, and action receipts: Apache-2.0 unless a file says otherwise.

## What is not automatically licensed

Policy PDFs, webpages, images, institutional marks, and other third-party source materials remain subject to their original rights. Public availability and public-record status do not by themselves grant redistribution permission.

The first release slice therefore uses a **link-only source model**:

1. The project publishes factual metadata, project-authored coding, canonical URLs, retrieval timestamps, and content hashes.
2. It does not redistribute the source text or PDF in the release artifact.
3. Users retrieve the source from the issuing agency.
4. If a source disappears, the record is marked stale or unverifiable; no copyrighted snapshot is silently republished.

Existing files under `data/generated/raw/` are research-working materials. They are excluded from the release contract and must not be redistributed as part of a grant deliverable until a source-level rights decision is documented.

## Correction requests

Open an issue with the source URL, affected claim ID, and requested disposition. Maintainers will preserve the request, decision, and replacement/retirement history under `data/release/<version>/corrections.json`.

This document is a project policy, not legal advice. Institutional review is required before a funded public release.
