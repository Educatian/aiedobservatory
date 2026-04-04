import { classifySourceDocument } from "./approval-utils.mjs";
import { cleanEvidenceQuote, scoreChunkAgainstKeywords, tokenize } from "./pipeline-utils.mjs";

export const fieldKeywords = {
  ai_use_allowed: ["artificial intelligence", "generative ai", "use", "integration", "schools"],
  assessment_policy: ["assessment", "academic integrity", "disclosure", "student work", "testing"],
  privacy_policy: ["privacy", "student data", "data privacy", "vendor", "protection"],
  teacher_pd_support: ["professional learning", "teacher", "educator", "training", "support"],
  implementation_stage: ["guidance", "framework", "implementation", "recommendations", "released"]
};

export const fieldBounds = {
  ai_use_allowed: [0, 3],
  assessment_policy: [0, 3],
  privacy_policy: [0, 3],
  teacher_pd_support: [0, 3],
  implementation_stage: [0, 4]
};

export function parseJsonLines(raw) {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

export function clampInt(value, min, max) {
  if (value == null || Number.isNaN(Number(value))) return null;
  return Math.max(min, Math.min(max, Math.round(Number(value))));
}

export function computePolicyStrength(record) {
  return (
    (record.ai_use_allowed ?? 0) +
    (record.assessment_policy ?? 0) +
    (record.privacy_policy ?? 0) +
    (record.teacher_pd_support ?? 0) +
    (record.implementation_stage ?? 0)
  );
}

export function inferPolicyDomains(record) {
  const domains = [];

  if (Number(record.ai_use_allowed ?? 0) > 0) domains.push("ai_use");
  if (Number(record.assessment_policy ?? 0) > 0) {
    domains.push("assessment");
    if (Number(record.assessment_policy ?? 0) >= 2) domains.push("academic_integrity");
  }
  if (Number(record.privacy_policy ?? 0) > 0) domains.push("privacy");
  if (Number(record.teacher_pd_support ?? 0) > 0) domains.push("teacher_pd");
  if (Number(record.implementation_stage ?? 0) >= 3) domains.push("governance");

  return [...new Set(domains)];
}

export function dedupeEvidence(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.field}:${item.quote}:${item.source_url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function relevantChunksForRecord(record, allChunks) {
  const sourceUrls = new Set(record.source_documents.map((source) => source.url));
  return allChunks.filter(
    (chunk) => chunk.state_abbr === record.state_abbr || sourceUrls.has(chunk.source_url)
  );
}

function getIdf(term, retrievalIndex, fallbackChunkCount) {
  const df = retrievalIndex?.term_document_frequency?.[term] ?? 0;
  return Math.log((1 + fallbackChunkCount) / (1 + df)) + 1;
}

function buildFieldQuery(record, field, keywords) {
  return [
    ...keywords,
    record.jurisdiction_name,
    record.state_abbr,
    "artificial intelligence",
    "education"
  ]
    .flatMap((value) => tokenize(value))
    .filter(Boolean);
}

function scoreChunkTfidf(chunk, queryTerms, retrievalIndex, fallbackChunkCount) {
  const chunkTerms = Array.isArray(chunk.terms) && chunk.terms.length > 0 ? chunk.terms : tokenize(chunk.text);
  if (chunkTerms.length === 0 || queryTerms.length === 0) return 0;

  const termSet = new Set(chunkTerms);
  let score = 0;
  for (const term of queryTerms) {
    if (!termSet.has(term)) continue;
    score += getIdf(term, retrievalIndex, fallbackChunkCount);
  }

  return score / queryTerms.length;
}

function authorityBoost(chunk) {
  const authority =
    chunk.source_authority_guess ??
    classifySourceDocument({ url: chunk.source_url, title: chunk.title ?? null });

  switch (authority) {
    case "binding_law_or_regulation":
      return 0.28;
    case "official_guidance":
      return 0.22;
    case "official_model_policy":
      return 0.18;
    case "official_press_release":
      return 0.08;
    default:
      return 0;
  }
}

function titleBoost(chunk, keywords) {
  const title = String(chunk.title ?? "").toLowerCase();
  const matches = keywords.filter((keyword) => title.includes(keyword)).length;
  return matches === 0 ? 0 : Math.min(0.16, matches * 0.04);
}

function metadataBoost(chunk, field) {
  const text = `${String(chunk.title ?? "").toLowerCase()} ${String(chunk.content_kind ?? "").toLowerCase()}`;
  if (field === "implementation_stage" && /(guidance|framework|roadmap|recommendation)/.test(text)) {
    return 0.08;
  }
  if (field === "privacy_policy" && /(privacy|student data)/.test(text)) {
    return 0.08;
  }
  if (field === "teacher_pd_support" && /(professional learning|educator)/.test(text)) {
    return 0.08;
  }
  return 0;
}

export function pickTopChunksByField(record, allChunks, retrievalIndex = null, limitPerField = 3) {
  const relevantChunks = relevantChunksForRecord(record, allChunks);
  const picked = new Map();
  const fallbackChunkCount = allChunks.length || 1;

  for (const [field, keywords] of Object.entries(fieldKeywords)) {
    const queryTerms = buildFieldQuery(record, field, keywords);
    const ranked = relevantChunks
      .map((chunk) => ({
        ...chunk,
        field_hint: field,
        keyword_score: scoreChunkAgainstKeywords(chunk.text, keywords),
        tfidf_score: scoreChunkTfidf(chunk, queryTerms, retrievalIndex, fallbackChunkCount),
        authority_boost: authorityBoost(chunk),
        title_boost: titleBoost(chunk, keywords),
        metadata_boost: metadataBoost(chunk, field)
      }))
      .map((chunk) => ({
        ...chunk,
        relevance:
          chunk.keyword_score * 0.45 +
          chunk.tfidf_score * 0.35 +
          chunk.authority_boost +
          chunk.title_boost +
          chunk.metadata_boost
      }))
      .filter((chunk) => chunk.relevance > 0.05)
      .sort((a, b) => b.relevance - a.relevance || a.chunk_index - b.chunk_index)
      .slice(0, limitPerField);

    for (const chunk of ranked) {
      if (!picked.has(chunk.chunk_id)) picked.set(chunk.chunk_id, chunk);
    }
  }

  return [...picked.values()];
}

export function normalizeEvidenceSpans(items) {
  if (!Array.isArray(items)) return [];

  return dedupeEvidence(
    items
      .filter((item) => item?.field && item?.quote && item?.source_url)
      .map((item) => ({
        field: item.field,
        quote: cleanEvidenceQuote(item.quote),
        source_url: item.source_url,
        chunk_id: item.chunk_id ?? null
      }))
  );
}
