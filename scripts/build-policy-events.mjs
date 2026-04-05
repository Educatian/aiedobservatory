import { fileURLToPath } from "node:url";
import path from "node:path";
import { readPolicyEvents, replacePolicyEvents } from "./lib/policy-events-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

async function main() {
  const runtimeEvents = await readPolicyEvents(projectRoot);
  await replacePolicyEvents(projectRoot, runtimeEvents);
  console.log(
    `Republished ${runtimeEvents.length} policy events from the append-only runtime event log.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
