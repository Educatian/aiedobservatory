export interface ReleaseHighlight {
  /** Material Symbol name */
  icon: string;
  title: string;
  body: string;
  /**
   * Optional CSS selector to spotlight when the user clicks "Show me".
   * The element gets a pulsing ring for ~4s and scrolls into view.
   */
  spotlightSelector?: string;
  /**
   * Optional UI state the App should toggle ON before scrolling to the
   * spotlight target — dispatched as a `aiedob:release-prep` CustomEvent.
   */
  prepare?: "enable_teacher_mode";
}

export interface ReleaseNote {
  /** Version string. When this increases, the modal re-appears on first visit. */
  version: string;
  date: string;
  title: string;
  summary: string;
  highlights: ReleaseHighlight[];
}

/**
 * The CURRENT release is the last entry in this array. Bump its `version`
 * any time a new user-facing change ships and the "What's new" modal should
 * re-surface. The modal reads localStorage key `aiedob.whatsNewSeenVersion`
 * and only shows when the stored value !== currentRelease.version.
 */
export const releaseNotes: ReleaseNote[] = [
  {
    version: "2026.04.22-b",
    date: "2026-04-22",
    title: "Multi-layer policy hierarchy + teacher-facing details",
    summary:
      "Every state record now exposes a five-layer policy stack (governor, state agency, legislature, K-12 district, higher-ed) and a teacher guidance panel with grade-band rules, data guardrails, and a copy-ready syllabus template.",
    highlights: [
      {
        icon: "hub",
        title: "Policy hierarchy diagram",
        body:
          "Above each state's metadata grid, a new diagram stacks instruments across up to seven issuer layers and draws dashed arrows along recommends / derives_from / tasks relations.",
        spotlightSelector: ".hierarchy-diagram"
      },
      {
        icon: "timeline",
        title: "Instrument timeline",
        body:
          "Dated instruments are plotted on a horizontal timeline, colour-coded by branch (executive, legislative, K-12, higher-ed).",
        spotlightSelector: ".instrument-timeline"
      },
      {
        icon: "school",
        title: "Grade-band teacher rules (Teacher Mode)",
        body:
          "Flip the Teacher Mode toggle at the top of the inspector to open the Teacher Guide panel: K-2 / 3-5 / 6-8 / 9-12 / higher-ed stance chips, disclosure & consent pills, a red-bordered data-guardrails list, classroom rules grid, action-item checklist, and a copy-ready syllabus template.",
        spotlightSelector: ".teacher-guidance-panel",
        prepare: "enable_teacher_mode"
      },
      {
        icon: "compare_arrows",
        title: "Richer comparison matrix",
        body:
          "Compare two states across grade-band stance, count of data prohibitions, and whether prior AI training is required — in addition to the existing score rows."
      },
      {
        icon: "travel_explore",
        title: "Multi-layer crawler",
        body:
          "Seven pilot states (CA, NY, TX, FL, WA, IL, WI) have been enriched with instruments from governor offices, state agencies, legislatures, districts, and HEIs via the new crawler. See docs/CRAWLING_STRATEGY.md for the plan."
      }
    ]
  },
  {
    version: "2026.04.22-c",
    date: "2026-04-22",
    title: "Corpus completeness + Reader's Manual",
    summary:
      "Cross-checked our crawl against the US Department of Education's 2026 state AI guidance roster and filled the six missing states. Also surfaced the Reader's Manual as a persistent top-nav entry point.",
    highlights: [
      {
        icon: "public",
        title: "Six new states crawled (AL, AZ, HI, ND, NV, WY)",
        body:
          "Twelve new source documents added across six states listed in the US DOE 2026 'Guidance from States' roster. Chunks regenerated (685 kept + 180 new = 865 total); downstream analyses now run on N=35 states, with leave-one-out seed validation at 35/35 and bootstrap stable pairs up from 6 to 22.",
        spotlightSelector: ".policy-tile-map"
      },
      {
        icon: "menu_book",
        title: "Reader's Manual in top nav",
        body:
          "The Reader's Manual is now one click away from any page — a new book icon in the top-actions row opens the full guide in a new tab. Its 'Back to App' button returns you to the dashboard map view, not the landing page.",
        spotlightSelector: "a[href='/guides/manual.html']"
      },
      {
        icon: "receipt_long",
        title: "Changelog with supersession note",
        body:
          "docs/FUTURE_DIRECTIONS.md records the corpus-completeness update, what numbers drifted, and explicitly marks pre-2026-04-22T22:40 analytic outputs as superseded."
      }
    ]
  },
  {
    version: "2026.04.22-d",
    date: "2026-04-22",
    title: "Alabama district-level body extraction",
    summary:
      "Fifteen Alabama LEAs are now classified by whether their AI policy text is actually recoverable. Four districts yielded primary PDFs (extracted with opendataloader-pdf); two have primary HTML clauses; nine are news-reported only — an honest ceiling on district-level AIED policy formalization in Alabama.",
    highlights: [
      {
        icon: "picture_as_pdf",
        title: "4 district AI policies extracted as structured PDF",
        body:
          "Madison City AUP, Talladega City AUP, Gadsden City Code of Conduct (AI section), and Tuscaloosa City Position Statement on AI — all run through opendataloader-pdf for heading-aware JSON. Template-adoption check against the ALSDE/aiforeducation.io LEA template came back NEGATIVE for all four: Alabama districts draft locally, not from the state model."
      },
      {
        icon: "fact_check",
        title: "12 URL triage with classification + evidence",
        body:
          "Each remaining district URL was fetched and tagged primary_pdf / primary_html / secondary_reporting / dead. Nine turned out to be news coverage (Cullman Policy 4.9.6 adopted 2025-10-21, Baldwin 7.17 approved 2025-06-17, etc.), not primary documents. All 15 verification_notes fields now record the classification and what was (or wasn't) recoverable."
      },
      {
        icon: "insights",
        title: "Research finding: AL district AI formalization is shallow",
        body:
          "Only 6 of 15 Alabama LEAs in our sample publish primary AI-policy text; the other 9 stop at board-meeting announcements or news mentions. Evidence artifact at data/generated/al-district-evidence.json."
      }
    ]
  },
  {
    version: "2026.04.22-e",
    date: "2026-04-22",
    title: "Alabama LEA census — full 151-district sweep",
    summary:
      "We extended the Alabama district layer from a top-30 sample to a census of all 151 LEAs on the Wikipedia list. Of 151, only 19 show any public AI-policy signal — 6 publish primary text, 13 are news/committee/procurement/pilot-level, and ~132 are silent.",
    highlights: [
      {
        icon: "fact_check",
        title: "4 new LEAs surfaced in the long-tail sweep",
        body:
          "Cullman County (Spot.ai surveillance contract, 2023), Hartselle City (committee + app restrictions after ChatGPT incident), Decatur City (superintendent quote), and Hoover City (ISTE classroom pilot). All four are secondary_reporting — none publish a primary AI policy document."
      },
      {
        icon: "insights",
        title: "Population-level finding: 6/151 primary, 13/151 secondary, ~132/151 silent",
        body:
          "Of 151 Alabama LEAs, at most 6 publish primary AI-policy text in a researcher-accessible form as of April 2026. Full report at data/generated/al-lea-census-report.md. Caveats: public-web-only, news-source biased."
      },
      {
        icon: "groups",
        title: "District layer panel now shows 19 AL districts",
        body:
          "The inspector's pinned District layer panel automatically reflects the expanded canonical store — classification pills (primary_pdf / primary_html / secondary) render for every AL record."
      }
    ]
  }
];

export const currentRelease = releaseNotes[releaseNotes.length - 1];
