export async function hmacSha256(secret: string, body: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export function idempotencyKey(provider: string, eventId: string) {
  return `${provider}:${eventId}`;
}

/** Verifies an `sha256=<hex>` style signature header against the raw request body. */
export async function verifySignature(secret: string | undefined, header: string | null, body: string) {
  if (!secret) return { ok: false, reason: "secret_not_configured" as const };
  if (!header) return { ok: false, reason: "signature_missing" as const };
  const provided = header.startsWith("sha256=") ? header.slice(7) : header;
  const expected = await hmacSha256(secret, body);
  return safeEqual(provided, expected)
    ? { ok: true as const }
    : { ok: false, reason: "signature_mismatch" as const };
}
