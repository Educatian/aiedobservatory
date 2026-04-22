#!/usr/bin/env node
/**
 * Chunker for newly-added state documents (AL, AZ, HI, ND, NV, WY).
 * Matches the existing chunks.jsonl schema. Uses pdftotext for PDFs,
 * a minimal stripHtml for HTML, and python-docx CLI for DOCX.
 *
 * Idempotent: rewrites chunks.jsonl containing (a) all existing entries
 * except those for the 6 new states, (b) freshly-generated entries.
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RAW = path.join(ROOT, "data", "generated", "raw");
const CHUNKS = path.join(ROOT, "data", "generated", "chunks.jsonl");

const NEW_STATES = ["AL", "AZ", "HI", "ND", "NV", "WY", "TX"];
const STATE_NAMES = { AL: "Alabama", AZ: "Arizona", HI: "Hawaii", ND: "North Dakota", NV: "Nevada", WY: "Wyoming", TX: "Texas" };

const SOURCE_URLS = {
  "AL-official-guidance.pdf": "https://oit.alabama.gov/wp-content/uploads/2025/01/Alabama-Generative-AI-Acceptable-Use-Policy.pdf",
  "AL-official-model-policy.docx": "https://www.aiforeducation.io/s/AL-AI_PolicyTemplate_UPDATED_20240524.docx",
  "AZ-official-guidance.pdf": "https://education.arizona.edu/sites/default/files/2025-05/AZ-GenAI-Guidance-v25.0155.pdf",
  "HI-official-guidance.pdf": "https://docs.google.com/presentation/d/1LQCtWDPMaLfzGpXD1mYKQDJr2LdAZLamJHsd4xe4zbw",
  "HI-official-landing.html": "https://hawaiipublicschools.org/student-programs/artificial-intelligence/",
  "ND-official-guidance.html": "https://www.nd.gov/dpi/policyguidelines/north-dakota-k-12-ai-guidance-framework",
  "ND-official-guidance-linked-1.pdf": "https://www.nd.gov/dpi/sites/www/files/documents/SAO/AI%20Checklist/Implementation%20Checklist%20-%20School%20Leadership.pdf",
  "ND-official-guidance-linked-2.pdf": "https://www.nd.gov/dpi/sites/www/files/documents/SAO/AI%20Checklist/Implementation%20Checklist%20-%20Educators.pdf",
  "ND-official-guidance-linked-3.pdf": "https://www.nd.gov/dpi/sites/www/files/documents/SAO/AI%20Checklist/Implementation%20Checklist%20-%20Business%20and%20IT.pdf",
  "ND-official-guidance-linked-4.pdf": "https://www.nd.gov/dpi/sites/www/files/documents/SAO/AI%20Checklist/Implementation%20Checklist%20-%20Policy%2C%20Ethical%2C%20Legal.pdf",
  "NV-official-guidance.pdf": "https://doe.nv.gov/offices/office-of-teaching-and-learning/nevada-digital-learning",
  "WY-official-guidance.pdf": "https://edu.wyoming.gov/wp-content/uploads/2024/06/Guidance-for-AI-Policy-Development.pdf",
  "TX-dir-ai-training.html": "https://dir.texas.gov/statewide-artificial-intelligence-ai-awareness-training",
  "TX-tea-board-training.html": "https://tea.texas.gov/texas-schools/school-boards/school-board-member-training",
  "TX-governor-ai-news.html": "https://gov.texas.gov/news/category/artificial-intelligence",
  "TX-hb2060-enrolled.html": "https://capitol.texas.gov/tlodocs/88R/billtext/html/HB02060F.htm",
  "TX-hb2060-history.html": "https://capitol.texas.gov/BillLookup/History.aspx?LegSess=88R&Bill=HB2060",
  "TX-texas2036-ai-council.html": "https://texas2036.org/posts/the-ai-advisory-council-what-you-need-to-know/",
  "TX-dallas-isd-ai.html": "https://www.dallasisd.org/departments/library-media-services/ai-in-dallas-isd",
  "TX-thecb-ai-empowered.html": "https://dltx.highered.texas.gov/professional-learning/ai-empowered-series/",
  "TX-ut-austin-ai-teaching.html": "https://provost.utexas.edu/2024/09/27/ai-in-edu-ut-austin-introduces-new-ai-support-for-teaching-and-learning/",
  "TX-technology-framework.html": "https://tea.texas.gov/academics/learning-support-and-programs/technology-planning/long-range-plan-for-technology",
  "TX-virtual-hybrid-guidance.html": "https://tea.texas.gov/about-tea/news-and-multimedia/correspondence/taa-letters/sb-569-overview-virtual-and-hybrid-learning-guidance-for-the-2025-2026-school-year"
};

const TITLES = {
  "AL-official-guidance.pdf": "Alabama Generative AI Acceptable Use Policy (Office of Information Technology)",
  "AL-official-model-policy.docx": "Alabama AI Policy Template for Local Education Agencies",
  "AZ-official-guidance.pdf": "AI Guidance for Arizona Schools",
  "HI-official-guidance.pdf": "HIDOE AI Guidance for Employees",
  "HI-official-landing.html": "Artificial Intelligence - Hawaii State Department of Education",
  "ND-official-guidance.html": "North Dakota K-12 AI Guidance Framework",
  "ND-official-guidance-linked-1.pdf": "ND Implementation Checklist - School Leadership",
  "ND-official-guidance-linked-2.pdf": "ND Implementation Checklist - Educators",
  "ND-official-guidance-linked-3.pdf": "ND Implementation Checklist - Business and IT",
  "ND-official-guidance-linked-4.pdf": "ND Implementation Checklist - Policy, Ethical, Legal",
  "NV-official-guidance.pdf": "Nevada STELLAR Pathway to AI Teaching and Learning",
  "WY-official-guidance.pdf": "Wyoming Guidance for AI Policy Development",
  "TX-dir-ai-training.html": "Statewide AI Awareness Training | Texas Department of Information Resources",
  "TX-tea-board-training.html": "School Board Member Training | Texas Education Agency",
  "TX-governor-ai-news.html": "Office of the Governor of Texas — AI announcements",
  "TX-hb2060-enrolled.html": "HB 2060 (88R) — Enrolled Text (Texas AI Advisory Council)",
  "TX-hb2060-history.html": "HB 2060 (88R) — Bill History (Texas AI Advisory Council)",
  "TX-texas2036-ai-council.html": "Texas AI Advisory Council — Final Report Overview (Texas 2036)",
  "TX-dallas-isd-ai.html": "AI in Dallas ISD — Playbook for Responsible and Innovative Use",
  "TX-thecb-ai-empowered.html": "THECB — AI EmpowerED Webinar Series",
  "TX-ut-austin-ai-teaching.html": "UT Austin Provost — AI in EDU: New AI support for teaching and learning",
  "TX-technology-framework.html": "TEA — Long-Range Plan for Technology",
  "TX-virtual-hybrid-guidance.html": "TEA TAA Letter — SB 569 Virtual and Hybrid Learning Guidance (2025-2026)"
};

function stripHtml(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&ndash;|&mdash;|&#8211;|&#8212;/g, "-")
    .replace(/\s+/g, " ").trim();
}

function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".pdf") {
    try {
      return execSync(`pdftotext -layout -q "${filePath}" -`, { maxBuffer: 64 * 1024 * 1024 }).toString("utf8");
    } catch (e) { console.error("pdftotext failed for", filePath, e.message); return ""; }
  }
  if (ext === ".html" || ext === ".htm") return stripHtml(readFileSync(filePath, "utf8"));
  if (ext === ".docx") {
    try {
      const py = "import sys; from docx import Document; d=Document(sys.argv[1]); print(chr(10).join(p.text for p in d.paragraphs))";
      return execSync(`python -c "${py}" "${filePath}"`, { maxBuffer: 32 * 1024 * 1024 }).toString("utf8");
    } catch (e) { console.error("docx extract failed:", e.message); return ""; }
  }
  return "";
}

function chunkText(text, targetLen = 1400) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const chunks = [];
  const sentences = clean.split(/(?<=[.!?])\s+/);
  let buf = "";
  for (const s of sentences) {
    if ((buf + " " + s).length > targetLen && buf.length > 0) {
      chunks.push(buf.trim());
      buf = s;
    } else {
      buf = buf ? buf + " " + s : s;
    }
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks;
}

function slugFromUrl(url) {
  return url.replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80).toLowerCase();
}

const STOP = new Set("a an the and or but if then of for in on at to from by with as is are was were be been being it its this that these those which who whom whose what when where why how not no so nor can could shall should may might must will would about".split(/\s+/));
function termsFrom(text) {
  const terms = text.toLowerCase().replace(/[^a-z0-9\s]+/g, " ").split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w));
  return [...new Set(terms)].slice(0, 80);
}

function authGuess(filename) {
  if (filename.includes("model-policy")) return "official_model_policy";
  if (filename.includes("press-release")) return "official_press_release";
  return "official_guidance";
}

function contentKind(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".pdf") return "pdf";
  if (ext === ".docx") return "docx";
  return "html";
}
function contentType(filename) {
  const k = contentKind(filename);
  if (k === "pdf") return "application/pdf";
  if (k === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return "text/html";
}

function main() {
  const existing = readFileSync(CHUNKS, "utf8").trim().split("\n").map((l) => JSON.parse(l));
  const kept = existing.filter((c) => !NEW_STATES.includes(c.state_abbr));
  console.log(`Existing: ${existing.length}; kept after dropping new-state staleness: ${kept.length}`);

  const newEntries = [];
  const files = readdirSync(RAW).filter((f) => NEW_STATES.some((s) => f.startsWith(s + "-")));
  for (const f of files) {
    const fp = path.join(RAW, f);
    const state = f.slice(0, 2);
    const stateName = STATE_NAMES[state];
    const sourceUrl = SOURCE_URLS[f] || `file://${fp}`;
    const title = TITLES[f] || f;
    const text = extractText(fp);
    const chunks = chunkText(text, 1400);
    console.log(`  ${f} -> ${chunks.length} chunks (${text.length} chars)`);
    const base = slugFromUrl(sourceUrl);
    chunks.forEach((t, idx) => {
      newEntries.push({
        chunk_id: `${base}-chunk-${idx}`,
        state_abbr: state,
        state_name: stateName,
        source_url: sourceUrl,
        title,
        published_date_guess: null,
        raw_file: `data/generated/raw/${f}`,
        content_kind: contentKind(f),
        content_type: contentType(f),
        chunk_index: idx,
        text: t,
        source_authority_guess: authGuess(f),
        terms: termsFrom(t)
      });
    });
  }

  const merged = [...kept, ...newEntries];
  writeFileSync(CHUNKS, merged.map((c) => JSON.stringify(c)).join("\n") + "\n");
  console.log(`Wrote ${CHUNKS}: ${merged.length} chunks total (+${newEntries.length} new for ${NEW_STATES.join(",")})`);
}
main();
