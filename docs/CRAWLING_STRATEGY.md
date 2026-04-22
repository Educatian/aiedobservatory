# Multi-Layer Crawling Strategy (2026 Q2)

## Goal

Reach "Alabama-level" coverage for every state: a 5-layer policy stack where each
state record carries instruments from — where they exist — governor's office,
state agency (DOE / DPI / OIT), legislature, K-12 district(s), and higher-ed
coordinator or flagship HEI.

## The five layers and where to find them

| Layer | Canonical `issuer_level` | Primary host pattern | Secondary signal |
|---|---|---|---|
| Governor | `governor_office` | `governor.{state_tld}` / `gov.{state}.gov` | Executive orders, press releases, task-force reports |
| State agency (K-12) | `state_agency` | `{state_doe_tld}` (`azed.gov`, `nysed.gov`, `tea.texas.gov`, `cde.ca.gov`, …) | AI / generative-AI policy hub, guidance PDFs |
| State IT / OIT | `state_agency` | `oit.{state}.gov` or `its.{state}.gov` | Acceptable-use policies |
| Legislature | `legislature` | State legislature bill tracker (`alison.legislature.state.al.us`, `leginfo.legislature.ca.gov`, `nyassembly.gov`, `capitol.texas.gov`, …) | Bill status, committee substitutes |
| Legislative study body | `legislative_study_body` | Same tracker, committee pages | Interim committee reports |
| K-12 district | `k12_district` | Largest-metro districts (`lausd.net`, `nycschools.org`, `mnps.org`, `ccsd.net`, `bsd.edu`, …) | AI position statements, tech portals |
| Higher-Ed coordinator | `higher_ed_coordinator` | System / board-of-regents sites (`calstate.edu`, `suny.edu`, `utsystem.edu`, `ache.edu`, …) | Consortium tracks, shared licenses |
| Higher-Ed institution | `higher_ed_institution` | Flagship + 1-2 notable institutions | Faculty guides, syllabus policies |

## Per-state seed template

A single state produces an object like:

```json
{
  "state_abbr": "CA",
  "layers": {
    "governor_office": [
      { "url": "https://www.gov.ca.gov/2023/09/06/california-issues-ai-executive-order/", "instrument_type": "task_force_report", "issued_date_guess": "2023-09-06" }
    ],
    "state_agency": [
      { "url": "https://www.cde.ca.gov/ci/pl/aiineducation.asp", "instrument_type": "acceptable_use_policy" }
    ],
    "legislature": [
      { "url": "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240AB2876", "instrument_type": "bill" }
    ],
    "k12_district": [],
    "higher_ed_coordinator": [],
    "higher_ed_institution": []
  }
}
```

## Crawler phases

1. **Seed load** — read `data/multi-layer-seeds.json`.
2. **Fetch** — `fetch()` each seed URL with a 12 s timeout and `User-Agent: aiedobservatory-crawler/1.0`. Retry once on network error. Respect robots — skip any path listed in a site's `robots.txt` Disallow.
3. **Strip** — HTML to plain text; capture `<title>`, meta description, first `<h1>`/`<h2>`, and the first 2 000 characters of visible text.
4. **Heuristic classify** — if the seed entry already names `issuer_level` + `instrument_type`, keep them. Otherwise infer from host + title using the same heuristic block already used by `scripts/backfill-teacher-guidance.mjs`.
5. **Date extraction** — prefer explicit "Effective" / "Adopted" / "Issued" dates in the first 2 000 chars (regex). Fall back to `Last-Modified` header, then to seed `issued_date_guess`.
6. **Merge** — write a `data/generated/multi-layer-harvest.json` where each record is:

   ```json
   {
     "state_abbr": "CA",
     "document_id": "CA-GOV-EO-2023",
     "issuer_name": "Office of the Governor (CA)",
     "issuer_level": "governor_office",
     "instrument_type": "task_force_report",
     "issued_date": "2023-09-06",
     "effective_date": null,
     "status": "in_effect",
     "short_summary": "Executive order…",
     "url": "https://www.gov.ca.gov/2023/09/06/…",
     "title": "…"
   }
   ```

7. **Canonical merge** — `scripts/merge-harvest-into-canonical.mjs` dedupes by `url`, appends new `source_documents`, recomputes `source_count`, and logs deltas to `data/audit/crawl-2026Q2-{timestamp}.json`.
8. **Re-evaluate** — after merge, re-run the teacher-guidance back-fill so confidence reflects the richer source base.

## Failure modes & mitigations

- **Client-rendered pages** (React/Angular legislature trackers) — fetch the static fallback URL or a print view where exposed; otherwise flag as `needs_js_render`.
- **PDF-only policies** — write the URL to `data/generated/pdf-queue.json`; the existing `extract-policy-record-from-pdf-gemini.mjs` pipeline handles these.
- **Soft 404 / parked pages** — flag if fetched HTML length <400 chars with no `<h1>`.
- **Rate limits** — serial fetch with 800 ms delay per host; back off to 5 s on 429.

## Visualization targets

- **`InstrumentTimelineSvg`** already renders the time axis.
- **`HierarchyDiagramSvg`** (new) — five horizontal lanes (governor → agency → legislature → K-12 → higher-ed). Each seed instrument becomes a dot on its lane, sized by `policy_strength` weight. Arrows render `relations` (`derives_from`, `recommends`, `tasks`, `supersedes`).

## Non-goals (this iteration)

- No live scraping of millions of pages — seeds are hand-curated per state.
- No LLM-based extraction in the crawler itself. LLM stays reserved for the
  existing Gemini PDF pipeline and ambiguous-case verification.
- No scraping of anything behind authentication.
