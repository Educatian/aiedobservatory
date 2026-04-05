# Refresh Protocol

This repository uses a `biweekly refresh protocol` to keep canonical policy records current without publishing unchecked output.

## Cadence

- target cadence: every 14 days
- config source: `config/policy-refresh.json`
- runtime state: `data/generated/pipeline-run-state.json`

## Operational principle

The refresh loop is allowed to automate:

- source refresh
- chunk rebuild
- structured extraction
- approval routing
- review queue rebuild
- publish artifact refresh
- evaluation refresh
- synthesis calibration refresh

The refresh loop is **not** allowed to bypass:

- approval routing
- citation support requirements
- selective audit / human review for low-trust cases

## Step order

1. `crawl:sources`
2. `pipeline:chunk`
3. `pipeline:extract:auto`
4. `pipeline:route`
5. `pipeline:validate`
6. `pipeline:review-queue`
7. `pipeline:publish`
8. `pipeline:events`
9. `pipeline:evaluate`
10. `pipeline:evaluate:synthesis`

## Expected outputs

- `data/canonical/policy-records.json`
- `data/canonical/review-queue.json`
- `public/policy-records.json`
- `public/policy-events.json`
- `data/evaluation/latest-evaluation.json`
- `data/evaluation/latest-synthesis-calibration.json`

## Publish rule

Public data should only include records that are:

- approved
- auto-approved, sample-audit, or fully reviewed

Low-trust or unresolved records should remain visible in operator surfaces and review queues, not be silently promoted into public publish artifacts.

## Failure handling

If any refresh step fails:

- keep the previous public dataset intact
- mark the run as failed
- store the failed step id and error
- do not partially publish

## Research interpretation

The refresh protocol exists to support:

- longitudinal monitoring
- repeatable policy surveillance
- auditable update history
- periodic reevaluation of synthesis robustness

It should be treated as part of the research design, not just deployment plumbing.
