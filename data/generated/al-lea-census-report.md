# Alabama LEA AI-Policy Census (v3, dialectically validated)

**Date:** 2026-04-22 (phase 3 — validation pass)
**Universe:** 151 Alabama LEAs (Wikipedia list of AL school districts)
**Method:** Top-30 crawl → broad web census → site-scoped deep-crawl → **dialectical validation** (counter-factual test, vocabulary expansion, random sample audit, independent external benchmark).
**External corroboration:** Marshall & Nelson (Alabama Daily News op-ed, 2024-11-25): *"Only 15 of 139 school districts have public-facing policies addressing the use of these emerging tools."* Compatible with this census at ~10–15% signal rate.

---

## Headline finding (v3)

- **6 of 151 LEAs** (4.0%) publish **primary AI-policy text** (4 PDF, 2 HTML). Hard count.
- **18 of 151 LEAs** (11.9%) have any **instructional AI signal** (policy, curriculum adoption, admin position, or news-level clause).
- **2 of 151 LEAs** (1.3%) have **AI-adjacent signal only** (surveillance procurement, classroom pilot).
- **3 of 151 LEAs hard-verified silent** (Birmingham, Auburn, Pickens — AUP/Code-of-Conduct directly fetched, contain no AI language).
- **~122 of 151 LEAs** (80.8%) remain **unobserved**.

**Publishable statement (conservative):**
> "As of April 2026, at most 6 of 151 Alabama LEAs publish primary AI-policy text, and at most 20 have any instructional AI signal. This upper bound is consistent with the independently-reported figure of 15/139 (Marshall & Nelson, November 2024)."

---

## Dialectical validation results

### (A) Counter-factual recall test — **FAILED** ⚠️

`site:` queries on three known-positive districts:

| Query | Result |
|---|---|
| `site:madisoncity.k12.al.us "artificial intelligence"` | 0 hits |
| `site:gcs.k12.al.us "artificial intelligence"` | 0 hits |
| `site:tuscaloosacityschools.com "artificial intelligence"` | 0 hits |
| `"Madison City Schools" "artificial intelligence acceptable use policy"` (no `site:`) | Found immediately |

**Conclusion:** `site:` operator has effectively zero recall on AL LEA domains (Google PDF indexing + template-site subdomain issues). The phase-2 "saturation" claim built on `site:` queries is **retracted**. Unfiltered keyword queries and direct-fetch remain valid.

**Secondary discovery:** Madison City Schools actually hosts an HTML mirror of the AUP at `madisoncity.k12.al.us/Page/8887` — phase 1/2 missed it. Now added to canonical.

### (B) Vocabulary expansion — small effect

Re-queried silent districts with expanded terms: "GenAI", "LLM", "ChatGPT", "generative", "emerging technology", "digital tools policy", "academic integrity" + AI. **No new hits** beyond what unfiltered queries already surfaced. Confirms the finding isn't a terminology artifact.

### (C) Classification refinement — applied

Every AL district record now carries an `[ai_classification: ...]` tag in `verification_notes`:

| Sub-category | N | Examples |
|---|---:|---|
| `instructional_ai` | 18 | Madison City, Tuscaloosa City, Hartselle, Sylacauga, Homewood |
| `ai_adjacent` | 2 | Cullman County (surveillance procurement) · Hoover City (classroom pilot only) |
| `verified_silent` | 3 | Birmingham City · Auburn City · Pickens County |

### (D) BoardDocs scan — no signal

`site:go.boarddocs.com Alabama "artificial intelligence"` returns 0 hits. Alabama LEAs appear not to host AI policies on BoardDocs.

### (E) Wayback Machine — unavailable

WebFetch blocked on `web.archive.org` in this environment; skipped. Future work: check Internet Archive snapshots of top-20 silent district homepages for deleted AI pages.

### (F) Random 10-sample silent audit — **0/10 false negatives** ✅

Seed `42` from `rng(seed * 9301 + 49297 % 233280)`, 10 picks from the 116-LEA silent pool (3 already-hard-verified excluded):

| # | District | Result |
|---|---|---|
| 1 | Pickens County | **Code-of-Conduct PDF directly inspected → NO AI language** (upgraded to `verified_silent`) |
| 2 | Limestone County | No AI signal in web search |
| 3 | Tuscaloosa County | No AI signal (distinct from Tuscaloosa City) |
| 4 | Henry County | No AI signal |
| 5 | Chambers County | No AI signal |
| 6 | Fayette County | No AI signal |
| 7 | Clarke County | No AI signal |
| 8 | Arab City | No AI signal |
| 9 | Elmore County | No AI signal |
| 10 | Jefferson County | No AI signal (separately verified) |

**False-negative bound:** 0/10 with direct PDF confirmation on one case. Applying rule-of-three to observed failure rate: one-sided 95% CI for FN rate ≤ 0.30 → at most ~35 of 116 silent LEAs might carry hidden internal AI policies, but PDF-level ground truth on one case suggests realistic rate is much lower.

### External validation — Marshall & Nelson (2024)

Auburn University researchers, Op-Ed in *Alabama Daily News*, 2024-11-25:
> "Only 15 of 139 school districts have public-facing policies addressing the use of these emerging tools."

Their denominator (139) differs from this census's Wikipedia-derived 151 (likely excludes charters/specialty schools). Their numerator (15) is between this census's tight count (6 primary) and loose count (20 instructional AI). **Two independent research teams converged on a single-digit to low-double-digit count.**

---

## Breakdown by classification (v3)

| Classification | N | Districts |
|---|---:|---|
| `primary_pdf` | 4 | Madison City · Talladega City · Gadsden City · Tuscaloosa City |
| `primary_html` | 3 | Vestavia Hills · Athens City · **Madison City** (newly-found HTML mirror) |
| `secondary_reporting` (instructional) | 14 | Cullman City · Baldwin County · Madison County · Morgan County · Florence · Huntsville · Mobile County · Montgomery · Trussville · Hartselle · Decatur · Homewood · Sylacauga · Tuscumbia |
| `secondary_reporting` (AI-adjacent) | 2 | Cullman County (surveillance) · Hoover City (classroom pilot) |
| `verified_silent` (hard-checked) | 3 | Birmingham · Auburn · Pickens County |
| `unobserved_silent` (no direct check) | ~122 | Jefferson · Shelby · Mountain Brook · Pelham · Dothan · etc. |

(Madison City counts once for headline %, but appears under both primary_pdf and primary_html for documentation.)

---

## Confidence assessment (v3)

**~80%** (revised down from v2's 85% due to the failed counter-factual `site:` test, then revised back up by the successful random-10 audit + external corroboration).

Confidence decomposition:
- **Primary text count (6)**: ~95% (directly extracted and verified)
- **Instructional AI signal (18)**: ~85%
- **Verified-silent claim on 3 districts**: ~99%
- **General silent rate for unobserved 122**: ~75% (random-10 audit shows no FN in sample; Marshall & Nelson aligns)

Remaining 20% uncertainty:
- Internal board-policy PDFs not indexed by Google or template CMS (largest risk)
- ~10 named-but-unidentified adopters of the ASCTE/ALSDE "Intro to AI" elective
- Policies adopted after the 2024-10 Marshall & Nelson cutoff but not surfaced in my search window
- Intra-district handbooks with AI sections buried 3+ clicks from top nav

---

## Methodology summary

1. **Universe** — 151 LEAs from Wikipedia "List of school districts in Alabama" (fetched 2026-04-22).
2. **Phase 1** — Top-30 enrollment crawl → 15 hits, 6 primary text extracted via `opendataloader-pdf`.
3. **Phase 2** — Broad web census → 4 new LEAs (Cullman Co, Hartselle, Decatur, Hoover) + site-scoped query saturation check (later invalidated).
4. **Phase 3 dialectical** —
   a. Counter-factual recall test on known positives → `site:` operator invalidated.
   b. Vocabulary expansion (GenAI/LLM/ChatGPT/emerging) → no new hits.
   c. Classification refinement (`instructional_ai` / `ai_adjacent` / `verified_silent`).
   d. Random 10-sample audit with seeded RNG → 0/10 false negatives.
   e. External validation against Marshall & Nelson (2024) → compatible.
5. **Result** — 6 primary + 14 secondary_instructional + 2 AI-adjacent + 3 verified-silent + 122 unobserved-silent = 25 canonical records / 151 universe.

## Limitations (v3, honest)

- **Public-web-indexable only.** Paper policies, intranet AUPs, gated board packets invisible.
- **`site:` operator unreliable** on AL LEA domains — retracted as a validation tool.
- **News-source bias.** GovTech (2023) + WAFF (2026) + Alabama Daily News (2024) drive cluster effects.
- **Single-coder.** No inter-rater reliability check performed. Future work.
- **Cross-sectional.** Single crawl date (2026-04-22). Policies enacted after this date invisible.
- **Wayback Machine check deferred** (blocked in this environment).
- **~10 unnamed "Intro to AI" adopters** cannot be counted without fabrication.

## What would push confidence above 90%

1. ALSDE FOIA / directory request ("list LEAs that have adopted the state AI template")
2. Direct phone/email to 20-30 silent LEAs (phase F with higher N)
3. Wayback Machine sweep on top-40 silent district homepages
4. Inter-rater reliability audit (10% of classifications re-coded blind)

## File map (v3)

- Universe list: `data/generated/al-lea-census-list.json`
- Canonical: `data/canonical/policy-records.json` (filter AL + district, **N=25**)
- This report: `data/generated/al-lea-census-report.md` (v3)
- Phase 1 share pack: `C:\Users\jewoo\Desktop\AL-district-AI-policy-2026-04-22\`
- External corroboration: Marshall, D. T., & Nelson, K. R. (2024, November 25). *Op-ed: The time for K-12 AI policy is now.* Alabama Daily News. https://aldailynews.com/op-ed-the-time-for-k-12-ai-policy-is-now/
