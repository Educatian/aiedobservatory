<p align="center">
  <img src="./public/app-icon.svg" alt="AI Education Policy Observatory icon" width="112" height="112" />
</p>

# AI Education Policy Observatory

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/status-active%20prototype-0b6b8f?style=flat-square" />
  <img alt="Architecture" src="https://img.shields.io/badge/architecture-agentic%20policy%20surveillance-162839?style=flat-square" />
  <img alt="Frontend" src="https://img.shields.io/badge/frontend-Vite%20%2B%20React-5cb8fd?style=flat-square" />
</p>

Evidence-grounded observatory for tracking AI-in-education guidance across U.S. states.

Brand assets for deployment and sharing live in [`public/app-icon.svg`](./public/app-icon.svg), [`public/icon-192.png`](./public/icon-192.png), [`public/icon-512.png`](./public/icon-512.png), and [`public/social-preview.png`](./public/social-preview.png).

## Preview

The dashboard runs on an IBM-Carbon-derived design system (IBM Plex Sans, Carbon swatch palette, productive sidebar layout). Screenshots regenerate via `node scripts/capture-ui-screenshots.mjs` against a running dev server.

<p align="center">
  <img src="./docs/screenshots/01-landing.png" alt="Landing page" width="900" />
</p>

<p align="center">
  <img src="./docs/screenshots/02-dashboard-map.png" alt="Dashboard — map view" width="900" />
</p>

<p align="center">
  <img src="./docs/screenshots/03-dashboard-compare.png" alt="Dashboard — compare regions" width="900" />
</p>

<p align="center">
  <img src="./docs/screenshots/04-dashboard-timeline.png" alt="Dashboard — policy timeline" width="900" />
</p>

<p align="center">
  <img src="./docs/screenshots/05-dashboard-sources.png" alt="Dashboard — source library" width="900" />
</p>

<p align="center">
  <img src="./docs/screenshots/06-dashboard-methodology.png" alt="Dashboard — methodology" width="900" />
</p>

<p align="center">
  <img src="./docs/screenshots/07-projectoverview.png" alt="Project overview page" width="900" />
</p>

## What it is

This project turns fragmented guidance pages, PDFs, implementation memos, and related policy artifacts into inspectable state-level records for leadership, policy analysis, and longitudinal monitoring.

## Included in this prototype

- State tile map with policy-strength coloring
- Filterable row-based tracker table
- Detail panel for coded policy dimensions
- Demo dataset that can be replaced with real coded policy records
- Crawling and canonical-data scaffolding scripts
- Architecture, SQL schema, and agent-role docs for a hybrid swarm + RAG pipeline
- Approval routing, deep research fallback, and evaluation scaffolding
- Landing page, project overview, live event layer, and branded observatory assets

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
