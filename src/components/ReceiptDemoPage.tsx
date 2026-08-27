import { useEffect, useMemo, useState } from "react";
import { AppIcon } from "./AppIcon";

interface ReceiptDemoPageProps {
  onOpenLanding: () => void;
}

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

interface ReceiptSignature {
  algorithm: string;
  key_id: string;
  signed_digest_sha256: string;
  value_base64: string;
}

interface DemoReceipt {
  receipt_version: string;
  receipt_id: string;
  generated_at: string;
  actor: string;
  action: string;
  resource: string;
  authorization: {
    allowed_actions: string[];
    allowed_resources: string[];
    network_access: boolean;
    secrets_access: boolean;
  };
  outputs: Array<{ name: string; sha256: string; [key: string]: JsonValue }>;
  signature: ReceiptSignature;
  [key: string]: JsonValue | ReceiptSignature;
}

interface DemoFixture {
  adapter: string;
  receipt: DemoReceipt;
  public_key_pem: string;
}

interface VerificationResult {
  ok: boolean;
  digestMatches: boolean;
  signatureValid: boolean;
  scopeMatches: boolean;
  computedDigest: string;
  errors: string[];
}

function canonicalize(value: JsonValue): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`)
    .join(",")}}`;
}

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array {
  return new Uint8Array(hex.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? []);
}

function base64ToBytes(value: string): Uint8Array {
  return Uint8Array.from(window.atob(value), (character) => character.charCodeAt(0));
}

function pemToBytes(pem: string): Uint8Array {
  return base64ToBytes(pem.replace(/-----[^-]+-----/g, "").replace(/\s/g, ""));
}

function resourceMatches(resource: string, allowed: string): boolean {
  return allowed === "*" || resource === allowed ||
    (allowed.endsWith("/*") && resource.startsWith(allowed.slice(0, -1)));
}

async function verifyReceipt(receipt: DemoReceipt, publicKeyPem: string): Promise<VerificationResult> {
  const unsigned = structuredClone(receipt) as Record<string, JsonValue>;
  delete unsigned.signature;
  const canonical = canonicalize(unsigned);
  const digestBuffer = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  const digestBytes = new Uint8Array(digestBuffer);
  const computedDigest = bytesToHex(digestBytes);
  const digestMatches = computedDigest === receipt.signature.signed_digest_sha256;
  const scopeMatches = receipt.authorization.allowed_actions.includes(receipt.action) &&
    receipt.authorization.allowed_resources.some((allowed) => resourceMatches(receipt.resource, allowed));

  let signatureValid = false;
  const errors: string[] = [];
  try {
    const publicKey = await window.crypto.subtle.importKey(
      "spki",
      pemToBytes(publicKeyPem),
      { name: "Ed25519" },
      false,
      ["verify"]
    );
    signatureValid = await window.crypto.subtle.verify(
      { name: "Ed25519" },
      publicKey,
      base64ToBytes(receipt.signature.value_base64),
      hexToBytes(receipt.signature.signed_digest_sha256)
    );
  } catch {
    errors.push("browser_signature_verification_failed");
  }

  if (!digestMatches) errors.push("content_digest_mismatch");
  if (!signatureValid) errors.push("signature_verification_failed");
  if (!scopeMatches) errors.push("declared_scope_mismatch");
  return {
    ok: digestMatches && signatureValid && scopeMatches,
    digestMatches,
    signatureValid,
    scopeMatches,
    computedDigest,
    errors: [...new Set(errors)]
  };
}

export function ReceiptDemoPage({ onOpenLanding }: ReceiptDemoPageProps) {
  const [fixture, setFixture] = useState<DemoFixture | null>(null);
  const [tampered, setTampered] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/receipt-demo.json")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<DemoFixture>;
      })
      .then(setFixture)
      .catch((error: Error) => setLoadError(error.message));
  }, []);

  const displayedReceipt = useMemo(() => {
    if (!fixture) return null;
    const next = structuredClone(fixture.receipt);
    if (tampered && next.outputs[0]) {
      const currentHash = next.outputs[0].sha256;
      next.outputs[0].sha256 = `${currentHash[0] === "0" ? "1" : "0"}${currentHash.slice(1)}`;
    }
    return next;
  }, [fixture, tampered]);

  useEffect(() => {
    if (!fixture || !displayedReceipt) return;
    setResult(null);
    void verifyReceipt(displayedReceipt, fixture.public_key_pem).then(setResult);
  }, [fixture, displayedReceipt]);

  return (
    <div className="receipt-demo-shell aied-themed">
      <header className="receipt-demo-topbar">
        <button type="button" className="receipt-demo-brand" onClick={onOpenLanding}>
          <AppIcon className="brand-icon" decorative />
          <span><strong>OpenPolicy Receipts</strong><small>Browser verification demo</small></span>
        </button>
        <nav aria-label="Receipt demo navigation">
          <button type="button" onClick={onOpenLanding}>Observatory home</button>
          <a href="https://github.com/Educatian/aiedobservatory" target="_blank" rel="noreferrer">Source code</a>
        </nav>
      </header>

      <main className="receipt-demo-main">
        <section className="receipt-demo-hero">
          <div>
            <span className="receipt-demo-eyebrow">LOCAL RELEASE CANDIDATE · ED25519</span>
            <h1>Verify the record.<br />Then break it.</h1>
            <p>
              This page performs verification in your browser. It recomputes the canonical
              SHA-256 digest, verifies the Ed25519 signature against the supplied public key,
              and checks the receipt's declared action and resource scope.
            </p>
          </div>
          <div className={`receipt-demo-verdict ${result?.ok ? "is-valid" : result ? "is-invalid" : "is-loading"}`} aria-live="polite" data-testid="receipt-verdict">
            <span className="material-symbols-outlined" aria-hidden="true">
              {result?.ok ? "verified_user" : result ? "gpp_bad" : "progress_activity"}
            </span>
            <strong>{result?.ok ? "Signature and content verified" : result ? "Receipt rejected" : "Verifying receipt…"}</strong>
            <small>{tampered ? "Tampered output hash" : "Signed original fixture"}</small>
          </div>
        </section>

        {loadError ? (
          <div className="receipt-demo-error" role="alert">Could not load the public fixture: {loadError}</div>
        ) : (
          <>
            <section className="receipt-demo-controls" aria-label="Tamper test controls">
              <button type="button" className={!tampered ? "is-selected" : ""} onClick={() => setTampered(false)}>
                Use signed original
              </button>
              <button type="button" className={tampered ? "is-selected receipt-demo-danger" : "receipt-demo-danger"} onClick={() => setTampered(true)}>
                Tamper with output hash
              </button>
              <p>No private key is shipped. The second control changes one hexadecimal character after signing.</p>
            </section>

            <section className="receipt-demo-grid">
              <article className="receipt-demo-card">
                <header><span>01</span><h2>Integrity checks</h2></header>
                <dl className="receipt-demo-checks">
                  <div><dt>Canonical digest</dt><dd data-testid="digest-status">{result?.digestMatches ? "match" : result ? "mismatch" : "checking"}</dd></div>
                  <div><dt>Ed25519 signature</dt><dd>{result?.signatureValid ? "valid" : result ? "invalid" : "checking"}</dd></div>
                  <div><dt>Declared scope</dt><dd>{result?.scopeMatches ? "matches" : result ? "mismatch" : "checking"}</dd></div>
                </dl>
                <p className="receipt-demo-boundary">
                  A valid result proves integrity relative to this supplied public key. It does
                  not prove a real-world actor identity or enforce an agent runtime.
                </p>
              </article>

              <article className="receipt-demo-card">
                <header><span>02</span><h2>Declared action</h2></header>
                <dl className="receipt-demo-metadata">
                  <div><dt>Actor</dt><dd>{displayedReceipt?.actor ?? "Loading"}</dd></div>
                  <div><dt>Action</dt><dd>{displayedReceipt?.action ?? "Loading"}</dd></div>
                  <div><dt>Resource</dt><dd>{displayedReceipt?.resource ?? "Loading"}</dd></div>
                  <div><dt>Network</dt><dd>{displayedReceipt?.authorization.network_access ? "allowed" : "denied"}</dd></div>
                  <div><dt>Secrets</dt><dd>{displayedReceipt?.authorization.secrets_access ? "allowed" : "denied"}</dd></div>
                </dl>
              </article>
            </section>

            <details className="receipt-demo-json">
              <summary>Inspect the exact receipt JSON</summary>
              <pre>{displayedReceipt ? JSON.stringify(displayedReceipt, null, 2) : "Loading…"}</pre>
            </details>

            <section className="receipt-demo-release-note">
              <strong>Evidence boundary</strong>
              <p>
                This is a maintainer-authored browser demonstration using a versioned draft
                fixture. Independent security review, trusted key identity, key rotation, and
                external reproduction remain pending.
              </p>
              <a href="/receipt-demo.json" target="_blank" rel="noreferrer">Open public fixture JSON →</a>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
