import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadProjectEnv } from "./lib/gemini-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

async function main() {
  await loadProjectEnv(projectRoot);

  const target = process.env.GEMINI_API_KEY
    ? "./extract-policy-records-gemini.mjs"
    : "./extract-policy-records.mjs";

  await import(target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
