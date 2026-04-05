# Scientific Synthesis Protocol

This project should treat synthesis as a downstream research layer, not as a free-form narrative convenience.

The current target framing is:

- `confirmed pattern`
  A statement that can be directly supported by the coded comparison set.
- `confirmed evidence note`
  A statement about evidence quality, source authority, or routing status.
- `provisional interpretation`
  A plausible but non-final reading of the current policy pattern.
- `interpretive boundary`
  A statement that explicitly limits overclaiming.

## 1. Gold set expansion target

The current gold set is useful for plumbing checks, but not large enough for calibration.

Target range:

- `20-50` gold records

Target coverage should intentionally vary across:

- source authority
- implementation stage
- approval route
- high-signal vs low-signal states
- routine vs hard-case jurisdictions

The project should not treat more records as inherently better unless coverage becomes more balanced.

## 2. Calibration protocol

The robustness score is currently heuristic and should be treated as a prior.

Repository support:

- `npm run pipeline:evaluate`
- `npm run pipeline:evaluate:synthesis`
- output: `data/evaluation/latest-evaluation.json`
- output: `data/evaluation/latest-synthesis-calibration.json`

Calibration should test whether:

- strong robustness records really show lower field error
- moderate robustness records behave differently from limited robustness records
- thresholds align with citation support and review outcomes

Recommended procedure:

1. Evaluate gold-set records with current weights.
2. Group results into `strong`, `moderate`, and `limited`.
3. Compare each band against:
   - field accuracy
   - citation support rate
   - unsupported claim rate
   - correction rate after audit
4. Adjust weights only if the observed ranking is unstable.
5. Store changes as explicit versioned calibration updates.

Important limitation:

- If the gold set is built directly from the current canonical record without independent review, calibration will measure internal consistency more than external validity.
- Treat current perfect agreement as a readiness signal for the evaluation harness, not as proof that the synthesis score is fully validated.

## 3. Narrative discipline

Synthesis text must separate what is directly observed from what is interpretive.

Use:

- `confirmed pattern` for direct comparisons, counts, or stage clustering
- `provisional interpretation` for possible policy meaning
- `interpretive boundary` for overclaim prevention

Avoid:

- causal claims
- normative claims that exceed the source base
- language that implies legal finality
- claims that collapse secondary benchmarks into primary policy evidence

## 4. UI rule

The interface should present the layers in order:

1. confirmed evidence statement
2. confirmed pattern
3. provisional interpretation
4. interpretive boundary

This ordering ensures that users see evidence before interpretation.
