import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(projectRoot, "data", "generated", "policy-source-manifest.json");
const canonicalPath = path.join(projectRoot, "data", "canonical", "policy-records.json");
const rawDir = path.join(projectRoot, "data", "generated", "raw");

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    args[token.slice(2)] = argv[index + 1];
    index += 1;
  }
  return args;
}

function makeSlug(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function xmlDecode(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function extractParagraphs(documentXml) {
  const paragraphs = [...documentXml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)]
    .map((match) => {
      const paragraphXml = match[0];
      const texts = [...paragraphXml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)]
        .map((textMatch) => xmlDecode(textMatch[1]))
        .join("")
        .replace(/\s+/g, " ")
        .trim();

      if (!texts) return null;
      return texts;
    })
    .filter(Boolean);

  return paragraphs;
}

function buildHtmlDocument(title, paragraphs) {
  const body = paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("\n");
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
  </head>
  <body>
    <main>
      <article>
        <h1>${title}</h1>
${body}
      </article>
    </main>
  </body>
</html>
`;
}

function ensureRecord(records, stateAbbr, stateName) {
  const existing = records.find((record) => record.state_abbr === stateAbbr);
  if (existing) return existing;

  const newRecord = {
    record_id: `state-${stateAbbr.toLowerCase()}-v1`,
    jurisdiction_id: `state-${stateAbbr.toLowerCase()}`,
    jurisdiction_name: stateName,
    jurisdiction_type: "state",
    parent_jurisdiction_id: null,
    state_abbr: stateAbbr,
    year: null,
    effective_date: null,
    review_status: "pending_review",
    extraction_status: "not_extracted",
    coder_type: null,
    confidence: null,
    policy_strength: null,
    ai_use_allowed: null,
    assessment_policy: null,
    privacy_policy: null,
    teacher_pd_support: null,
    implementation_stage: null,
    policy_orientation: null,
    notes: "Auto-scaffolded from local document ingest; awaiting extraction and review.",
    version: 1,
    updated_at: new Date().toISOString(),
    source_documents: [],
    evidence_spans: []
  };

  records.push(newRecord);
  return newRecord;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const docxPath = args.path;
  const documentXmlPath = args["document-xml"];
  const stateAbbr = args.state;
  const stateName = args["state-name"];
  const agency = args.agency;
  const seedType = args["seed-type"] ?? "local_docx";
  const title = args.title ?? path.basename(docxPath ?? "", path.extname(docxPath ?? ""));
  const url = args.url ?? `local://${makeSlug(`${stateAbbr}-${seedType}-${title}`)}`;
  const sourceLabel = docxPath ? path.basename(docxPath) : path.basename(documentXmlPath);

  if ((!docxPath && !documentXmlPath) || !stateAbbr || !stateName || !agency) {
    throw new Error(
      "Usage: node scripts/import-local-docx.mjs --document-xml <xml> [--path <docx>] --state <abbr> --state-name <name> --agency <agency> [--title <title>] [--seed-type <seed>] [--url <url>]"
    );
  }

  await mkdir(rawDir, { recursive: true });

  if (!documentXmlPath) {
    throw new Error(
      "This script currently requires --document-xml. Extract word/document.xml from the DOCX first, then re-run import."
    );
  }

  const documentXml = await readFile(documentXmlPath, "utf8");
  const paragraphs = extractParagraphs(documentXml);
  if (paragraphs.length === 0) {
    throw new Error("No readable paragraphs were extracted from the DOCX document.");
  }

  const slug = `${stateAbbr}-${makeSlug(seedType)}`;
  const rawFile = path.join(rawDir, `${slug}.html`);
  const html = buildHtmlDocument(title, paragraphs);
  await writeFile(rawFile, html, "utf8");

  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const newManifestEntry = {
    state_abbr: stateAbbr,
    state_name: stateName,
    agency,
    region_type: "state",
    seed_type: seedType,
    url,
    title,
    published_date_guess: null,
    fetched_at: new Date().toISOString(),
    raw_file: path.relative(projectRoot, rawFile).replaceAll("\\", "/"),
    notes: `Imported from local DOCX: ${sourceLabel}`,
    snippet: paragraphs.slice(0, 4).join(" ").slice(0, 1200),
    content_kind: "html",
    content_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    discovered_from: docxPath ?? documentXmlPath,
    discovery_anchor_text: null,
    local_source: true
  };

  const filteredManifest = manifest.filter((entry) => entry.url !== url);
  filteredManifest.push(newManifestEntry);
  await writeFile(manifestPath, JSON.stringify(filteredManifest, null, 2), "utf8");

  const records = JSON.parse(await readFile(canonicalPath, "utf8"));
  const record = ensureRecord(records, stateAbbr, stateName);
  const sourceDocuments = record.source_documents.filter((entry) => entry.url !== url);
  sourceDocuments.push({
    url,
    title,
    raw_file: newManifestEntry.raw_file,
    published_date_guess: null
  });
  record.source_documents = sourceDocuments;
  record.updated_at = new Date().toISOString();
  await writeFile(canonicalPath, JSON.stringify(records, null, 2), "utf8");

  console.log(`Imported local DOCX for ${stateName} into manifest and canonical records.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
