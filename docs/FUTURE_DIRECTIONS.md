# Future Research / Project Directions

A running notebook of direction candidates. Not a commitment — just captured so they don't get lost.

---

## Changelog 2026-04-22 — corpus completeness update against US DOE 2026 state list

**Trigger.** Cross-checked our crawl against the US Department of Education's 2026 "Guidance from States" roster (https://www2.ed.gov/documents/ai-report/ai-report.pdf, 30 states listed). Six states were absent from our corpus: **AL, AZ, HI, ND, NV, WY**.

**What was added.**
- 12 new raw documents under `data/generated/raw/` covering AL (2: OIT AUP PDF + LEA DOCX template), AZ (NAU guide PDF), HI (employee-guidance PDF + public landing HTML), ND (framework HTML + 4 role-specific checklists PDF), NV (52-page STELLAR PDF), WY (June 2024 guidance PDF).
- `scripts/chunk-new-states.mjs` — idempotent chunker matching existing `chunks.jsonl` schema (pdftotext / python-docx / stripHtml; 1400-char sentence-boundary chunks).
- `data/generated/chunks.jsonl` regenerated: 685 kept + 180 new = **865 chunks**.
- `data/canonical/policy-records.json` extended from 37 → **41 records** (HI, ND, NV, WY stubs added; AL + AZ already present).

**Numbers that drifted after re-running downstream analyses on N=35 (was N=29).**
- Leave-one-out seed validation: 27/29 → **35/35** stable
- Bootstrap stable pairs: 6 → **22**
- Cluster 1 (CA/CT/DE/PA) cohesion signature unchanged; six new states did not dislodge the companion-chatbot/youth-safety topical cluster.

**Supersession.** All analytic outputs under `data/analysis/*.md` dated before 2026-04-22T22:40 are **superseded** by the current snapshot. Previously cited N=29 figures should be read as provisional.

**Known residuals.** HI one-pager is genuinely short (~2 Google-Slides pages); not a crawl failure. NV STELLAR is 52 pages and dominates NV token share — downstream cluster analyses may want length-normalisation.

---

## Note 2026-04-22 — edopportunity.org as a model

**Reference URL:** https://edopportunity.org/

**Tentative direction:** pivot our AIEd Policy Observatory toward a more **focused dashboard + data archive** modeled on Stanford Educational Opportunity Project (SEDA / edopportunity.org) rather than the current exploratory multi-view inspector.

### Why this model is attractive for us

- SEDA has a single clear data story (test-score gaps by district/county) and supports it with
  - a well-defined unit of analysis (district, county, community)
  - downloadable, versioned, citable data files
  - interactive map + charts tied to the same unit
  - explicit methodology + codebook pages
  - "how to cite" boxes on every dataset
- Our project currently sprawls across crawling, similarity analysis, seed attribution, per-state guidance cards, and dashboard viz. A SEDA-style discipline would force us to pick one canonical unit (state × year? state × instrument? district × policy?) and build outward from there.

### What "SEDA for AI-Ed policy" would look like

1. **Canonical unit**: probably `state × instrument × effective_date` (matches the `source_documents` we already collect; each row = one concrete policy artifact).
2. **Archive**: versioned CSV / JSON release with SHA256 manifest, DOI-equivalent, "cite this dataset" block. (We already have the SHA256 manifest from corpus-validity v1.)
3. **Dashboard = few high-quality views, not many**:
   - National choropleth of `sourceAuthority` highest attained per state
   - Timeline (all instruments, all states, by year)
   - Seed-attribution matrix (states × civil-society frameworks)
   - One "state deep dive" page per state (what TeacherGuidancePanel already drafts)
4. **Methodology page** written up as publishable documentation (TF-IDF + permutation null + bootstrap stability + Smith-Waterman passage alignment). Corpus-validity v1 + v2 reports feed directly in.
5. **Codebook page** — every field in every release file, with definitions. We already have CODEBOOK.md.
6. **Refresh cadence** — quarterly release; reproducibility protocol captured in REFRESH_PROTOCOL.md.

### What this means for current sprawl

Candidates to deprecate or consolidate if we commit to this direction:
- The CompareMatrixView ambition (nice-to-have, not core to the SEDA model)
- The DiffusionHeatmap we reverted (was already cut — keep it cut)
- The hand-coded Alabama plan in `~/.claude/plans/` — only the `source_documents` extension + `teacher_guidance` extension would survive; the UI sprawl is optional

Candidates to elevate:
- Scripts already in `scripts/` become the data-release pipeline (they already emit JSON + MD — two steps away from a real release)
- `corpus-validity-v2.mjs` / `bootstrap-clusters.mjs` / `loo-seed-validation.mjs` / `build-document-similarity.mjs` (all staged but not yet run) become the methodology-page appendix

### Open questions before committing

- Who is the audience? (researchers ≠ state policy officers ≠ teachers) — SEDA picks researchers + journalists explicitly
- Do we want a downloadable "dataset release" at all, or stay purely as a public dashboard?
- If we do release, what license (ODbL? CC-BY?) and what versioning scheme?
- How does this coexist with the hand-curated Alabama case study / teacher-facing content that's already planned?

### Action items if this direction is chosen (NOT YET COMMITTED)

1. Audit current dashboard views; mark each as core / supporting / cuttable
2. Design the release-file schema (probably two tables: `policies.csv` + `documents.csv`)
3. Write a methodology page from the existing corpus-validity + passage-alignment + seed-attribution reports
4. Add "Cite this" blocks + version stamp
5. Lock the quarterly refresh cadence and publish a dated v0.1

---

---

## Note 2026-04-22 (late) — "Frame convergence, not diffusion"

Bootstrap stability (B=500) yielded P(co-cluster) = 1.000 for CA↔CT↔DE and 0.988 for CA↔PA / CT↔PA / DE↔PA. Initial read: strong diffusion signal. Verification pushed back:

- **Sources are independent** — 4 distinct state agency sites, zero URL overlap, zero cross-citation.
- **Shared terms are generic** — data, tools, educators, privacy, access, support, risks. These are AI-policy agenda vocabulary, not state-authored phrasing.
- **Authorial voice is distinct** — CA hedges ("in no way required"); CT historicizes ("invisible for decades"); DE is council-formal; PA addresses families.
- **Longest literal reuse is 8–11 tokens**, all proper nouns/law names: FERPA, COPPA, CIRCLS, US OET report title. Not Jansa-style copy-paste.
- **Bootstrap 1.000 = boundary stability**, not near-duplication. The 4 states sit comfortably above the cosine>0.25 cluster threshold, so bootstrap resampling can't push them apart; IL/MD/NJ sit on the boundary and drop out.

**Revised claim:** Cluster 1 is *frame convergence* — independent adoption of the same agenda vocabulary around AI-in-K12 (Jansa 2019 distinguishes convergence from true diffusion / copy-paste lawmaking). Our corpus contains no in-text evidence of interstate copy-paste; Phase B passage alignment only surfaces shared legal acronyms and federal-source titles.

This reframing flips what's publishable: the story isn't "states copy each other" (weak claim, no evidence) but "states converge on a shared civil-society/federal frame — CoSN + ISTE + OET — while authoring text independently" (strong claim, multiple independent confirmations).

---

## Note 2026-04-22 — Additional data collection / analysis ideas

Prioritized by ROI given the "convergence not diffusion" reframing. Roughly in decreasing order of scientific payoff per unit effort.

### High priority (directly strengthens the revised story)

1. **Citation extraction inside state documents** — scan every state's raw text for explicit references to CoSN, ISTE, NIST, US OET 2023, Common Sense Media, TeachAI, Digital Promise. Count per state. If the frame-convergence story is right, we should see a **citation network** centered on 3–5 civil-society anchors. Cheap — regex over existing chunks.jsonl.

2. **State × seed ratio diagnostic** — for every state pair (A,B), compute ratio `cosine(A,B) / max(cosine(A, seed), cosine(B, seed))`. If the ratio < 1 for most pairs, state-to-state similarity is mediated by the seed (convergence). If > 1, they're more like each other than like any seed (diffusion candidate). One script, reuses tfidf+idf we already have.

3. **Document-genre stratification** — classify each URL as {agency_guidance, legislative_bill, press_release, toolkit, FAQ, pd_page} via URL-path heuristics. Re-run Phase 1 stratified by genre. Diffusion signals, if they exist, should concentrate in bills (Jansa/Burgess-compatible) not in marketing pages.

4. **Temporal metadata backfill** — pull `<time>`, `datePublished` JSON-LD, or visible date strings from each raw HTML file we already have. Even partial coverage lets us ask: is there a first-mover state whose vocabulary then propagates? This is the *only* way to move from "convergence" to a testable "cascade" hypothesis.

### Medium priority (fills gaps, expands claims)

5. **Recollect 12 excluded states** — NC, MS, LA, MO, NY, WV, ME, MI, GA, OH, VA, SC. Widen sitemap crawl, add PDF extraction pipeline (the AR failure is blocking here). Target ≥500 tokens per state so they enter analyses.

6. **Legislative bill corpus** — our current corpus is 90%+ agency guidance. Pull AI-ed bills from LegiScan for 2023–2026 (~50–100 bills across 15–20 states). This is where *real* copy-paste lawmaking would live (Jansa 2019's unit of analysis). Separate corpus, run the same pipeline.

7. **Control corpus (pre-AI ed-tech)** — collect 2020–2022 state ed-tech or digital-citizenship guidance that's not about AI. Run identical pipeline. If vocabulary-convergence numbers look similar there, we're measuring genre convention; if distinct, AI frame is specific.

8. **Author / consultant tracing** — scan acknowledgements sections for named consultants, working groups (CCSSO, Digital Promise, ISTE, SETDA). A consultant who drafted 3 states' guidance is a concrete convergence mechanism. Light NER + manual verification.

### Lower priority (methodological polish)

9. **Ground-truth labeling** — 2 coders, 10 states, code each on {orientation, audience, binding-ness, primary-frame}. Compute Cohen's κ. Then correlate coded orientation with seed-attribution output → external validity for the whole pipeline.

10. **Topic model (STM)** — Structural Topic Model (Roberts et al., 2014) on document-level corpus, with seed-attribution as metadata covariate. Would give us a topic-level map complementing cosine-based clusters.

11. **Named entity graph** — Extract PERSON / ORG / LAW entities across all docs; edges where two states mention the same entity. Visual of the shared entity-space would be immediately legible.

12. **Versioning + refresh protocol** — publish each corpus snapshot with SHA256 manifest + date. Enables longitudinal reanalysis (did the frame shift after a major federal announcement?). Already half-built in `corpus-validity.json`.

### Explicit non-goals for next iteration

- No new ML models trained from scratch (keeps interpretability).
- No sentiment analysis (wrong level of abstraction for policy text).
- No embedding-based similarity until TF-IDF story is fully squeezed (interpretability > marginal accuracy).

---

## Related artefacts already on disk

- `scripts/validate-corpus.mjs` (v1 null — flawed) → **keep** but mark superseded
- `scripts/validate-null-v2.mjs` (document-block permutation null) — written, not yet executed
- `scripts/build-document-similarity.mjs` — written, not yet executed
- `scripts/bootstrap-clusters.mjs` — written, not yet executed
- `scripts/loo-seed-validation.mjs` — written, not yet executed
- `data/analysis/corpus-validity.md` — v1 results; valid as descriptive stats, null section needs retraction/replacement by v2
- `data/analysis/seed-attribution.md` — current, with SEED_OET_2023 added
- `data/analysis/passage-alignment.md` — current
- `data/analysis/corpus-validity-v2.md` — doc-block permutation null; shows pathological reversal (states more differentiated than random shuffle), so permutation-based significance is **not** the right test for our convergence question
- `data/analysis/bootstrap-clusters.md` — 4-state stable core (CA, CT, DE, PA); IL/MD/NJ unstable
- `data/analysis/loo-seed-validation.md` — 27/29 seed assignments robust; only CA and PA flagged
- `data/analysis/document-similarity.md` — cross-state document pairs; top pair ME↔MO 0.549 (CS-standards), CA↔CT 0.445 (professional-learning / guidance)
- `data/analysis/residual-vocabulary.md` — Cluster 1 has 1,165 residual terms vs 76 (C2) / 517 (C3). Top terms (`governor`, `mental health`, `companion`, `bots`, `consumer`, `children`, `care`) point to **CA SB 243 / AI-companion-chatbot / youth-safety frame**, not a hidden consultant
- `data/analysis/temporal-cascade.md` — Pearson r=-0.050, Spearman ρ=-0.030; simple cascade hypothesis rejected. Later-period vs earlier-period diff in cos-to-earlier = +0.015 (negligible)
- `data/analysis/cluster1-passage-deep.md` — 5-token min, legal-acronyms excluded. Remaining shared phrases are pure genre boilerplate (`"the use of ai tools"`, `"the responsible use of ai"`). **No consultant signature, no organizational trace** → the 5th mediator is topical/era convergence, not document reuse

---

## Note 2026-04-22 — Cluster 1 mystery resolved: topical convergence, not diffusion

Following three rounds of probing why CA/CT/DE/PA co-cluster at p=1.000 with state-seed ratio >2×:

**Answer.** There is no unaccounted-for 5th seed document or consultant. The Cluster 1 signature is driven by:

1. **AI-companion-chatbot / youth-safety vocabulary** — California's SB 243 era concerns (`companion`, `bots`, `mental health`, `children`, `consumer`, `care`, `governor`) concentrate in these four states' 2025–2026 policies. This is a topic-level convergence, not a document-lineage effect.
2. **2026-era AI-policy boilerplate** — phrases like "the use of ai tools", "the responsible use of ai", "students may use ai tools" are genre conventions any late-2025/2026 policy will contain.
3. **No Jansa-style copy-paste diffusion** — passage alignment at 5-token threshold, with legal acronyms excluded, returns zero named organizations, zero consultant fingerprints, zero shared long spans.

**Methodological implication.** This completes the reframe: our pipeline measures **Grimmer-Stewart topical convergence**, not **Jansa legislative diffusion**. All existing cluster/similarity findings remain valid under that interpretation; they should NOT be presented as evidence of copy-paste borrowing between states.

**Next probes (optional).**
- Seed SB 243 itself (or a condensed companion-chatbot frame document) and re-run seed attribution — prediction: CA/CT/DE/PA will load on it, confirming topical-convergence explanation.
- Check whether CT/DE/PA have their own companion-chatbot bills in 2025–2026 legislative tracking — if yes, Cluster 1 is a *policy-topic cohort*, not a *copying cohort*.
