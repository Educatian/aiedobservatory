# Implementation Plan

## Phase 1: State pilot

Goal: establish a reliable state-level pipeline before district scale.

1. Expand source seeds to 10 target states.
2. Crawl official pages and PDF landing pages.
3. Scaffold canonical records from manifest data.
4. Add hybrid extraction with evidence spans.
5. Add verifier-based routing with `auto-approve`, `sample-audit`, and `human-review`.
6. Add deep research fallback for source conflicts and missing citations.
6. Publish cleaned state dataset to the app.

## Phase 2: Full state coverage

1. Expand to all 50 states plus DC.
2. Add recurring crawling.
3. Add change detection and diffing.
4. Track multiple snapshots over time.
5. Add source authority scoring and citation coverage reporting.

## Phase 3: District expansion

1. Add NCES district identifiers.
2. Create district seed registries for 2-3 focal states.
3. Model parent-child policy inheritance.
4. Add district-vs-state conflict resolution rules.
5. Use deep research only for unresolved district coverage gaps.

## Phase 4: Research-grade observatory

1. Build a gold set of 20-50 jurisdictions.
2. Add field-level evaluation and citation support metrics.
3. Add sampled audit workflow and audit burden reporting.
4. Add longitudinal visualizations.
5. Add export packages for analysis and publication.

## Success criteria

- Every record has a stable jurisdiction ID.
- Every coded variable has evidence references.
- Low-confidence records land in a review queue.
- Mid-confidence records can be sampled for audit without blocking publication.
- High-confidence records can be auto-approved under explicit rules.
- Deep research is only used for escalation, not as the default extraction path.
- The UI only reads canonical validated records.
