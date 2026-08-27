# Accessibility-Oriented Evidence-Tracing Task

## Task

Starting from the Observatory landing page, locate the bounded Oregon release, choose one factual claim, open the official source, identify the stated source anchor, and explain whether the interface marks the claim as independently reviewed.

## Test modes

Run the same task with:

- keyboard only;
- a screen reader selected by the participant or evaluator;
- 200% browser zoom;
- a mobile-width viewport;
- reduced-motion preference;
- a throttled low-bandwidth connection; and
- the plain-language explanation of prototype, source, and review status.

## Measures

- completion without assistance;
- completion time and abandoned step;
- focus visibility and logical focus order;
- accessible names and announced state;
- source-link discoverability;
- correct interpretation of `0% independent review`;
- reading difficulty or ambiguous terms; and
- severity-ranked barriers.

## Reporting

Publish the environment, assistive technology and version, evaluator relationship, observed barriers, severity, issue link, fix status, and retest result. A proxy automated accessibility check is useful but does not count as a completed screen-reader review.

## Release decision rule

- `critical`: the task cannot be completed or an official source/review state is unavailable to the user; release is blocked until fixed and retested.
- `major`: completion requires assistance, an undocumented workaround, or a materially incorrect interpretation; fix and retest before claiming task success.
- `minor`: task completion and interpretation remain correct, but friction or unnecessary effort is observed; publish and schedule the issue.

Disclose the evaluator's relationship to the project and the assistive-technology environment. Automated scans never substitute for human screen-reader or keyboard evidence. Publish unresolved barriers and failed retests rather than silently removing them from the report.
