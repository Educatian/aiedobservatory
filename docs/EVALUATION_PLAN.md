# Evaluation Plan

## Goal

Measure whether the agentic pipeline can produce research-grade policy records with limited human oversight.

## Datasets

### Development set

- 10-20 jurisdictions
- Used to tune prompts, thresholds, and conflict rules

### Gold set

- 20-50 jurisdictions
- Manually labeled by humans for:
  - policy stage
  - policy domains
  - confidence band
  - evidence spans
  - source authority

### Refresh set

- Rolling updates used to test change detection over time

## Primary metrics

- field-level F1
- citation support rate
- unsupported claim rate
- source authority precision
- approval routing accuracy

## Human effort metrics

- records auto-approved per 100 crawled
- records requiring sample audit per 100 crawled
- records requiring full human review per 100 crawled
- average reviewer minutes per 100 crawled

## Approval routing evaluation

Expected routing policy:

- `auto-approve`
  high confidence + strong evidence + no conflict
- `sample-audit`
  medium confidence, but evidence present
- `human-review`
  low confidence, missing citation, or source conflict

Measure whether routing decisions agree with gold labels and audit outcomes.

## Reporting bundle

Each evaluation run should produce:

- run metadata
- model and prompt versions
- source coverage summary
- quality metrics
- audit burden metrics
- common failure modes
