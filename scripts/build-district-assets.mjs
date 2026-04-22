#!/usr/bin/env node
/**
 * Build per-state school-district TopoJSON for the MVP states.
 *
 * For each state we download the Census TIGER/Line 2023 Unified School
 * District (UNSD) shapefile, simplify it with mapshaper, and emit a
 * lightweight TopoJSON at `public/districts/{CODE}.topo.json`.
 *
 * Output size target: < 500 KB per state after simplification.
 *
 * Usage: node scripts/build-district-assets.mjs
 */
import { mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TMP_DIR = path.join(ROOT, ".tmp-tiger");
const OUT_DIR = path.join(ROOT, "public", "districts");

/** MVP states: FIPS → postal abbreviation. Expand later. */
const STATES = [
  { fips: "01", code: "AL", name: "Alabama" },
  { fips: "06", code: "CA", name: "California" },
  { fips: "36", code: "NY", name: "New York" },
  { fips: "48", code: "TX", name: "Texas" },
  { fips: "53", code: "WA", name: "Washington" }
];

/** Simplification % — Visvalingam weighted area. Lower = smaller file, coarser shape. */
const SIMPLIFY_PERCENT = 8;

async function download(url, outPath) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
  }
  const nodeStream = Readable.fromWeb(res.body);
  await pipeline(nodeStream, createWriteStream(outPath));
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
      ...opts
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
    child.on("error", reject);
  });
}

async function buildState(state) {
  const zipUrl = `https://www2.census.gov/geo/tiger/TIGER2023/UNSD/tl_2023_${state.fips}_unsd.zip`;
  const zipPath = path.join(TMP_DIR, `tl_2023_${state.fips}_unsd.zip`);
  const outPath = path.join(OUT_DIR, `${state.code}.topo.json`);

  console.log(`\n[${state.code}] downloading ${zipUrl}`);
  await download(zipUrl, zipPath);

  console.log(`[${state.code}] simplifying + converting to TopoJSON`);
  // mapshaper can read shapefiles from inside a zip. We keep only
  // GEOID, NAME (district name), UNSDLEA (local id) to trim payload.
  await run("npx", [
    "--yes",
    "mapshaper",
    zipPath,
    "-simplify",
    "visvalingam",
    "weighted",
    `${SIMPLIFY_PERCENT}%`,
    "keep-shapes",
    "-filter-fields",
    "GEOID,NAME,UNSDLEA,STATEFP",
    "-rename-layers",
    `districts_${state.code}`,
    "-o",
    "format=topojson",
    `precision=0.0001`,
    outPath
  ]);

  console.log(`[${state.code}] wrote ${outPath}`);
}

async function main() {
  if (existsSync(TMP_DIR)) {
    await rm(TMP_DIR, { recursive: true, force: true });
  }
  await mkdir(TMP_DIR, { recursive: true });
  await mkdir(OUT_DIR, { recursive: true });

  for (const state of STATES) {
    try {
      await buildState(state);
    } catch (err) {
      console.error(`[${state.code}] FAILED:`, err.message);
      throw err;
    }
  }

  // Write a tiny manifest so the front-end knows which states have district data
  const manifest = {
    generatedAt: new Date().toISOString(),
    simplifyPercent: SIMPLIFY_PERCENT,
    source: "US Census TIGER/Line 2023 UNSD",
    states: STATES.map((s) => ({ code: s.code, fips: s.fips, name: s.name }))
  };
  await writeFile(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n"
  );

  await rm(TMP_DIR, { recursive: true, force: true });
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
