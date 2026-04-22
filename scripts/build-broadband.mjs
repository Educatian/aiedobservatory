#!/usr/bin/env node
/**
 * Build county-level household-broadband-subscription % for the MVP states.
 *
 * Data source: US Census ACS 5-year (2023), table B28002.
 *   B28002_001E = total households
 *   B28002_004E = households with broadband of any type (wired + cellular)
 *
 * We compute pct = 004E / 001E per county and emit:
 *   public/broadband-by-county.json
 *     { generatedAt, source, records: { [countyFips]: { name, state, pct, total } } }
 *
 * Why ACS instead of FCC BDC:
 *   FCC BDC reports "advertised availability" from ISPs. ACS B28002 reports
 *   what percentage of households actually subscribe — which is the metric
 *   that matters for a student trying to use an AI tool at home.
 *
 * Usage: node scripts/build-broadband.mjs
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.join(ROOT, "public", "broadband-by-county.json");

const STATE_FIPS = ["01", "06", "36", "48", "53"];
const STATE_NAME = { "01": "AL", "06": "CA", "36": "NY", "48": "TX", "53": "WA" };

async function fetchACS() {
  const vars = "NAME,B28002_001E,B28002_004E";
  const url = `https://api.census.gov/data/2023/acs/acs5?get=${vars}&for=county:*&in=state:${STATE_FIPS.join(",")}`;
  console.log("GET", url);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Census API ${res.status} ${res.statusText}`);
  }
  const rows = await res.json();
  return rows;
}

async function main() {
  const rows = await fetchACS();
  const [header, ...data] = rows;
  const idx = (k) => header.indexOf(k);
  const iName = idx("NAME");
  const iTotal = idx("B28002_001E");
  const iBB = idx("B28002_004E");
  const iState = idx("state");
  const iCounty = idx("county");

  const records = {};
  for (const row of data) {
    const fipsState = row[iState];
    const fipsCounty = row[iCounty];
    const geoid = `${fipsState}${fipsCounty}`;
    const total = Number(row[iTotal]);
    const bb = Number(row[iBB]);
    const pct = total > 0 ? bb / total : null;
    records[geoid] = {
      name: row[iName],
      state: STATE_NAME[fipsState] || fipsState,
      total,
      withBroadband: bb,
      pct: pct == null ? null : Math.round(pct * 10000) / 10000
    };
  }

  const out = {
    generatedAt: new Date().toISOString(),
    source: "US Census ACS 5-year 2023, table B28002_004E / B28002_001E",
    metric: "Share of households with a broadband internet subscription of any type",
    records
  };
  await writeFile(OUT_PATH, JSON.stringify(out, null, 2) + "\n");

  const counts = Object.values(records);
  const pcts = counts.map((r) => r.pct).filter((p) => p != null);
  console.log(`Wrote ${counts.length} counties to ${OUT_PATH}`);
  console.log(
    `pct range: min=${Math.min(...pcts).toFixed(3)} max=${Math.max(...pcts).toFixed(3)} median=${
      pcts.sort((a, b) => a - b)[Math.floor(pcts.length / 2)].toFixed(3)
    }`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
