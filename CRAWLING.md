# Crawling Plan

This app now includes a minimal official-source crawling pipeline.

## What it does

- Reads official seed URLs from `data/source-seeds.json`
- Fetches each page with built-in Node `fetch`
- Saves raw HTML to `data/generated/raw/`
- Writes a manifest to `data/generated/policy-source-manifest.json`

## Run

```bash
npm run crawl:sources
```

## Why this is only step one

Raw crawling is not enough for the final tracker. The full pipeline should be:

1. Crawl official source pages
2. Scaffold jurisdiction records from the crawl manifest
3. Extract policy metadata and coded variables
4. Review ambiguous cases manually
5. Publish cleaned `policy-records.json` to the app

## Recommended next additions

1. Add all 50 state education agencies plus DC to `data/source-seeds.json`
2. Add district-level seed lists using NCES district IDs
3. Add structured extraction over RAG evidence
4. Add a reviewer queue for low-confidence pages

## Current scripts

```bash
npm run crawl:sources
npm run pipeline:scaffold
npm run pipeline:chunk
npm run pipeline:extract
npm run pipeline:extract:gemini
npm run pipeline:validate
npm run pipeline:review-queue
```
