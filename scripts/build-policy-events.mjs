import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPolicyEvent, replacePolicyEvents } from "./lib/policy-events-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const canonicalPath = path.join(projectRoot, "data", "canonical", "policy-records.json");

function dateMinusMinutes(dateString, minutes) {
  const date = new Date(dateString);
  date.setUTCMinutes(date.getUTCMinutes() - minutes);
  return date.toISOString();
}

async function main() {
  const raw = await readFile(canonicalPath, "utf8");
  const records = JSON.parse(raw)
    .filter((record) => record.extraction_status === "validated")
    .sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime())
    .slice(0, 18);

  const events = [];

  for (const record of records) {
    const updatedAt = record.updated_at ?? new Date().toISOString();
    const topSource = record.source_documents?.[0];

    events.push(
      buildPolicyEvent({
        eventType: "record_updated",
        stateAbbr: record.state_abbr,
        stateName: record.jurisdiction_name,
        occurredAt: dateMinusMinutes(updatedAt, 12),
        title: `${record.jurisdiction_name} coded snapshot refreshed`,
        description: `Policy strength now ${record.policy_strength ?? 0}/16 with ${record.policy_domains?.length ?? 0} coded domains.`,
        sourceUrl: topSource?.url ?? null,
        approvalRoute: record.approval_route ?? null,
        confidence: record.confidence ?? null,
        nextValue: record.policy_strength ?? null,
        changedFields: ["policy_strength", "policy_domains"]
      })
    );

    if ((record.source_documents?.length ?? 0) > 0) {
      events.push(
        buildPolicyEvent({
          eventType: "source_added",
          stateAbbr: record.state_abbr,
          stateName: record.jurisdiction_name,
          occurredAt: dateMinusMinutes(updatedAt, 9),
          title: `Source package attached for ${record.jurisdiction_name}`,
          description: `${record.source_documents.length} official source document${record.source_documents.length === 1 ? "" : "s"} linked into the canonical record.`,
          sourceUrl: topSource?.url ?? null,
          approvalRoute: record.approval_route ?? null,
          confidence: record.confidence ?? null,
          nextValue: record.source_documents.length,
          changedFields: ["source_documents"]
        })
      );
    }

    if (record.approval_route) {
      events.push(
        buildPolicyEvent({
          eventType: "approval_route_changed",
          stateAbbr: record.state_abbr,
          stateName: record.jurisdiction_name,
          occurredAt: dateMinusMinutes(updatedAt, 6),
          title: `${record.jurisdiction_name} routed to ${record.approval_route}`,
          description: `Approval routing classified the state as ${record.approval_route.replace(/_/g, " ")}.`,
          sourceUrl: topSource?.url ?? null,
          approvalRoute: record.approval_route,
          confidence: record.confidence ?? null,
          nextValue: record.approval_route,
          changedFields: ["approval_route", "audit_status"]
        })
      );
    }

    if (typeof record.confidence === "number") {
      events.push(
        buildPolicyEvent({
          eventType: "confidence_changed",
          stateAbbr: record.state_abbr,
          stateName: record.jurisdiction_name,
          occurredAt: dateMinusMinutes(updatedAt, 3),
          title: `${record.jurisdiction_name} confidence recalculated`,
          description: `Confidence is currently ${Math.round(record.confidence * 100)}% based on the latest evidence package.`,
          sourceUrl: topSource?.url ?? null,
          approvalRoute: record.approval_route ?? null,
          confidence: record.confidence,
          nextValue: record.confidence,
          changedFields: ["confidence"]
        })
      );
    }
  }

  await replacePolicyEvents(projectRoot, events);
  console.log(`Built ${events.length} policy events from ${records.length} canonical records.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
