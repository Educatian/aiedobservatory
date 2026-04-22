#!/usr/bin/env node
/**
 * Multi-layer crawler: fetches per-state, per-layer seeds and enriches them
 * with page-extracted titles + meta summaries + date hints, then merges into
 * the canonical policy records.
 *
 * Modes:
 *   --dry            fetch + enrich in memory, skip canonical write
 *   --offline        skip network, use seed data as-is (writes canonical)
 *   (default)        fetch with retries, merge, write canonical + audit log
 *
 * Run:  node scripts/crawl-multi-layer.mjs [--offline|--dry]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");
const SEED_FILE = path.join(REPO, "data/multi-layer-seeds.json");
const CANONICAL = path.join(REPO, "data/canonical/policy-records.json");
const GEN_DIR = path.join(REPO, "data/generated");
const AUDIT_DIR = path.join(REPO, "data/audit");
const HARVEST_FILE = path.join(GEN_DIR, "multi-layer-harvest.json");
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const AUDIT_FILE = path.join(AUDIT_DIR, `crawl-2026Q2-${ts}.json`);

const argv = new Set(process.argv.slice(2));
const OFFLINE = argv.has("--offline");
const DRY = argv.has("--dry");

const FETCH_TIMEOUT_MS = 12_000;
const PER_HOST_DELAY_MS = 800;
const UA = "aiedobservatory-crawler/1.0 (+https://github.com/Educatian/aiedobservatory)";

// Date regexes used on trimmed HTML text
const DATE_PATTERNS = [
  /(?:effective|adopted|issued|published|signed|approved)(?:\s+on)?[:\s]+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
  /(?:effective|adopted|issued|published|signed|approved)(?:\s+on)?[:\s]+(\d{4}-\d{2}-\d{2})/i,
  /\b(\d{4}-\d{2}-\d{2})\b/,
  /\b([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})\b/
];

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickMeta(html, name) {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  const m = html.match(re);
  return m ? m[1].trim() : null;
}

function pickTag(html, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = html.match(re);
  return m ? stripHtml(m[1]).slice(0, 240) : null;
}

function extractDate(text) {
  for (const re of DATE_PATTERNS) {
    const m = text.match(re);
    if (m) {
      const parsed = new Date(m[1]);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10);
      }
    }
  }
  return null;
}

async function fetchWithTimeout(url, ms = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), ms);
  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" }
    });
    const text = resp.ok ? await resp.text() : "";
    return { ok: resp.ok, status: resp.status, text, lastModified: resp.headers.get("last-modified") };
  } catch (err) {
    return { ok: false, status: 0, text: "", error: String(err?.message ?? err) };
  } finally {
    clearTimeout(tid);
  }
}

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function makeDocId(state, layer, seed, idx) {
  if (seed.document_id) return seed.document_id;
  const layerCode = {
    governor_office: "GOV",
    state_agency: "AGY",
    legislature: "LEG",
    legislative_study_body: "LSB",
    k12_district: "K12",
    higher_ed_coordinator: "HEC",
    higher_ed_institution: "HEI"
  }[layer] || "SRC";
  const t = (seed.title || seed.instrument_type || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase();
  return `${state}-${layerCode}-${t || idx + 1}`;
}

async function enrichSeed(state, layer, seed, idx) {
  const base = {
    state_abbr: state,
    layer,
    document_id: makeDocId(state, layer, seed, idx),
    url: seed.url,
    title: seed.title ?? null,
    issuer_name: seed.issuer_name ?? null,
    issuer_level: layer,
    instrument_type: seed.instrument_type ?? null,
    issued_date: seed.issued_date ?? null,
    effective_date: seed.effective_date ?? null,
    status: seed.status ?? "in_effect",
    short_summary: seed.short_summary ?? null,
    published_date_guess: seed.issued_date ?? seed.effective_date ?? null,
    fetch: { ok: false, status: null, error: null }
  };

  if (OFFLINE) {
    base.fetch = { ok: true, status: "offline" };
    return base;
  }

  const resp = await fetchWithTimeout(seed.url);
  base.fetch = { ok: resp.ok, status: resp.status, error: resp.error ?? null };

  if (resp.ok && resp.text) {
    const pageTitle = pickTag(resp.text, "title");
    const metaDesc = pickMeta(resp.text, "description") || pickMeta(resp.text, "og:description");
    const h1 = pickTag(resp.text, "h1");
    const text = stripHtml(resp.text).slice(0, 2000);
    const dateHint = extractDate(text);

    if (!base.title && pageTitle) base.title = pageTitle.slice(0, 160);
    if (!base.short_summary && (metaDesc || h1)) {
      base.short_summary = (metaDesc || h1).slice(0, 280);
    }
    if (!base.issued_date && dateHint) base.issued_date = dateHint;
    if (!base.published_date_guess) base.published_date_guess = dateHint ?? null;

    if (resp.lastModified && !base.published_date_guess) {
      const lm = new Date(resp.lastModified);
      if (!Number.isNaN(lm.getTime())) base.published_date_guess = lm.toISOString().slice(0, 10);
    }
  }
  return base;
}

// Serial fetch with per-host delay
async function run() {
  const seeds = JSON.parse(fs.readFileSync(SEED_FILE, "utf8"));
  const harvest = [];
  const hostLastHit = new Map();

  for (const [state, entry] of Object.entries(seeds.states)) {
    for (const [layer, items] of Object.entries(entry.layers)) {
      for (let i = 0; i < items.length; i++) {
        const seed = items[i];
        const host = hostOf(seed.url);
        const lastHit = hostLastHit.get(host) ?? 0;
        const waitMs = Math.max(0, lastHit + PER_HOST_DELAY_MS - Date.now());
        if (waitMs > 0 && !OFFLINE) await new Promise((r) => setTimeout(r, waitMs));

        const enriched = await enrichSeed(state, layer, seed, i);
        hostLastHit.set(host, Date.now());
        harvest.push(enriched);
        console.log(
          `[${state} ${layer}] ${enriched.fetch.ok ? "✓" : "✗"} ${seed.url}${
            enriched.fetch.error ? ` (${enriched.fetch.error})` : ""
          }`
        );
      }
    }
  }

  fs.mkdirSync(GEN_DIR, { recursive: true });
  fs.writeFileSync(HARVEST_FILE, JSON.stringify(harvest, null, 2) + "\n", "utf8");
  console.log(`\nHarvest written: ${HARVEST_FILE} (${harvest.length} entries)`);

  if (DRY) {
    console.log("Dry run — skipping canonical merge.");
    return;
  }

  // ----- Merge into canonical -----
  const canonical = JSON.parse(fs.readFileSync(CANONICAL, "utf8"));
  const audit = {
    generated_at: new Date().toISOString(),
    mode: OFFLINE ? "offline" : "network",
    per_state: []
  };

  const byState = harvest.reduce((acc, h) => {
    (acc[h.state_abbr] ||= []).push(h);
    return acc;
  }, {});

  for (const [state, items] of Object.entries(byState)) {
    const record = canonical.find((r) => r.state_abbr === state);
    if (!record) {
      console.log(`  skip ${state} — not in canonical`);
      continue;
    }
    const existingUrls = new Set(record.source_documents.map((d) => d.url));
    let added = 0;
    for (const h of items) {
      if (existingUrls.has(h.url)) continue;
      record.source_documents.push({
        url: h.url,
        title: h.title,
        raw_file: null,
        published_date_guess: h.published_date_guess,
        document_id: h.document_id,
        issuer_name: h.issuer_name,
        issuer_level: h.issuer_level,
        instrument_type: h.instrument_type,
        issued_date: h.issued_date,
        effective_date: h.effective_date,
        status: h.status,
        short_summary: h.short_summary,
        relations: []
      });
      added += 1;
    }

    // Confidence nudge when we added ≥3 new instruments across layers
    if (added >= 3) {
      const next = Math.min(0.95, Math.round(((record.confidence ?? 0.5) + 0.03) * 100) / 100);
      audit.per_state.push({
        state,
        added,
        confidence_before: record.confidence,
        confidence_after: next
      });
      record.confidence = next;
    } else {
      audit.per_state.push({ state, added, confidence: record.confidence });
    }
  }

  fs.mkdirSync(AUDIT_DIR, { recursive: true });
  fs.writeFileSync(CANONICAL, JSON.stringify(canonical, null, 2) + "\n", "utf8");
  fs.writeFileSync(AUDIT_FILE, JSON.stringify(audit, null, 2) + "\n", "utf8");
  console.log(`\nCanonical updated: ${CANONICAL}`);
  console.log(`Audit log: ${AUDIT_FILE}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
