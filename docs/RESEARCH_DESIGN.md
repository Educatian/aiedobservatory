# Agentic AI Research Design

This repository can be framed as an `agentic policy surveillance` study rather than a dashboard-only project.

## Core claim

A multi-agent, retrieval-grounded pipeline can produce policy surveillance records with limited human intervention while preserving evidence traceability and measurable quality.

## Human role

The target operating model is:

- `Operations`
  Mostly agentic. Humans are not required on every record.
- `Evaluation`
  Required. Humans create gold labels, audit samples, and inspect unresolved conflicts.
- `Escalation`
  Triggered only by confidence thresholds, source conflict, or missing citations.

This is `human-on-the-loop`, not `human-in-the-loop`.

## Research questions

1. Can a multi-agent pipeline build policy records with acceptable field-level accuracy?
2. Does retrieval-grounded verification reduce unsupported coding decisions?
3. Does a deep research fallback improve source coverage and citation support?
4. How much human effort is still required after automated verification and escalation?

## Experimental conditions

### Baseline A

`single-pass extraction`

- crawler
- extractor
- publish

### Baseline B

`multi-agent + RAG`

- crawler
- chunking
- extractor
- publish

### Baseline C

`multi-agent + RAG + verifier`

- crawler
- chunking
- extractor
- verifier
- publish

### Experiment D

`multi-agent + RAG + verifier + deep research fallback`

- crawler
- chunking
- extractor
- verifier
- deep research on flagged cases
- publish

### Experiment E

`multi-agent + RAG + verifier + deep research fallback + selective audit`

- same as Experiment D
- sampled audit for mid-confidence cases
- human review only for low-confidence or unresolved conflicts

## Evaluation metrics

### Record quality

- field-level precision
- field-level recall
- field-level F1
- policy-stage accuracy
- policy-domain accuracy

### Evidence quality

- citation support rate
- evidence span precision
- unsupported claim rate
- source authority match rate

### Operational quality

- auto-approval rate
- sample-audit rate
- human-review rate
- correction rate after audit
- mean time to publish

### Update quality

- change-detection recall
- change-detection precision
- temporal diff accuracy

## Gold set

Create a gold set of 20-50 jurisdiction documents with:

- field labels
- evidence spans
- source authority judgment
- policy stage label
- policy domain labels

Use the gold set for both evaluation and calibration.

## Ablations

Recommended ablations:

1. Remove verifier and measure unsupported claims.
2. Remove deep research and measure source coverage drop.
3. Remove sampling audit and measure hidden error rate.
4. Replace multi-agent workflow with single-agent extraction.

## Publication framing

The strongest contribution statement is likely:

`We present an agentic policy surveillance pipeline that combines crawling, retrieval-grounded extraction, verification, and escalation to deep research, enabling evidence-traceable policy datasets with limited human oversight.`
