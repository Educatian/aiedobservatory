// Headless smoke test — renders each top-level page and reports any console
// errors, page errors, or failed network requests. Used during the UI rebuild
// to catch runtime regressions that typecheck/build cannot.
//
// Requires playwright-core; chromium binary is sourced from the local
// $HOME/AppData/Local/ms-playwright cache.

import { chromium } from "playwright-core";

const BASE = process.env.SMOKE_BASE ?? "http://127.0.0.1:5173";
const ROUTES = [
  { name: "landing",         path: "/" },
  { name: "developer",       path: "/developer" },
  { name: "projectoverview", path: "/projectoverview" },
  { name: "dashboard map",   path: "/app#map-view" },
  { name: "dashboard compare",     path: "/app#compare" },
  { name: "dashboard timeline",    path: "/app#policy-stage" },
  { name: "dashboard sources",     path: "/app#source-library" },
  { name: "dashboard methodology", path: "/app#methodology" },
];

function findExe() {
  const home = process.env.USERPROFILE ?? process.env.HOME;
  return `${home}/AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe`;
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: findExe(),
  });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: {
      cookies: [],
      origins: [
        {
          origin: BASE,
          localStorage: [
            {
              name: "academic-sentinel.workspace-session",
              value: JSON.stringify({
                displayName: "Smoke Tester",
                email: "smoke@local.aied-policy-atlas",
                organization: "AIED Smoke Lab",
              }),
            },
          ],
        },
      ],
    },
  });

  let totalIssues = 0;

  for (const route of ROUTES) {
    const page = await ctx.newPage();
    const issues = [];
    page.on("console", msg => {
      if (msg.type() === "error" || msg.type() === "warning") {
        issues.push({ kind: msg.type(), text: msg.text() });
      }
    });
    page.on("pageerror", err => {
      issues.push({ kind: "pageerror", text: err.message });
    });
    page.on("requestfailed", req => {
      issues.push({ kind: "requestfailed", text: `${req.url()} (${req.failure()?.errorText})` });
    });
    page.on("response", resp => {
      if (resp.status() >= 400) {
        issues.push({ kind: `http-${resp.status()}`, text: resp.url() });
      }
    });
    page.on("requestfailed", req => {
      issues.push({ kind: "reqfail", text: `${req.url()} ${req.failure()?.errorText ?? ""}` });
    });

    // load + DOM ready is enough; the app polls every 15s so "networkidle"
    // never resolves and would create false-positive timeouts.
    try {
      await page.goto(`${BASE}${route.path}`, { waitUntil: "domcontentloaded", timeout: 20000 });
    } catch (err) {
      issues.push({ kind: "navigation", text: err.message });
    }

    // Let React mount, fetch policy records, run effects.
    await page.waitForTimeout(2500);

    // Check the root rendered something
    const rootHtmlLen = await page.evaluate(() => document.getElementById("root")?.innerHTML.length ?? 0);

    const status = issues.length === 0 ? "OK" : `FAIL (${issues.length})`;
    console.log(`${route.name.padEnd(24)} ${route.path.padEnd(30)} ${String(rootHtmlLen).padStart(7)} bytes  ${status}`);

    for (const issue of issues) {
      const text = issue.text.replace(/\n/g, " ").slice(0, 220);
      console.log(`    [${issue.kind}] ${text}`);
    }

    totalIssues += issues.length;
    await page.close();
  }

  await browser.close();
  console.log(`\nTOTAL ISSUES: ${totalIssues}`);
  process.exit(totalIssues === 0 ? 0 : 1);
}

main().catch(err => {
  console.error("smoke harness error:", err);
  process.exit(2);
});
