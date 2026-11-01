import { hmacSha256, safeEqual } from "@/lib/domureva/security/webhook";

/** Stripe signs `<timestamp>.<raw request body>`; reject stale/replayed payloads. */
export async function verifyStripeSignature(
  raw: string,
  header: string | null,
  secret: string | undefined,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  if (!secret || !header || raw.length > 1_000_000) return false;

  const parts = header.split(",").map((segment) => segment.trim());
  const timestamps = parts.filter((part) => part.startsWith("t=")).map((part) => part.slice(2));
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (timestamps.length !== 1 || !/^\d{10,12}$/.test(timestamps[0] ?? "")) return false;
  const timestamp = Number(timestamps[0]);
  if (!Number.isSafeInteger(timestamp) || Math.abs(nowSeconds - timestamp) > 300) return false;
  if (!signatures.length) return false;

  const digest = await hmacSha256(secret, timestamp + "." + raw);
  return signatures.some((sig) => /^[a-f0-9]{64}$/i.test(sig) && safeEqual(digest, sig.toLowerCase()));
}
