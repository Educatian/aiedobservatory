# AIED Policy Atlas

Map-first React/Vite MVP for tracking AI-in-education policy variation across U.S. states.

## Included in this prototype

- State tile map with policy-strength coloring
- Filterable row-based tracker table
- Detail panel for coded policy dimensions
- Demo dataset that can be replaced with real coded policy records
- Crawling and canonical-data scaffolding scripts
- Architecture, SQL schema, and agent-role docs for a hybrid swarm + RAG pipeline
- Approval routing, deep research fallback, and evaluation scaffolding

## Suggested next steps

1. Replace demo rows with official coded state snapshots.
2. Add `source_url`, `source_date`, and `coder` fields from your real codebook.
3. Add district-level rows keyed by NCES district ID.
4. Swap the tile map layer with real GeoJSON once the row schema stabilizes.
5. Move from scaffolded records to extracted and reviewed canonical records.

## Run

```bash
npm install
npm run dev
```

## Data pipeline

```bash
npm run crawl:sources
npm run pipeline:import:docx -- --path "C:\path\to\file.docx" --state NC --state-name "North Carolina" --agency "North Carolina Department of Public Instruction" --title "Guidebook Title"
npm run pipeline:chunk
npm run pipeline:extract:auto
npm run pipeline:route
npm run pipeline:validate
npm run pipeline:verify:gemini
npm run pipeline:deep-research
npm run pipeline:evaluate
npm run pipeline:review-queue
npm run pipeline:publish
```

## Key files

- `docs/ARCHITECTURE.md`
- `docs/DEEP_RESEARCH.md`
- `docs/RESEARCH_DESIGN.md`
- `docs/CODEBOOK.md`
- `docs/EVALUATION_PLAN.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `config/agent-roles.json`
- `config/approval-policy.json`
- `sql/policy_surveillance_schema.sql`
- `data/canonical/policy-records.schema.json`
- `data/gold-set/policy-records.gold.schema.json`
- `docs/GEMINI.md`
