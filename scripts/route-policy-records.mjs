import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyApprovalRouting, loadApprovalPolicy } from "./lib/approval-utils.mjs";
import { appendPolicyEvents, buildPolicyEvent } from "./lib/policy-events-utils.mjs";
import { inferPolicyDomains } from "./lib/policy-extraction-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const canonicalPath = path.join(projectRoot, "data", "canonical", "policy-records.json");

function hasChanged(left, right) {
  return JSON.stringify(left) !== JSON.stringify(right);
}

async function main() {
  const approvalPolicy = await loadApprovalPolicy(projectRoot);
  const raw = await readFile(canonicalPath, "utf8");
  const records = JSON.parse(raw);
  const previousByState = new Map(
    records.map((record) => [
      record.state_abbr,
      {
        confidence: record.confidence ?? null,
        policy_strength: record.policy_strength ?? null,
        implementation_stage: record.implementation_stage ?? null,
        review_status: record.review_status ?? null,
        approval_route: record.approval_route ?? null,
        audit_status: record.audit_status ?? null,
        policy_domains: [...(record.policy_domains ?? [])]
      }
    ])
  );
  const events = [];

  for (const record of records) {
    const previous = previousByState.get(record.state_abbr);
    record.policy_domains = [...new Set([...(record.policy_domains ?? []), ...inferPolicyDomains(record)])];
    applyApprovalRouting(record, approvalPolicy);

    const nextSnapshot = {
      confidence: record.confidence ?? null,
      policy_strength: record.policy_strength ?? null,
      implementation_stage: record.implementation_stage ?? null,
      review_status: record.review_status ?? null,
      approval_route: record.approval_route ?? null,
      audit_status: record.audit_status ?? null,
      policy_domains: [...(record.policy_domains ?? [])]
    };

    if (previous && hasChanged(previous, nextSnapshot)) {
      const occurredAt = new Date().toISOString();
      record.updated_at = occurredAt;

      if (previous.approval_route !== nextSnapshot.approval_route) {
        events.push(
          buildPolicyEvent({
            eventType: "approval_route_changed",
            stateAbbr: record.state_abbr,
            stateName: record.jurisdiction_name,
            occurredAt,
            title: `${record.jurisdiction_name} routed to ${record.approval_route}`,
            description: `Approval route changed from ${previous.approval_route ?? "none"} to ${record.approval_route ?? "none"}.`,
            sourceUrl: record.source_documents?.[0]?.url ?? null,
            approvalRoute: record.approval_route ?? null,
            confidence: record.confidence ?? null,
            previousValue: previous.approval_route,
            nextValue: record.approval_route,
            changedFields: ["approval_route", "audit_status"]
          })
        );
      }

      if (previous.review_status !== nextSnapshot.review_status) {
        events.push(
          buildPolicyEvent({
            eventType: "review_status_changed",
            stateAbbr: record.state_abbr,
            stateName: record.jurisdiction_name,
            occurredAt,
            title: `${record.jurisdiction_name} review status changed`,
            description: `Review status changed from ${previous.review_status ?? "unknown"} to ${record.review_status ?? "unknown"}.`,
            sourceUrl: record.source_documents?.[0]?.url ?? null,
            approvalRoute: record.approval_route ?? null,
            confidence: record.confidence ?? null,
            previousValue: previous.review_status,
            nextValue: record.review_status,
            changedFields: ["review_status"]
          })
        );
      }

      if (previous.confidence !== nextSnapshot.confidence) {
        events.push(
          buildPolicyEvent({
            eventType: "confidence_changed",
            stateAbbr: record.state_abbr,
            stateName: record.jurisdiction_name,
            occurredAt,
            title: `${record.jurisdiction_name} confidence recalculated`,
            description: `Confidence changed from ${previous.confidence ?? "n/a"} to ${record.confidence ?? "n/a"}.`,
            sourceUrl: record.source_documents?.[0]?.url ?? null,
            approvalRoute: record.approval_route ?? null,
            confidence: record.confidence ?? null,
            previousValue: previous.confidence,
            nextValue: record.confidence,
            changedFields: ["confidence"]
          })
        );
      }

      if (previous.implementation_stage !== nextSnapshot.implementation_stage) {
        events.push(
          buildPolicyEvent({
            eventType: "stage_changed",
            stateAbbr: record.state_abbr,
            stateName: record.jurisdiction_name,
            occurredAt,
            title: `${record.jurisdiction_name} stage updated`,
            description: `Policy stage changed from ${previous.implementation_stage ?? "n/a"} to ${record.implementation_stage ?? "n/a"}.`,
            sourceUrl: record.source_documents?.[0]?.url ?? null,
            approvalRoute: record.approval_route ?? null,
            confidence: record.confidence ?? null,
            previousValue: previous.implementation_stage,
            nextValue: record.implementation_stage,
            changedFields: ["implementation_stage"]
          })
        );
      }

      if (previous.policy_strength !== nextSnapshot.policy_strength) {
        events.push(
          buildPolicyEvent({
            eventType: "record_updated",
            stateAbbr: record.state_abbr,
            stateName: record.jurisdiction_name,
            occurredAt,
            title: `${record.jurisdiction_name} policy strength updated`,
            description: `Policy strength moved from ${previous.policy_strength ?? "n/a"} to ${record.policy_strength ?? "n/a"}.`,
            sourceUrl: record.source_documents?.[0]?.url ?? null,
            approvalRoute: record.approval_route ?? null,
            confidence: record.confidence ?? null,
            previousValue: previous.policy_strength,
            nextValue: record.policy_strength,
            changedFields: ["policy_strength"]
          })
        );
      }
    }
  }

  await writeFile(canonicalPath, JSON.stringify(records, null, 2), "utf8");
  await appendPolicyEvents(projectRoot, events);
  console.log(`Routed ${records.length} canonical records using approval-policy.json.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
