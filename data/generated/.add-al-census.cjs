// Add 4 new AL district records discovered during Option C full census
const fs = require("fs");
const path = require("path");
const RECORDS = path.join(__dirname, "..", "canonical", "policy-records.json");
const records = JSON.parse(fs.readFileSync(RECORDS, "utf8"));

const now = "2026-04-22T23:59:00.000Z";
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
    record_id: "district-al-cullman-county-v1",
    jurisdiction_id: "district-al-cullman-county",
    jurisdiction_name: "Cullman County Schools",
    notes: "Board approved a $96,000 contract with Spot.ai for AI-backed video surveillance/analytics (August 2023). No public AI instructional policy located; signal is procurement-level only.",
    source_documents: [
      {
        url: "https://www.govtech.com/education/k-12/alabama-district-approves-96k-ai-backed-video-surveillance-contract",
        title: "Alabama District Approves $96K AI-Backed Video Surveillance Contract",
        published_date_guess: "2023-08-25",
        document_id: "AL-DISTRICT-CULLMAN-COUNTY-SPOTAI",
        issuer_name: "GovTech / Cullman County Board of Education",
        issuer_level: "k12_district",
        instrument_type: "district_position_statement",
        issued_date: "2023-08-25",
        status: "in_effect",
        short_summary: "News coverage of board-approved Spot.ai video surveillance contract; not an instructional AI policy.",
        relations: [],
      },
    ],
    verification_notes: "[2026-04-22 census] secondary_reporting. Procurement-level signal only (AI surveillance contract). No instructional AI policy located on district site.",
  },
  {
    record_id: "district-al-hartselle-city-v1",
    jurisdiction_id: "district-al-hartselle-city",
    jurisdiction_name: "Hartselle City Schools",
    notes: "Following a 2023 incident of ChatGPT misuse at Hartselle High, teachers and administrators formed a committee to evaluate AI-generated app use. No public policy document located; committee-level signal only.",
    source_documents: [
      {
        url: "https://www.govtech.com/education/k-12/alabama-schools-establish-committees-rules-to-deal-with-ai",
        title: "Alabama Schools Establish Committees, Rules to Deal With AI",
        published_date_guess: "2023-09-06",
        document_id: "AL-DISTRICT-HARTSELLE-CITY-COMMITTEE",
        issuer_name: "GovTech / Hartselle City Schools",
        issuer_level: "k12_district",
        instrument_type: "district_position_statement",
        issued_date: "2023-09-06",
        status: "in_effect",
        short_summary: "District established AI evaluation committee and informal restrictions after ChatGPT misuse incident.",
        relations: [],
      },
    ],
    verification_notes: "[2026-04-22 census] secondary_reporting. Committee formation + informal restrictions; no public policy document.",
  },
  {
    record_id: "district-al-decatur-city-v1",
    jurisdiction_id: "district-al-decatur-city",
    jurisdiction_name: "Decatur City Schools",
    notes: "Superintendent Michael Douglas quoted on district AI usage in 2023 GovTech coverage. No public policy document located.",
    source_documents: [
      {
        url: "https://www.govtech.com/education/k-12/alabama-schools-establish-committees-rules-to-deal-with-ai",
        title: "Alabama Schools Establish Committees, Rules to Deal With AI",
        published_date_guess: "2023-09-06",
        document_id: "AL-DISTRICT-DECATUR-CITY-QUOTE",
        issuer_name: "GovTech / Decatur City Schools",
        issuer_level: "k12_district",
        instrument_type: "district_position_statement",
        issued_date: "2023-09-06",
        status: "in_effect",
        short_summary: "Superintendent quote on AI usage; no formal policy document located.",
        relations: [],
      },
    ],
    verification_notes: "[2026-04-22 census] secondary_reporting. Superintendent quote only; no public policy document.",
  },
  {
    record_id: "district-al-hoover-city-v1",
    jurisdiction_id: "district-al-hoover-city",
    jurisdiction_name: "Hoover City Schools",
    notes: "ISTE case study documents a Hoover pilot (Healthy Heart Chatbot classroom activity). Pilot-level signal; no districtwide AI policy document located.",
    source_documents: [
      {
        url: "https://iste.org/case-studies/hoover-city-schools-case-study",
        title: "Hoover City Schools Case Study — ISTE",
        published_date_guess: null,
        document_id: "AL-DISTRICT-HOOVER-CITY-ISTE",
        issuer_name: "ISTE / Hoover City Schools",
        issuer_level: "k12_district",
        instrument_type: "curricular_program",
        status: "in_effect",
        short_summary: "ISTE case study of classroom AI pilot (Healthy Heart Chatbot); not a districtwide policy.",
        relations: [],
      },
    ],
    verification_notes: "[2026-04-22 census] secondary_reporting. Classroom pilot (ISTE case study); no districtwide policy.",
  },
];

for (const a of adds) {
  const rec = { ...base, ...a };
  // preserve field order roughly; push at end
  records.push(rec);
}

fs.writeFileSync(RECORDS, JSON.stringify(records, null, 2));
console.log("Added", adds.length, "records. Total AL districts now:",
  records.filter(x => x.state_abbr === "AL" && x.jurisdiction_type === "district").length);
