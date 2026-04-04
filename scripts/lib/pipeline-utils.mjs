import path from "node:path";

function extractPrimaryHtml(html) {
  const candidates = [
    /<main\b[^>]*>([\s\S]*?)<\/main>/i,
    /<article\b[^>]*>([\s\S]*?)<\/article>/i,
    /<div\b[^>]*role=["']main["'][^>]*>([\s\S]*?)<\/div>/i,
    /<body\b[^>]*>([\s\S]*?)<\/body>/i
  ];

  let working = html;

  for (const pattern of candidates) {
    const match = working.match(pattern);
    if (match?.[1]) {
      working = match[1];
      break;
    }
  }

  return working
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<aside[\s\S]*?<\/aside>/gi, " ")
    .replace(/<form[\s\S]*?<\/form>/gi, " ");
}

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8216;|&lsquo;/g, "'")
    .replace(/&#8211;|&ndash;/g, "-")
    .replace(/&#8212;|&mdash;/g, "-")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, "\"")
    .replace(/&hellip;/g, "...")
    .replace(/&middot;/g, " ")
    .replace(/&[a-z]+;/gi, " ");
}

export function stripHtml(html) {
  return decodeEntities(extractPrimaryHtml(html))
    .replace(/<[^>]+>/g, " ")
    .replace(/Ã¢â‚¬â„¢/g, "'")
    .replace(/Ã¢â‚¬â€œ/g, "-")
    .replace(/Ã¢â‚¬Å“|Ã¢â‚¬Â/g, "\"")
    .replace(/\b(skip to main content|navigation menu|main menu|utility menu)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sentenceSplit(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 30);
}

export function isLikelyBoilerplateChunk(text) {
  const lower = text.toLowerCase();
  const boilerplateSignals = [
    "skip to main content",
    "search navigation menu",
    "main navigation",
    "toggle navigation",
    "all rights reserved",
    "contact us",
    "sign up for updates",
    "state government websites",
    "utility menu"
  ];

  const matches = boilerplateSignals.filter((signal) => lower.includes(signal)).length;
  const punctuationCount = (text.match(/[.!?]/g) ?? []).length;
  return matches >= 2 || (text.length > 500 && punctuationCount < 2);
}

export function chunkSentences(sentences, maxChars = 650) {
  const chunks = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + " " + sentence).trim().length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
      continue;
    }

    current = `${current} ${sentence}`.trim();
  }

  if (current.length > 0) {
    chunks.push(current.trim());
  }

  return chunks;
}

export function cleanEvidenceQuote(text, maxChars = 320) {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= maxChars) return compact;

  const truncated = compact.slice(0, maxChars);
  const lastBoundary = Math.max(
    truncated.lastIndexOf(". "),
    truncated.lastIndexOf("; "),
    truncated.lastIndexOf(", ")
  );

  if (lastBoundary >= Math.floor(maxChars * 0.55)) {
    return `${truncated.slice(0, lastBoundary + 1).trim()}...`;
  }

  return `${truncated.trim()}...`;
}

export function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

export function scoreChunkAgainstKeywords(chunkText, keywords) {
  const lower = chunkText.toLowerCase();
  let matched = 0;

  for (const keyword of keywords) {
    if (lower.includes(keyword)) matched += 1;
  }

  return matched / Math.max(keywords.length, 1);
}

export function chunkIdFor(sourceUrl, chunkIndex) {
  const slug = sourceUrl
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug}-chunk-${chunkIndex}`;
}

export function absoluteFromProject(projectRoot, relativePath) {
  return path.join(projectRoot, relativePath);
}
