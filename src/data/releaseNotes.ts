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
  }
];

export const currentRelease = releaseNotes[releaseNotes.length - 1];
