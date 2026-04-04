import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  absoluteFromProject,
  chunkIdFor,
  chunkSentences,
  isLikelyBoilerplateChunk,
  sentenceSplit,
  stripHtml,
  tokenize
} from "./lib/pipeline-utils.mjs";
import { classifySourceDocument } from "./lib/approval-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(projectRoot, "data", "generated", "policy-source-manifest.json");
const outputDir = path.join(projectRoot, "data", "generated");
const chunksPath = path.join(outputDir, "chunks.jsonl");
const indexPath = path.join(outputDir, "retrieval-index.json");

async function main() {
  const manifestRaw = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestRaw).filter(
    (row) => !row.error && row.raw_file && row.content_kind !== "pdf"
  );

  await mkdir(outputDir, { recursive: true });

  const chunkLines = [];
  const termDocumentFrequency = new Map();
  const index = {
    generated_at: new Date().toISOString(),
    chunk_count: 0,
    document_count: manifest.length,
    term_document_frequency: {},
    documents: []
  };

  for (const doc of manifest) {
    const rawHtml = await readFile(absoluteFromProject(projectRoot, doc.raw_file), "utf8");
    const text = stripHtml(rawHtml);
    const sentences = sentenceSplit(text);
    const chunks = chunkSentences(sentences).filter((chunk) => !isLikelyBoilerplateChunk(chunk));

    const docSummary = {
      state_abbr: doc.state_abbr,
      url: doc.url,
      title: doc.title ?? null,
      chunk_count: chunks.length,
      content_kind: doc.content_kind ?? null,
      content_type: doc.content_type ?? null,
      source_authority_guess: classifySourceDocument({
        url: doc.url,
        title: doc.title ?? null
      }),
      published_date_guess: doc.published_date_guess ?? null,
      discovered_from: doc.discovered_from ?? null,
      discovery_anchor_text: doc.discovery_anchor_text ?? null
    };

    index.documents.push(docSummary);

    chunks.forEach((chunkText, chunkIndex) => {
      const terms = [...new Set(tokenize(chunkText))].slice(0, 80);
      const chunk = {
        chunk_id: chunkIdFor(doc.url, chunkIndex),
        state_abbr: doc.state_abbr,
        state_name: doc.state_name,
        source_url: doc.url,
        title: doc.title ?? null,
        published_date_guess: doc.published_date_guess ?? null,
        raw_file: doc.raw_file,
        content_kind: doc.content_kind ?? null,
        content_type: doc.content_type ?? null,
        chunk_index: chunkIndex,
        text: chunkText,
        source_authority_guess: docSummary.source_authority_guess,
        terms
      };

      for (const term of terms) {
        termDocumentFrequency.set(term, (termDocumentFrequency.get(term) ?? 0) + 1);
      }

      chunkLines.push(JSON.stringify(chunk));
      index.chunk_count += 1;
    });
  }

  index.term_document_frequency = Object.fromEntries(
    [...termDocumentFrequency.entries()].sort((left, right) => left[0].localeCompare(right[0]))
  );

  await writeFile(chunksPath, `${chunkLines.join("\n")}\n`, "utf8");
  await writeFile(indexPath, JSON.stringify(index, null, 2), "utf8");

  console.log(`Built evidence index with ${index.chunk_count} chunks across ${index.document_count} documents.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
