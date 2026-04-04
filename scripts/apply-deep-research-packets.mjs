import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const canonicalPath = path.join(projectRoot, "data", "canonical", "policy-records.json");
const packetDir = path.join(projectRoot, "data", "generated", "deep-research");

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    args[token.slice(2)] = argv[index + 1] ?? true;
    index += 1;
  }
  return args;
}

function shouldInclude(packet, states) {
  if (states.size === 0) return true;
  return states.has(String(packet.state_abbr ?? "").toUpperCase());
}

async function loadPackets(states) {
  const files = await readdir(packetDir);
  const packetFiles = files.filter((name) => name.endsWith(".evidence-packet.json"));
  const packets = [];

  for (const name of packetFiles) {
    const raw = await readFile(path.join(packetDir, name), "utf8");
    const packet = JSON.parse(raw);
    if (shouldInclude(packet, states)) {
      packets.push(packet);
    }
  }

  return packets;
}

function mergeRecord(target, patch, reviewedAt) {
  Object.assign(target, patch);
  target.updated_at = reviewedAt ?? new Date().toISOString();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const states = new Set(
    String(args.states ?? "")
      .split(",")
      .map((value) => value.trim().toUpperCase())
      .filter(Boolean)
  );

  const [canonicalRaw, packets] = await Promise.all([
    readFile(canonicalPath, "utf8"),
    loadPackets(states)
  ]);
  const canonical = JSON.parse(canonicalRaw);

  let applied = 0;
  for (const packet of packets) {
    const target = canonical.find(
      (record) =>
        record.jurisdiction_id === packet.jurisdiction_id ||
        record.state_abbr === packet.state_abbr
    );

    if (!target || !packet.recommended_record) continue;

    mergeRecord(target, packet.recommended_record, packet.reviewed_at);
    applied += 1;
  }

  await writeFile(canonicalPath, JSON.stringify(canonical, null, 2), "utf8");
  console.log(`Applied ${applied} deep-research packet(s) to canonical records.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
