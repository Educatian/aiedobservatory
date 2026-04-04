# Gemini Extraction

This project supports a Gemini-first extraction and verification path for higher-quality policy coding.

## Why Gemini fits this project

- Stronger judgment on policy language than heuristic matching
- Structured JSON output with schema control
- Long context support for multi-chunk evidence review
- Native document understanding for PDF workflows
- Better fit for ambiguous policy language than keyword-only scoring

## Current implementation

Script:

- `scripts/extract-policy-records-gemini.mjs`
- `scripts/verify-policy-records-gemini.mjs`
- `scripts/run-extraction-auto.mjs`

Required environment variables:

- `GEMINI_API_KEY`
- optional `GEMINI_MODEL`
- optional `GEMINI_ENABLE_VERIFIER`

Example:

```bash
$env:GEMINI_API_KEY="your_key"
npm run pipeline:extract:auto
```

Default model:

- `gemini-2.5-pro`

## Pipeline order

```bash
npm run crawl:sources
npm run pipeline:scaffold
npm run pipeline:chunk
npm run pipeline:extract:auto
npm run pipeline:validate
npm run pipeline:verify:gemini
npm run pipeline:review-queue
npm run pipeline:publish
```

## Notes

- `pipeline:extract:auto` falls back to the heuristic extractor when no Gemini key is present.
- The Gemini extractor uses chunk retrieval from `chunks.jsonl`.
- It writes back into `data/canonical/policy-records.json`.
- Review is still required even when confidence is high.
- The verifier is meant to downgrade overconfident records before publication.
- For large PDFs, the next upgrade should be Gemini Files API support.
