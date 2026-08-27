# Independent Annotation Protocol

## Purpose

This protocol evaluates the bounded Oregon v0.1 release. It does not estimate accuracy across states, districts, or policy domains.

## Unit of analysis

The packet contains six project-authored factual claims. Each claim is independently judged on five criteria, yielding 30 frozen decisions:

1. claim presence;
2. directness of source support;
3. anchor locatability;
4. jurisdiction attribution; and
5. consistency between the structured value, claim summary, and source.

The order is fixed in `data/benchmark/v0.1/benchmark-manifest.json`. The two annotation sheets contain no project labels or expected answers.

## Operational label codebook

Apply the tests in this order: retrieve the declared official source; locate the stated anchor; judge the claim proposition; judge directness; verify jurisdiction; then compare the structured value, summary, and evidence. Do not infer a positive label from outside knowledge.

| Criterion | Label | Operational rule |
|---|---|---|
| Claim presence | `supported` | The retrieved source communicates the claim's material proposition without adding a new factual premise. |
|  | `not_supported` | The proposition is absent or contradicted. |
|  | `unclear` | Relevant wording exists but is too ambiguous, conditional, or incomplete for either result. |
| Source support | `direct` | The source explicitly states the material proposition at or immediately around the anchor. |
|  | `indirect` | The proposition requires one reasonable interpretive step but no outside source. |
|  | `none` | No relevant support is found in the retrieved source. |
|  | `unclear` | Wording is relevant but directness cannot be determined. |
| Anchor locatability | `located` | The named heading, page, section, or stable equivalent is found and contains relevant context. Partial wording counts only when it uniquely identifies the same section. |
|  | `not_located` | The source opens but the anchor cannot be found after document search and manual scan. |
|  | `source_unavailable` | The official source cannot be retrieved or rendered sufficiently to inspect; do not substitute a mirror. |
| Jurisdiction attribution | `correct` | The retrieved artifact is issued or officially hosted by the Oregon Department of Education source family named in the release. |
|  | `incorrect` | The issuer or jurisdiction differs. |
|  | `unclear` | Hosting or authorship metadata does not permit a defensible attribution. |
| Value consistency | `consistent` | Field, structured value, summary, and source evidence make the same material assertion. |
|  | `inconsistent` | At least one materially conflicts, overstates, or changes the assertion. |
|  | `unclear` | The comparison is possible but ambiguous. |

Every `not_supported`, `indirect`, `none`, `unclear`, `not_located`, `source_unavailable`, `incorrect`, or `inconsistent` label requires an evidence note naming the observed text, missing anchor, access condition, or contradiction. A positive label also requires a locator precise enough for a second person to repeat the judgment.

## Annotator procedure

1. Complete the conflict and independence declaration before viewing the packet.
2. Work independently. Do not discuss labels with the other annotator or project maintainer.
3. Open only the official source URL declared for the claim. Record `source_unavailable` if it cannot be retrieved.
4. Locate the declared anchor and read enough surrounding context to judge the criterion.
5. Choose only a label allowed by the criterion definition.
6. Record confidence as `high`, `medium`, or `low`; add a short evidence note for every non-positive or unclear judgment.
7. Do not edit the claim, source ledger, benchmark manifest, or the other annotator's sheet.

## Analysis

Raw counts and raw agreement are the primary results. Report criterion-specific denominators explicitly (`n=6` before missingness), cross-tabulations, and overall counts. Gwet's AC1 is a secondary descriptive statistic only; publish the calculation code and a bootstrap or exact resampling interval with its limitations. Treat `source_unavailable` as an observed access outcome, not a negative support label, and report affected denominators. Publish results before and after adjudication separately, along with the disagreement matrix, confidence distribution, source-access failures, and every adjudicated change. No statewide, national, or general model-accuracy inference is permitted.

## Adjudication

Freeze both completed sheets before comparison. A third person or a documented consensus meeting may adjudicate disagreements, but the original labels remain immutable. Adjudicated labels are stored separately with reason, participants, date, and links to the original decision IDs.

## Acceptance rule

Release acceptance requires two completed independent labels for all 30 decisions. Disagreement is not failure and must not be silently overwritten. Any `not_supported`, `none`, `not_located`, `incorrect`, or `inconsistent` result triggers correction, abstention, or retirement review before release.
