// Phase 2 census: add Homewood/Sylacauga/Tuscumbia; upgrade Hartselle + Cullman County signals
const fs = require("fs");
const path = require("path");
const RECORDS = path.join(__dirname, "..", "canonical", "policy-records.json");
const records = JSON.parse(fs.readFileSync(RECORDS, "utf8"));
const now = "2026-04-22T23:59:30.000Z";

const base = {
  jurisdiction_type: "district",
  parent_jurisdiction_id: "state-al",
  state_abbr: "AL",
  review_status: "approved",
  extraction_status: "validated",
  coder_type: "hybrid",
  confidence: 0.6,
  policy_strength: null,
  ai_use_allowed: null,
  assessment_policy: null,
  privacy_policy: null,
  teacher_pd_support: null,
  implementation_stage: null,
  policy_orientation: null,
  version: 1,
  updated_at: now,
  source_authority: "secondary_reporting",
  verification_status: "partial",
};

const adds = [
  {
    record_id: "district-al-homewood-city-v1",
    jurisdiction_id: "district-al-homewood-city",
    jurisdiction_name: "Homewood City Schools",
    notes: "Informal administrative position (March 2023): ChatGPT not blocked on school servers; district emphasizes educating rather than restricting access. No formal board policy located.",
    source_documents: [
      {
        url: "https://thehomewoodstar.com/schools/hhs/student-or-bot-schools-grapple-with-chatgpt/",
        title: "Student or bot? Schools grapple with ChatGPT — The Homewood Star",
        published_date_guess: "2023-03-31",
        document_id: "AL-DISTRICT-HOMEWOOD-CITY-STAR",
        issuer_name: "The Homewood Star / Homewood High School Administration",
        issuer_level: "k12_district",
        instrument_type: "district_position_statement",
        issued_date: "2023-03-31",
        status: "in_effect",
        short_summary: "Assistant Principal Mindy McBride quoted on HCS approach: educate rather than block. Informal position only.",
        relations: [],
      },
    ],
    verification_notes: "[2026-04-22 phase2 census] secondary_reporting. Administrative quotes in local newspaper; no formal policy document.",
  },
  {
    record_id: "district-al-sylacauga-city-v1",
    jurisdiction_id: "district-al-sylacauga-city",
    jurisdiction_name: "Sylacauga City Schools",
    notes: "Sylacauga's Career Tech Center is one of five named Alabama schools currently using the ASCTE / ALSDE 'Intro to AI' elective curriculum (WAFF, 2026-04-07).",
    source_documents: [
      {
        url: "https://www.waff.com/2026/04/07/new-intro-ai-elective-rolling-out-alabama-schools-this-fall/",
        title: "'Intro to AI' elective rolling out at Alabama schools this fall — WAFF",
        published_date_guess: "2026-04-07",
        document_id: "AL-DISTRICT-SYLACAUGA-CITY-AIELECTIVE",
        issuer_name: "WAFF / Sylacauga Career Tech Center",
        issuer_level: "k12_district",
        instrument_type: "curricular_program",
        issued_date: "2026-04-07",
        status: "in_effect",
        short_summary: "District career-tech arm among first to adopt ASCTE/ALSDE 'Intro to AI' curriculum.",
        relations: [],
      },
    ],
    verification_notes: "[2026-04-22 phase2 census] secondary_reporting. Named adopter of statewide AI elective curriculum; no standalone policy document.",
  },
  {
    record_id: "district-al-tuscumbia-city-v1",
    jurisdiction_id: "district-al-tuscumbia-city",
    jurisdiction_name: "Tuscumbia City Schools",
    notes: "Deshler High School (Tuscumbia City) named as adopter of ASCTE / ALSDE 'Intro to AI' elective curriculum (WAFF, 2026-04-07).",
    source_documents: [
      {
        url: "https://www.waff.com/2026/04/07/new-intro-ai-elective-rolling-out-alabama-schools-this-fall/",
        title: "'Intro to AI' elective rolling out at Alabama schools this fall — WAFF",
        published_date_guess: "2026-04-07",
        document_id: "AL-DISTRICT-TUSCUMBIA-CITY-AIELECTIVE",
        issuer_name: "WAFF / Deshler High School (Tuscumbia City Schools)",
        issuer_level: "k12_district",
        instrument_type: "curricular_program",
        issued_date: "2026-04-07",
        status: "in_effect",
        short_summary: "Deshler HS named as adopter of statewide AI elective curriculum.",
        relations: [],
      },
    ],
    verification_notes: "[2026-04-22 phase2 census] secondary_reporting. Named adopter of statewide AI elective curriculum; no standalone policy document.",
  },
];

for (const a of adds) {
  records.push({ ...base, ...a });
}

// Upgrade Hartselle City: add 2nd source doc for AI elective adoption
const hartselle = records.find(r => r.record_id === "district-al-hartselle-city-v1");
if (hartselle) {
  hartselle.source_documents.push({
    url: "https://www.waff.com/2026/04/07/new-intro-ai-elective-rolling-out-alabama-schools-this-fall/",
    title: "'Intro to AI' elective rolling out at Alabama schools this fall — WAFF",
    published_date_guess: "2026-04-07",
    document_id: "AL-DISTRICT-HARTSELLE-CITY-AIELECTIVE",
    issuer_name: "WAFF / Hartselle City Schools",
    issuer_level: "k12_district",
    instrument_type: "curricular_program",
    issued_date: "2026-04-07",
    status: "in_effect",
    short_summary: "Hartselle named as adopter of ASCTE/ALSDE 'Intro to AI' curriculum — upgraded signal from 2023 committee to 2026 curriculum adoption.",
    relations: [],
  });
  hartselle.verification_notes += " [2026-04-22 phase2 upgrade] Now adopts ASCTE/ALSDE 'Intro to AI' elective curriculum (WAFF 2026-04-07).";
  hartselle.updated_at = now;
}

// Upgrade Cullman County: add AI elective adoption
const cullmanCo = records.find(r => r.record_id === "district-al-cullman-county-v1");
if (cullmanCo) {
  cullmanCo.source_documents.push({
    url: "https://www.waff.com/2026/04/07/new-intro-ai-elective-rolling-out-alabama-schools-this-fall/",
    title: "'Intro to AI' elective rolling out at Alabama schools this fall — WAFF",
    published_date_guess: "2026-04-07",
    document_id: "AL-DISTRICT-CULLMAN-COUNTY-AIELECTIVE",
    issuer_name: "WAFF / Cullman County Career Tech",
    issuer_level: "k12_district",
    instrument_type: "curricular_program",
    issued_date: "2026-04-07",
    status: "in_effect",
    short_summary: "Cullman County Career Tech incorporating parts of ASCTE/ALSDE AI curriculum into other classes.",
    relations: [],
  });
  cullmanCo.verification_notes += " [2026-04-22 phase2 upgrade] Now incorporating ASCTE/ALSDE AI curriculum into career-tech classes.";
  cullmanCo.updated_at = now;
}

fs.writeFileSync(RECORDS, JSON.stringify(records, null, 2));
const al = records.filter(x => x.state_abbr === "AL" && x.jurisdiction_type === "district");
console.log("Phase 2 complete. AL districts:", al.length);
