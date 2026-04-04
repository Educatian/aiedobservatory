import { access, appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const EVENTS_JSONL_PATH = ["data", "generated", "events.jsonl"];
const PUBLIC_EVENTS_PATH = ["public", "policy-events.json"];

function toPath(projectRoot, segments) {
  return path.join(projectRoot, ...segments);
}

async function pathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function normalizeDate(value) {
  const parsed = new Date(value ?? "");
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }

  return parsed.toISOString();
}

function eventPriority(eventType) {
  switch (eventType) {
    case "record_created":
      return 5;
    case "source_added":
      return 4;
    case "review_status_changed":
      return 3;
    case "approval_route_changed":
      return 3;
    case "stage_changed":
      return 2;
    case "confidence_changed":
      return 2;
    case "record_updated":
    default:
      return 1;
  }
}

export function buildPolicyEvent({
  eventType,
  stateAbbr,
  stateName,
  occurredAt,
  title,
  description,
  sourceUrl = null,
  approvalRoute = null,
  confidence = null,
  previousValue = null,
  nextValue = null,
  changedFields = []
}) {
  const timestamp = normalizeDate(occurredAt);
  const safeState = String(stateAbbr ?? "unknown").toLowerCase();
  const safeType = String(eventType ?? "record_updated");
  const valueSuffix =
    previousValue == null && nextValue == null ? "snapshot" : `${previousValue ?? "na"}-${nextValue ?? "na"}`;

  return {
    id: `${safeState}-${safeType}-${timestamp}-${valueSuffix}`.replace(/[^a-z0-9-:.]/gi, "-"),
    eventType: safeType,
    stateAbbr,
    stateName,
    occurredAt: timestamp,
    title,
    description,
    sourceUrl,
    approvalRoute,
    confidence,
    previousValue,
    nextValue,
    changedFields,
    priority: eventPriority(safeType)
  };
}

export async function readPolicyEvents(projectRoot) {
  const eventsPath = toPath(projectRoot, EVENTS_JSONL_PATH);

  if (!(await pathExists(eventsPath))) {
    return [];
  }

  const raw = await readFile(eventsPath, "utf8");
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime());
}

export async function appendPolicyEvents(projectRoot, events) {
  const normalizedEvents = events
    .filter(Boolean)
    .map((event) => ({
      ...event,
      occurredAt: normalizeDate(event.occurredAt)
    }));

  if (normalizedEvents.length === 0) {
    return [];
  }

  const eventsPath = toPath(projectRoot, EVENTS_JSONL_PATH);
  const publicPath = toPath(projectRoot, PUBLIC_EVENTS_PATH);

  await mkdir(path.dirname(eventsPath), { recursive: true });
  await mkdir(path.dirname(publicPath), { recursive: true });

  const existingEvents = await readPolicyEvents(projectRoot);
  const existingIds = new Set(existingEvents.map((event) => event.id));
  const freshEvents = normalizedEvents.filter((event) => !existingIds.has(event.id));

  if (freshEvents.length === 0) {
    return existingEvents;
  }

  const jsonlPayload = `${freshEvents.map((event) => JSON.stringify(event)).join("\n")}\n`;
  await appendFile(eventsPath, jsonlPayload, "utf8");

  const merged = [...freshEvents, ...existingEvents].sort(
    (left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()
  );

  await writeFile(publicPath, JSON.stringify(merged.slice(0, 240), null, 2), "utf8");
  return merged;
}

export async function replacePolicyEvents(projectRoot, events) {
  const eventsPath = toPath(projectRoot, EVENTS_JSONL_PATH);
  const publicPath = toPath(projectRoot, PUBLIC_EVENTS_PATH);

  await mkdir(path.dirname(eventsPath), { recursive: true });
  await mkdir(path.dirname(publicPath), { recursive: true });

  const sorted = [...events]
    .filter(Boolean)
    .map((event) => ({
      ...event,
      occurredAt: normalizeDate(event.occurredAt)
    }))
    .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime());

  const jsonl = sorted.map((event) => JSON.stringify(event)).join("\n");
  await writeFile(eventsPath, jsonl.length > 0 ? `${jsonl}\n` : "", "utf8");
  await writeFile(publicPath, JSON.stringify(sorted.slice(0, 240), null, 2), "utf8");
}
