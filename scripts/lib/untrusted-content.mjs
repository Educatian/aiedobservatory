const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions?/i,
  /system\s+prompt/i,
  /developer\s+message/i,
  /reveal\s+(the\s+)?(prompt|secret|api\s*key)/i,
  /call\s+(a\s+)?tool/i,
  /execute\s+(this\s+)?(command|code)/i,
  /change\s+(your\s+)?permissions?/i,
  /exfiltrat/i
];

export function detectInjectionSignals(text) {
  return INJECTION_PATTERNS.filter((pattern) => pattern.test(String(text))).map(
    (pattern) => pattern.source
  );
}

export function wrapUntrustedContent(text, metadata = {}) {
  const normalized = String(text).replace(/<\/UNTRUSTED_SOURCE>/gi, "[escaped boundary]");
  const signals = detectInjectionSignals(normalized);
  const header = JSON.stringify({
    source_url: metadata.sourceUrl ?? null,
    chunk_id: metadata.chunkId ?? null,
    injection_signal_count: signals.length
  });

  return `<UNTRUSTED_SOURCE metadata='${header}'>\n${normalized}\n</UNTRUSTED_SOURCE>`;
}

export function assertAllowedAction(requestedAction, allowedActions) {
  if (!allowedActions.includes(requestedAction)) {
    throw new Error(`Action outside declared scope: ${requestedAction}`);
  }
  return true;
}
