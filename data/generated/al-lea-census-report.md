# Alabama LEA AI-Policy Census

**Date:** 2026-04-22
**Universe:** 151 Alabama Local Education Agencies (Wikipedia list of AL school districts)
**Question:** How many AL LEAs publish any public AI-policy signal?
**Method:** Top-30 enrollment crawl (prior work) + broad-query web census for the remaining ~120 LEAs (this pass).

## Headline finding

**19 of 151 Alabama LEAs (12.6%) have any public AI-related signal.** Only **6 publish primary policy text** (4 PDF, 2 HTML). The remaining 13 are news / board-minute / committee / procurement / pilot reporting. **~132 LEAs (87.4%) are silent** in public web coverage as of 2026-04-22.

## Breakdown by classification

| Classification | N | Districts |
|---|---:|---|
| `primary_pdf` (downloadable policy PDF) | 4 | Madison City · Talladega City · Gadsden City · Tuscaloosa City |
| `primary_html` (policy text on webpage) | 2 | Vestavia Hills · Athens City |
| `secondary_reporting` (news / board / committee / pilot) | 13 | Cullman City · Baldwin County · Madison County · Morgan County · Florence · Huntsville · Mobile County · Montgomery · Trussville · Cullman County · Hartselle City · Decatur City · Hoover City |
| silent (no AI signal located) | ~132 | Birmingham · Jefferson County · Shelby County · Auburn · Dothan · Homewood · Mountain Brook · Pelham · Saraland · Pike Road · Lee County · Etowah County · and ~120 smaller LEAs |

## What "silent" means

A district is coded silent if broad web searches (GovTech, AL.com, WAFF, WAAY, district site, ISTE, Ballotpedia, Education Week) surface no AI-policy, AI-governance, AI-committee, AI-procurement, or AI-pilot artifact as of the census date. It does not mean the LEA has no internal guidance — only that nothing public was locatable.

## Methodology notes

1. **Top-30 crawl (prior, 2026-04-22).** Automated URL triage for the 30 largest AL LEAs by 2025–26 enrollment; 15 hits triaged; 4 PDFs extracted via opendataloader-pdf; 12 non-PDFs classified via the evidence JSON.
2. **Long-tail census (this pass).** WebSearch passes against combinations of district clusters × news sources × AI/policy keywords. Targeted WebFetch on GovTech, WBRC, ISTE articles that surfaced unfamiliar districts. Four additional LEAs identified: Cullman County, Hartselle City, Decatur City, Hoover City — all `secondary_reporting`.
3. **Converged.** Broad queries against remaining silent districts (Birmingham, Jefferson, Shelby, Auburn, Dothan, Homewood, Mountain Brook) returned no AI-policy signals. Additional query variants did not surface new LEAs; search is saturated.

## Limitations

- Public-web-only. Internal district portals, intranet AUPs, paper policies, or board-packet PDFs not indexed by search engines are invisible to this census.
- News-heavy bias. GovTech reporting (2023) drove a 4-district cluster (Hartselle, Morgan, Decatur, Cullman County). LEAs not covered by regional tech press are underrepresented.
- Classification granularity. `secondary_reporting` groups very different artifacts: board-approved policies mentioned only in news (Baldwin County §7.17), procurement contracts (Cullman County surveillance), committees (Hartselle), and classroom pilots (Hoover ISTE case study).

## Research-value claim

**Of 151 Alabama LEAs, at most 6 publish primary AI-policy text in a researcher-accessible form as of April 2026.** State-level template (ALSDE / aiforeducation.io) is not structurally adopted by any of the 4 PDFs tested (0/10 template markers each). Alabama's LEA AI-policy layer is therefore *sparse, locally-drafted, and heterogeneous* — a finding with implications for state-to-district policy alignment research.

## Census record count

- `jurisdiction_type: district` + `state_abbr: AL` in canonical store: **19**
- Of those, `source_authority: official_guidance` (primary): 6
- `source_authority: secondary_reporting`: 13

## File map

- Authoritative universe list: `data/generated/al-lea-census-list.json`
- Canonical records: `data/canonical/policy-records.json` (filter state_abbr=AL, jurisdiction_type=district)
- This report: `data/generated/al-lea-census-report.md`
- Prior 15-district share pack: `C:\Users\jewoo\Desktop\AL-district-AI-policy-2026-04-22\`
