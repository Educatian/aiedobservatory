import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const seedsPath = path.join(projectRoot, "data", "source-seeds.json");
const outputDir = path.join(projectRoot, "data", "generated");
const rawDir = path.join(outputDir, "raw");
const manifestPath = path.join(outputDir, "policy-source-manifest.json");

const discoveryKeywords = [
  "artificial intelligence",
  "generative ai",
  "ai framework",
  "ai guidance",
  "ai policy",
  "academic integrity",
  "student data",
  "privacy",
  "educator",
  "learner",
  "schools"
];

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8211;|&ndash;/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html) {
  const match = html.match(/<title>(.*?)<\/title>/i);
  return match?.[1]?.trim() ?? null;
}

function extractPublishedDate(text) {
  const patterns = [
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/,
    /\b(?:Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?\s+\d{1,2},\s+\d{4}\b/,
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }

  return null;
}

function makeSlug(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sanitizeBinaryName(url, suffix) {
  return makeSlug(url).slice(0, 120) + suffix;
}

function normalizeUrl(baseUrl, href) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function officialSiblingHost(baseHost, candidateHost) {
  if (baseHost === candidateHost) return true;
  const baseGov = baseHost.endsWith(".gov");
  const candidateGov = candidateHost.endsWith(".gov");
  const assetPrefixes = ["go.", "files.", "cdn.", "content."];

  if (baseGov && candidateGov) {
    return assetPrefixes.some((prefix) => candidateHost.startsWith(prefix));
  }

  return false;
}

function sameHost(urlA, urlB) {
  try {
    return officialSiblingHost(new URL(urlA).host, new URL(urlB).host);
  } catch {
    return false;
  }
}

function linkScore(text, url) {
  const lower = `${text} ${url}`.toLowerCase();
  let score = 0;

  for (const keyword of discoveryKeywords) {
    if (lower.includes(keyword)) score += 2;
  }

  if (lower.includes(".pdf")) score += 3;
  if (lower.includes("framework")) score += 2;
  if (lower.includes("guide")) score += 2;
  if (lower.includes("policy")) score += 1;
  if (lower.includes("recommendation")) score += 1;
  if (lower.includes("artificialintelligence")) score += 2;

  return score;
}

function extractCandidateLinks(html, baseUrl, seed) {
  const anchors = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];

  return anchors
    .map((match) => {
      const href = match[1];
      const anchorText = stripHtml(match[2] ?? "");
      const resolved = normalizeUrl(baseUrl, href);
      if (!resolved) return null;
      if (!sameHost(resolved, seed.url)) return null;
      if (resolved === seed.url || resolved.startsWith(`${seed.url}#`)) return null;

      const lower = resolved.toLowerCase();
      const score = linkScore(anchorText, resolved);
      const isLikelyDocument =
        lower.endsWith(".pdf") ||
        lower.includes(".pdf?") ||
        lower.endsWith(".html") ||
        lower.endsWith(".htm") ||
        lower.endsWith(".php") ||
        lower.includes("/artificialintelligence/") ||
        lower.includes("/ai");

      if (!isLikelyDocument || score < 2) return null;

      return {
        url: resolved,
        anchor_text: anchorText || null,
        score
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .filter((link, index, array) => array.findIndex((item) => item.url === link.url) === index)
    .slice(0, 6);
}

async function fetchUrl(url, referer) {
  const headers = {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf;q=0.8,*/*;q=0.7",
    "accept-language": "en-US,en;q=0.9"
  };

  if (referer) {
    headers.referer = referer;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("application/pdf") || url.toLowerCase().includes(".pdf")) {
    return {
      kind: "pdf",
      contentType,
      body: Buffer.from(await response.arrayBuffer())
    };
  }

  return {
    kind: "html",
    contentType,
    body: await response.text()
  };
}

async function persistFetched(seed, fetched, fileBaseName) {
  const fetchedAt = new Date().toISOString();

  if (fetched.kind === "pdf") {
    const rawFile = path.join(rawDir, `${fileBaseName}.pdf`);
    await writeFile(rawFile, fetched.body);

    return {
      state_abbr: seed.state_abbr,
      state_name: seed.state_name,
      agency: seed.agency,
      region_type: seed.region_type,
      seed_type: seed.seed_type,
      url: seed.url,
      title: seed.title ?? seed.notes ?? null,
      published_date_guess: null,
      fetched_at: fetchedAt,
      raw_file: path.relative(projectRoot, rawFile).replaceAll("\\", "/"),
      notes: seed.notes,
      snippet: null,
      content_kind: "pdf",
      content_type: fetched.contentType || "application/pdf",
      discovered_from: seed.discovered_from ?? null,
      discovery_anchor_text: seed.discovery_anchor_text ?? null
    };
  }

  const html = fetched.body;
  const text = stripHtml(html);
  const title = extractTitle(html);
  const publishedDate = extractPublishedDate(text);
  const snippet = text.slice(0, 1200);
  const rawFile = path.join(rawDir, `${fileBaseName}.html`);

  await writeFile(rawFile, html, "utf8");

  return {
    state_abbr: seed.state_abbr,
    state_name: seed.state_name,
    agency: seed.agency,
    region_type: seed.region_type,
    seed_type: seed.seed_type,
    url: seed.url,
    title,
    published_date_guess: publishedDate,
    fetched_at: fetchedAt,
    raw_file: path.relative(projectRoot, rawFile).replaceAll("\\", "/"),
    notes: seed.notes,
    snippet,
    content_kind: "html",
    content_type: fetched.contentType || "text/html",
    discovered_from: seed.discovered_from ?? null,
    discovery_anchor_text: seed.discovery_anchor_text ?? null
  };
}

function buildDiscoveredSeed(parentSeed, link, index) {
  const lowerUrl = link.url.toLowerCase();
  const seedType =
    lowerUrl.endsWith(".pdf") || lowerUrl.includes(".pdf?")
      ? `${parentSeed.seed_type}_pdf_${index + 1}`
      : `${parentSeed.seed_type}_linked_${index + 1}`;

  return {
    ...parentSeed,
    seed_type: seedType,
    url: link.url,
    notes: `Discovered from ${parentSeed.seed_type}`,
    discovered_from: parentSeed.url,
    discovery_anchor_text: link.anchor_text
  };
}

async function crawlOne(seed, manifest, seenUrls) {
  if (seenUrls.has(seed.url)) return;
  seenUrls.add(seed.url);

  const slug = `${seed.state_abbr}-${makeSlug(seed.seed_type)}`;

  try {
    const fetched = await fetchUrl(seed.url, seed.discovered_from ?? undefined);
    const entry = await persistFetched(seed, fetched, slug);
    manifest.push(entry);
    console.log(`Fetched ${seed.state_abbr} ${seed.seed_type}`);

    if (fetched.kind !== "html") {
      return;
    }

    const links = extractCandidateLinks(fetched.body, seed.url, seed);
    for (const [index, link] of links.entries()) {
      const childSeed = buildDiscoveredSeed(seed, link, index);
      if (seenUrls.has(childSeed.url)) continue;

      try {
        const childFetched = await fetchUrl(childSeed.url, seed.url);
        const childFileBase =
          childFetched.kind === "pdf"
            ? sanitizeBinaryName(childSeed.url, "")
            : `${seed.state_abbr}-${makeSlug(childSeed.seed_type)}`;
        const childEntry = await persistFetched(
          childSeed,
          childFetched,
          childFetched.kind === "pdf" ? childFileBase : childFileBase
        );
        manifest.push(childEntry);
        seenUrls.add(childSeed.url);
        console.log(`Discovered ${seed.state_abbr} ${childSeed.seed_type}`);
      } catch (error) {
        manifest.push({
          ...childSeed,
          fetched_at: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error)
        });
        console.error(`Failed discovered ${seed.state_abbr} ${childSeed.seed_type}`);
      }
    }
  } catch (error) {
    manifest.push({
      ...seed,
      fetched_at: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error)
    });
    console.error(`Failed ${seed.state_abbr} ${seed.seed_type}`);
  }
}

async function main() {
  const seedsRaw = await readFile(seedsPath, "utf8");
  const seeds = JSON.parse(seedsRaw);

  await mkdir(outputDir, { recursive: true });
  await mkdir(rawDir, { recursive: true });

  const manifest = [];
  const seenUrls = new Set();

  for (const seed of seeds) {
    await crawlOne(seed, manifest, seenUrls);
  }

  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`Wrote manifest to ${manifestPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
