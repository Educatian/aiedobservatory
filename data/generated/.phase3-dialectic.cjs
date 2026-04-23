// Phase 3 (dialectic validation): add sub-category tags + Madison HTML source + verified-silent records
const fs = require("fs");
const path = require("path");
const RECORDS = path.join(__dirname, "..", "canonical", "policy-records.json");
const records = JSON.parse(fs.readFileSync(RECORDS, "utf8"));
const now = "2026-04-22T23:59:59.000Z";

// 1) Add Madison City HTML source page (discovered during counter-factual test)
const madison = records.find(r => r.record_id === "district-al-madison-city-v1");
if (madison) {
  const hasHtml = madison.source_documents.some(s => /Page\/8887/.test(s.url));
  if (!hasHtml) {
    madison.source_documents.push({
      url: "https://www.madisoncity.k12.al.us/Page/8887",
      title: "Madison City Schools — Overview / Artificial Intelligence Acceptable Use Policy (HTML)",
      published_date_guess: "2023-06-29",
      document_id: "AL-DISTRICT-MADISON-CITY-AUP-HTML",
      issuer_name: "Madison City Schools",
      issuer_level: "k12_district",
      instrument_type: "acceptable_use_policy",
      issued_date: "2023-06-29",
      status: "in_effect",
      short_summary: "HTML version of Madison AUP discovered during phase-3 counter-factual validation test.",
      relations: [{ kind: "implements", targetDocumentId: "AL-DISTRICT-MADISON-CITY-AUP", note: "HTML mirror of the PDF" }],
    });
    madison.verification_notes += " [2026-04-22 phase3] HTML mirror at Page/8887 discovered during counter-factual test.";
    madison.updated_at = now;
  }
}

// 2) Add ai_classification sub-category to verification_notes for all AL districts
const subcat = {
  "district-al-madison-city-v1": "instructional_ai",
  "district-al-tuscaloosa-city-v1": "instructional_ai",
  "district-al-vestavia-hills-city-v1": "instructional_ai",
  "district-al-cullman-city-v1": "instructional_ai",
  "district-al-talladega-city-v1": "instructional_ai",
  "district-al-gadsden-city-v1": "instructional_ai",
  "district-al-athens-city-v1": "instructional_ai",
  "district-al-florence-city-v1": "instructional_ai",
  "district-al-madison-county-v1": "instructional_ai",
  "district-al-baldwin-county-v1": "instructional_ai",
  "district-al-morgan-county-v1": "instructional_ai",
  "district-al-huntsville-city-v1": "instructional_ai",
  "district-al-mobile-county-v1": "instructional_ai",
  "district-al-montgomery-v1": "instructional_ai",
  "district-al-trussville-city-v1": "instructional_ai",
  "district-al-cullman-county-v1": "ai_adjacent", // surveillance procurement
  "district-al-hartselle-city-v1": "instructional_ai",
  "district-al-decatur-city-v1": "instructional_ai",
  "district-al-hoover-city-v1": "ai_adjacent",  // classroom pilot, not policy
  "district-al-homewood-city-v1": "instructional_ai",
  "district-al-sylacauga-city-v1": "instructional_ai",
  "district-al-tuscumbia-city-v1": "instructional_ai",
};

for (const [rid, cat] of Object.entries(subcat)) {
  const rec = records.find(r => r.record_id === rid);
  if (rec && !/ai_classification:/.test(rec.verification_notes || "")) {
    rec.verification_notes = (rec.verification_notes || "") + ` [ai_classification: ${cat}]`;
    rec.updated_at = now;
  }
}

// 3) Add three verified-silent records (hard-confirmed via direct fetch)
const baseSilent = {
  jurisdiction_type: "district",
  parent_jurisdiction_id: "state-al",
  state_abbr: "AL",
  review_status: "approved",
  extraction_status: "validated",
  coder_type: "hybrid",
  confidence: 0.9,
  policy_strength: 0,
  ai_use_allowed: null,
  assessment_policy: null,
  privacy_policy: null,
  teacher_pd_support: null,
  implementation_stage: 0,
  policy_orientation: "silent",
  version: 1,
  updated_at: now,
  source_authority: "unknown",
  verification_status: "supported",
};

const silentAdds = [
  {
    record_id: "district-al-birmingham-city-v1",
    jurisdiction_id: "district-al-birmingham-city",
    jurisdiction_name: "Birmingham City Schools",
    notes: "Direct PDF inspection (Student Code of Conduct, 1.3MB) confirms NO AI-related language as of 2026-04. Hard-verified silent.",
    source_documents: [
      {
        url: "https://core-docs.s3.us-east-1.amazonaws.com/documents/asset/uploaded_file/4669/SMS/4431473/BCS_Student_Code_of_Conduct.pdf",
        title: "Birmingham City Schools — Student Code of Conduct (checked for AI language)",
        published_date_guess: null,
        document_id: "AL-DISTRICT-BIRMINGHAM-CITY-CODE-CHECKED",
        issuer_name: "Birmingham City Schools",
        issuer_level: "k12_district",
        instrument_type: "district_position_statement",
        status: "in_effect",
        short_summary: "Code of Conduct directly inspected; contains no artificial-intelligence / ChatGPT / GenAI language.",
        relations: [],
      },
    ],
    verification_notes: "[2026-04-22 phase3 verified-silent] Direct-fetch confirmation via WebFetch on Code of Conduct PDF returned NO AI-related language. [ai_classification: verified_silent]",
  },
  {
    record_id: "district-al-auburn-city-v1",
    jurisdiction_id: "district-al-auburn-city",
    jurisdiction_name: "Auburn City Schools",
    notes: "Direct HTML inspection of Auburn City Schools Acceptable Use Policy confirms NO AI-related language as of 2026-04. Hard-verified silent.",
    source_documents: [
      {
        url: "https://www.auburnschools.org/acceptable-use-policy",
        title: "Auburn City Schools — Acceptable Use Policy (checked for AI language)",
        published_date_guess: null,
        document_id: "AL-DISTRICT-AUBURN-CITY-AUP-CHECKED",
        issuer_name: "Auburn City Schools",
        issuer_level: "k12_district",
        instrument_type: "acceptable_use_policy",
        status: "in_effect",
        short_summary: "District AUP directly inspected; contains no artificial-intelligence / ChatGPT / GenAI language.",
        relations: [],
      },
    ],
    verification_notes: "[2026-04-22 phase3 verified-silent] Direct-fetch confirmation via WebFetch on AUP HTML returned NO AI-related language. [ai_classification: verified_silent]",
  },
  {
    record_id: "district-al-pickens-county-v1",
    jurisdiction_id: "district-al-pickens-county",
    jurisdiction_name: "Pickens County Schools",
    notes: "Random-sample audit target. Direct PDF inspection of 2024-2025 Code of Conduct confirms NO AI-related language. Hard-verified silent.",
    source_documents: [
      {
        url: "https://resources.finalsite.net/images/v1744650399/pickenscountyschoolsnet/xwnsjah4ovebketze8jb/PickensCountySchoolsStudentParentCodeofConductandResourceGuide2024-2025.pdf",
        title: "Pickens County Schools — Student/Parent Code of Conduct and Resource Guide 2024-2025 (checked)",
        published_date_guess: "2024-08-01",
        document_id: "AL-DISTRICT-PICKENS-COUNTY-CODE-CHECKED",
        issuer_name: "Pickens County Schools",
        issuer_level: "k12_district",
        instrument_type: "district_position_statement",
        issued_date: "2024-08-01",
        status: "in_effect",
        short_summary: "Code of Conduct directly inspected; contains no AI-related language.",
        relations: [],
      },
    ],
    verification_notes: "[2026-04-22 phase3 verified-silent] Random-sample audit (seed 42, pick 1/10). Direct-fetch confirmation via WebFetch on 2024-2025 Code PDF returned NO AI-related language. [ai_classification: verified_silent]",
  },
];

for (const s of silentAdds) {
  records.push({ ...baseSilent, ...s });
}

fs.writeFileSync(RECORDS, JSON.stringify(records, null, 2));
const al = records.filter(x => x.state_abbr === "AL" && x.jurisdiction_type === "district");
console.log("Phase 3 complete. Total AL districts:", al.length);
console.log("  instructional_ai:", al.filter(x => /ai_classification: instructional_ai/.test(x.verification_notes)).length);
console.log("  ai_adjacent:", al.filter(x => /ai_classification: ai_adjacent/.test(x.verification_notes)).length);
console.log("  verified_silent:", al.filter(x => /ai_classification: verified_silent/.test(x.verification_notes)).length);
