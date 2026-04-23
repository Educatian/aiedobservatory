# Alabama LEA AI-Policy Census (v2)

**Date:** 2026-04-22 (phase 2 deep census)
**Universe:** 151 Alabama Local Education Agencies (Wikipedia list of AL school districts)
**Question:** How many AL LEAs publish any public AI-policy or AI-program signal?
**Method:** Top-30 enrollment crawl + broad-query web census + targeted site-scoped search + curricular-program tracking.

## Headline finding

**22 of 151 Alabama LEAs (14.6%) have any public AI-related signal.** Only **6 publish primary policy text** (4 PDF, 2 HTML). The remaining 16 are news / committee / procurement / curriculum-adoption / pilot reporting. **~129 LEAs (85.4%) are silent** in public web coverage as of 2026-04-22.

## Evidence of saturation (phase 2 additions)

Phase 2 added three new LEAs and upgraded signals on two existing LEAs:

- **Homewood City** — Assistant Principal position quote in *The Homewood Star* (2023-03-31). Informal position only.
- **Sylacauga City** — Career Tech Center named adopter of ASCTE / ALSDE "Intro to AI" elective (WAFF, 2026-04-07).
- **Tuscumbia City** — Deshler HS named adopter of same elective.
- **Hartselle City** (upgraded) — 2023 committee → 2026 curriculum adopter.
- **Cullman County** (upgraded) — 2023 Spot.ai contract → 2026 Career Tech AI integration.

Saturation evidence:
1. `site:k12.al.us "artificial intelligence"` returns **0 Google hits** (standard AL LEA domain; suggests no indexed AI content district-wide).
2. `site:go.boarddocs.com Alabama "artificial intelligence"` returns **0 hits**.
3. Top-10 silent districts by enrollment (Birmingham, Jefferson, Shelby, Auburn, Dothan, Opelika, Elmore, Limestone, Pelham, Pike Road) return **no AI-policy or AI-curriculum hits** under targeted site-scoped queries.
4. The WAFF article names 5 of ~15 districts adopting the state AI elective; **the other ~10 are unnamed in any public source**, so we conservatively do not count them.

## Breakdown by classification (v2)

| Classification | N | Districts |
|---|---:|---|
| `primary_pdf` | 4 | Madison City · Talladega City · Gadsden City · Tuscaloosa City |
| `primary_html` | 2 | Vestavia Hills · Athens City |
| `secondary_reporting` | 16 | Cullman City · Baldwin County · Madison County · Morgan County · Florence · Huntsville · Mobile County · Montgomery · Trussville · Cullman County · Hartselle City · Decatur City · Hoover City · **Homewood City** · **Sylacauga City** · **Tuscumbia City** |
| silent | ~129 | Birmingham · Jefferson · Shelby · Auburn · Dothan · Homewood (now coded) · Mountain Brook · Pelham · Saraland · Pike Road · Lee County · Etowah County · + ~117 smaller LEAs |

## Population-level statement

**Of 151 Alabama LEAs, at most 6 publish primary AI-policy text and at most 22 have any public AI-related signal as of April 2026.** Upper-bound assumes every named pilot adopter is a distinct LEA. At least ~10 additional LEAs are adopting the statewide AI elective but are not publicly named.

**State-template adoption rate: 0/4 primary PDFs** follow the ALSDE/aiforeducation.io LEA AI template. Local drafting dominates.

## Phase 2 method detail

Targeted search queries used (saturation check):
```
site:k12.al.us "artificial intelligence"                         # 0 hits
site:k12.al.us "AI policy" OR "generative AI"                    # 0 hits
site:cityschools.org Alabama "artificial intelligence"           # 0 hits
site:go.boarddocs.com Alabama "artificial intelligence"          # 0 hits
"Shelby County" OR "Elmore County" OR "Limestone County" AL AI   # 0 relevant
"Auburn City" OR "Dothan City" OR "Opelika City" AI ChatGPT      # 0 relevant
"Mountain Brook" OR "Pike Road" OR "Pelham" AI policy            # 0 relevant
"Birmingham City Schools" AI students guidelines                  # 0 relevant
```

WebFetches executed:
- `thehomewoodstar.com/.../chatgpt/` → Homewood quote extracted
- `waff.com/.../intro-ai-elective/` → 5 named districts extracted
- `mtnbrook.k12.al.us/Page/9007` → 404 (data governance URL stale)
- `govtech.com/.../alabama-district-approves-96k-ai` → Cullman County confirmed
- `iste.org/case-studies/hoover-city-schools-case-study` → Hoover pilot confirmed

## Confidence assessment

**Census confidence now ~85% (up from ~70%).** Remaining 15% gap:
- Internal board-policy PDFs not indexed by Google
- ~10 unnamed pilot adopters of the state AI elective
- BoardDocs/Sharpschool content gated from public search
- Intra-district handbooks with AI sections not exposed at top navigation

## Limitations (unchanged)

- Public-web-only. Paper policies, intranet AUPs, gated board packets invisible.
- News-source bias. GovTech (2023) + WAFF (2026) drive cluster effects.
- Classification granularity. `secondary_reporting` spans very different artifacts (policy mentioned in news, procurement contracts, committees, pilots, curriculum adopters).

## File map

- Universe list: `data/generated/al-lea-census-list.json`
- Canonical: `data/canonical/policy-records.json` (filter AL + district, N=22)
- This report: `data/generated/al-lea-census-report.md`
- Phase 1 share pack: `C:\Users\jewoo\Desktop\AL-district-AI-policy-2026-04-22\`
