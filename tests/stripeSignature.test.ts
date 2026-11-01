import { describe, expect, test } from "bun:test";
import { hmacSha256 } from "../src/lib/domureva/security/webhook";
import { verifyStripeSignature } from "../src/lib/domureva/payments/stripeSignature";

const SECRET = "whsec_domureva_test_secret";
const NOW = 1793484000;

async function signed(raw: string, timestamp = NOW): Promise<string> {
  const signature = await hmacSha256(SECRET, timestamp + "." + raw);
  return "t=" + timestamp + ",v1=" + signature;
}

describe("Stripe signed webhooks", () => {
  test("accepts a current signed payload", async () => {
    const raw = '{"id":"evt_valid","type":"checkout.session.completed"}';
    expect(await verifyStripeSignature(raw, await signed(raw), SECRET, NOW)).toBe(true);
  });

  test("rejects replayed signatures and malformed timestamps", async () => {
    const raw = '{"id":"evt_replayed"}';
    expect(await verifyStripeSignature(raw, await signed(raw, NOW - 301), SECRET, NOW)).toBe(false);
    expect(await verifyStripeSignature(raw, "t=bad,v1=deadbeef", SECRET, NOW)).toBe(false);
    expect(await verifyStripeSignature(raw, "t=" + NOW + ",v1=deadbeef", SECRET, NOW)).toBe(false);
  });

  test("rejects payload tampering, missing secrets, and invalid signatures", async () => {
    const raw = '{"id":"evt_safe"}';
    const header = await signed(raw);
    expect(await verifyStripeSignature(raw + " ", header, SECRET, NOW)).toBe(false);
    expect(await verifyStripeSignature(raw, header, undefined, NOW)).toBe(false);
    expect(await verifyStripeSignature(raw, null, SECRET, NOW)).toBe(false);
  });

  test("accepts a valid rotated signature among multiple v1 entries", async () => {
    const raw = '{"id":"evt_rotated"}';
    const header = "v1=" + "0".repeat(64) + "," + await signed(raw);
    expect(await verifyStripeSignature(raw, header, SECRET, NOW)).toBe(true);
  });
});
