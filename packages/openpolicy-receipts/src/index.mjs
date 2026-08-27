import {
  createHash,
  randomUUID,
  sign as cryptoSign,
  verify as cryptoVerify
} from "node:crypto";

const RECEIPT_VERSION = "1.0-draft";
const SIGNATURE_ALGORITHM = "Ed25519";
const LIFECYCLE_EVENTS = new Set(["human_review", "correction", "retirement"]);

function assertJsonValue(value, path = "$") {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError(`${path} contains a non-finite number`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertJsonValue(item, `${path}[${index}]`));
    return;
  }
  if (typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    for (const [key, item] of Object.entries(value)) {
      if (item === undefined) throw new TypeError(`${path}.${key} is undefined`);
      assertJsonValue(item, `${path}.${key}`);
    }
    return;
  }
  throw new TypeError(`${path} is not a JSON value`);
}

export function canonicalize(value) {
  assertJsonValue(value);
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const entries = Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`);
  return `{${entries.join(",")}}`;
}

export function sha256(value) {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(String(value), "utf8");
  return createHash("sha256").update(bytes).digest("hex");
}

export function describeValue(value, mediaType = "application/json") {
  const serialized = mediaType === "application/json" ? canonicalize(value) : String(value);
  return {
    media_type: mediaType,
    bytes: Buffer.byteLength(serialized),
    sha256: sha256(serialized)
  };
}

function normalizeAuthorization(authorization = {}) {
  const allowedActions = [...new Set(authorization.allowed_actions ?? [])].sort();
  const allowedResources = [...new Set(authorization.allowed_resources ?? [])].sort();
  if (allowedActions.length === 0) throw new Error("authorization.allowed_actions is required");
  if (allowedResources.length === 0) throw new Error("authorization.allowed_resources is required");
  return {
    allowed_actions: allowedActions,
    allowed_resources: allowedResources,
    network_access: Boolean(authorization.network_access),
    secrets_access: Boolean(authorization.secrets_access),
    delegated_by: authorization.delegated_by ?? null,
    expires_at: authorization.expires_at ?? null
  };
}

function resourceMatches(resource, allowed) {
  return allowed === "*" || resource === allowed ||
    (allowed.endsWith("/*") && resource.startsWith(allowed.slice(0, -1)));
}

export function isAuthorized(authorization, action, resource, at = new Date()) {
  if (!authorization.allowed_actions.includes(action)) return false;
  if (!authorization.allowed_resources.some((allowed) => resourceMatches(resource, allowed))) return false;
  if (authorization.expires_at && new Date(authorization.expires_at).getTime() < at.getTime()) return false;
  return true;
}

export function assertAuthorized(authorization, action, resource, at = new Date()) {
  if (!isAuthorized(authorization, action, resource, at)) {
    throw new Error(`Unauthorized agent action: ${action} on ${resource}`);
  }
  return true;
}

export function createReceipt({
  receiptId = `opr-${randomUUID()}`,
  generatedAt = new Date().toISOString(),
  actor,
  action,
  resource,
  authorization,
  provenance = {},
  inputs = [],
  outputs = [],
  review = { status: "pending", reviewer: null },
  lifecycle = []
}) {
  if (!actor || !action || !resource) throw new Error("actor, action, and resource are required");
  const normalizedAuthorization = normalizeAuthorization(authorization);
  assertAuthorized(normalizedAuthorization, action, resource, new Date(generatedAt));
  const receipt = {
    receipt_version: RECEIPT_VERSION,
    receipt_id: receiptId,
    generated_at: generatedAt,
    actor,
    action,
    resource,
    authorization: normalizedAuthorization,
    provenance,
    inputs,
    outputs,
    review: {
      status: review.status ?? "pending",
      reviewer: review.reviewer ?? null,
      reviewed_at: review.reviewed_at ?? null
    },
    lifecycle,
    state: lifecycle.some((event) => event.type === "retirement") ? "retired" : "active"
  };
  assertJsonValue(receipt);
  return receipt;
}

export function unsignedReceipt(receipt) {
  const copy = structuredClone(receipt);
  delete copy.signature;
  return copy;
}

export function receiptDigest(receipt) {
  return sha256(canonicalize(unsignedReceipt(receipt)));
}

export function signReceipt(receipt, privateKey, { keyId }) {
  if (!keyId) throw new Error("keyId is required");
  const copy = unsignedReceipt(receipt);
  const digest = receiptDigest(copy);
  const signature = cryptoSign(null, Buffer.from(digest, "hex"), privateKey);
  copy.signature = {
    algorithm: SIGNATURE_ALGORITHM,
    key_id: keyId,
    signed_digest_sha256: digest,
    value_base64: signature.toString("base64")
  };
  return copy;
}

export function verifyReceipt(receipt, publicKey, options = {}) {
  const errors = [];
  const signature = receipt?.signature;
  if (!signature) return { ok: false, errors: ["missing_signature"] };
  if (signature.algorithm !== SIGNATURE_ALGORITHM) errors.push("unsupported_algorithm");
  if (!signature.key_id) errors.push("missing_key_id");
  if (!/^[a-f0-9]{64}$/.test(signature.signed_digest_sha256 ?? "")) errors.push("invalid_digest");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(signature.value_base64 ?? "")) errors.push("invalid_signature_encoding");

  let computedDigest = null;
  try {
    computedDigest = receiptDigest(receipt);
    if (computedDigest !== signature.signed_digest_sha256) errors.push("content_digest_mismatch");
  } catch {
    errors.push("invalid_receipt_content");
  }

  if (options.seenReceiptIds?.has(receipt.receipt_id)) errors.push("replay_detected");
  if (options.maxAgeMs !== undefined) {
    const generated = new Date(receipt.generated_at).getTime();
    const now = options.now ? new Date(options.now).getTime() : Date.now();
    if (!Number.isFinite(generated) || now - generated > options.maxAgeMs) errors.push("stale_receipt");
  }

  if (errors.length === 0) {
    try {
      const ok = cryptoVerify(
        null,
        Buffer.from(computedDigest, "hex"),
        publicKey,
        Buffer.from(signature.value_base64, "base64")
      );
      if (!ok) errors.push("signature_verification_failed");
    } catch {
      errors.push("signature_verification_failed");
    }
  }
  return { ok: errors.length === 0, errors };
}

export function appendLifecycleEvent(receipt, event, privateKey, { keyId }) {
  if (!LIFECYCLE_EVENTS.has(event.type)) throw new Error(`Unsupported lifecycle event: ${event.type}`);
  if (!event.actor || !event.at || !event.reason) {
    throw new Error("Lifecycle events require actor, at, and reason");
  }
  const priorDigest = receiptDigest(receipt);
  const copy = unsignedReceipt(receipt);
  copy.lifecycle = [
    ...(copy.lifecycle ?? []),
    {
      ...event,
      previous_receipt_sha256: priorDigest
    }
  ];
  if (event.type === "human_review") {
    copy.review = { status: event.decision, reviewer: event.actor, reviewed_at: event.at };
  }
  if (event.type === "retirement") copy.state = "retired";
  copy.generated_at = event.at;
  return signReceipt(copy, privateKey, { keyId });
}

export const receiptConstants = {
  receiptVersion: RECEIPT_VERSION,
  signatureAlgorithm: SIGNATURE_ALGORITHM
};
