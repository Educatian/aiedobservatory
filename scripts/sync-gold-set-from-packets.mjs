import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const goldPath = path.join(projectRoot, "data", "gold-set", "policy-records.gold.json");
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
    if (packet.gold_record && shouldInclude(packet, states)) {
      packets.push(packet.gold_record);
    }
  }

  return packets;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const states = new Set(
    String(args.states ?? "")
      .split(",")
      .map((value) => value.trim().toUpperCase())
      .filter(Boolean)
  );

  const [goldRaw, packetGold] = await Promise.all([
    readFile(goldPath, "utf8"),
    loadPackets(states)
  ]);

  const gold = JSON.parse(goldRaw);

  for (const record of packetGold) {
    const index = gold.findIndex((item) => item.jurisdiction_id === record.jurisdiction_id);
    if (index >= 0) {
      gold[index] = record;
    } else {
      gold.push(record);
    }
  }

  gold.sort((left, right) => String(left.state_abbr).localeCompare(String(right.state_abbr)));
  await writeFile(goldPath, JSON.stringify(gold, null, 2), "utf8");
  console.log(`Synced ${packetGold.length} packet-backed gold record(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
