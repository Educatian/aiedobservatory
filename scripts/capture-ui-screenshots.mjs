// Capture full-page screenshots of every primary surface in the app for README.
// Run while the dev server (or a built preview) is serving on $SMOKE_BASE.
//
// Output: docs/screenshots/<route-id>.png

import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";

const BASE = process.env.SMOKE_BASE ?? "http://127.0.0.1:5173";
const OUT_DIR = "docs/screenshots";
const VIEWPORT = { width: 1440, height: 900 };

const ROUTES = [
  { id: "01-landing",         path: "/",                   wait: 1500 },
  { id: "02-dashboard-map",   path: "/app#map-view",       wait: 3500 },
  { id: "03-dashboard-compare",     path: "/app#compare",        wait: 3000 },
  { id: "04-dashboard-timeline",    path: "/app#policy-stage",   wait: 3000 },
  { id: "05-dashboard-sources",     path: "/app#source-library", wait: 3000 },
  { id: "06-dashboard-methodology", path: "/app#methodology",    wait: 3000 },
  { id: "07-projectoverview", path: "/projectoverview",    wait: 2000 },
];

function findExe() {
  const home = process.env.USERPROFILE ?? process.env.HOME;
  return `${home}/AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe`;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    executablePath: findExe(),
  });
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    storageState: {
      cookies: [],
      origins: [
        {
          origin: BASE,
          localStorage: [
            {
              name: "academic-sentinel.workspace-session",
              value: JSON.stringify({
                displayName: "Observatory Access",
                email: "workspace@local.aied-policy-atlas",
                organization: "AI Education Policy Observatory Lab",
              }),
            },
            // Suppress the What's New modal so it doesn't cover the dashboard.
            {
              name: "aiedob.whatsNewSeenVersion",
              value: "v9999",
            },
          ],
        },
      ],
    },
  });

  for (const route of ROUTES) {
    const page = await ctx.newPage();
    await page.goto(`${BASE}${route.path}`, { waitUntil: "domcontentloaded", timeout: 25000 });

    // Close the What's New release modal if it auto-opened — its localStorage
    // gate uses the live release version which we don't know up front.
    try {
      await page.locator('button[aria-label="Close what\'s new"]').click({ timeout: 2000 });
    } catch { /* modal not present, fine */ }

    await page.waitForTimeout(route.wait);

    const file = `${OUT_DIR}/${route.id}.png`;
    await page.screenshot({ path: file, fullPage: false });
    console.log(`captured ${file}`);
    await page.close();
  }

  await browser.close();
}

main().catch(err => {
  console.error("screenshot harness error:", err);
  process.exit(2);
});
