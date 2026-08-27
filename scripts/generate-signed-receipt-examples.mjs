import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runStandaloneAdapter } from "../packages/openpolicy-receipts/examples/standalone-evidence-agent.mjs";
import { runObservatoryAdapter } from "./adapters/observatory-release.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const observatory = await runObservatoryAdapter();
const standalone = runStandaloneAdapter();

await Promise.all([
  writeFile(
    path.join(root, "data/release/v0.1/signed-action-receipt.example.json"),
    JSON.stringify(observatory, null, 2),
    "utf8"
  ),
  writeFile(
    path.join(root, "packages/openpolicy-receipts/examples/standalone-receipt.example.json"),
    JSON.stringify(standalone, null, 2),
    "utf8"
  ),
  writeFile(
    path.join(root, "public/receipt-demo.json"),
    JSON.stringify(observatory, null, 2),
    "utf8"
  )
]);
console.log("Generated two signed receipt adapter examples and the public browser fixture; no private key persisted");
