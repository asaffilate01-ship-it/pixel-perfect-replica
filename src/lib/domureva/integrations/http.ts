import { hmacSha256 } from "@/lib/domureva/security/webhook";

export async function signedPost(
  base: string | undefined,
  path: string,
  token: string | undefined,
  payload: unknown,
  signingSecret?: string | undefined,
) {
  if (!base) throw new Error("Integration base URL missing");

  const body = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const eventId = crypto.randomUUID();
  const signature = signingSecret
    ? await hmacSha256(signingSecret, `${timestamp}.${body}`)
    : undefined;

  const r = await fetch(new URL(path, base), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-domureva-event-id": eventId,
      "x-domureva-timestamp": timestamp,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(signature ? { "x-domureva-signature": `sha256=${signature}` } : {}),
    },
    body,
  });

  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Integration ${r.status}: ${text.slice(0, 500)}`);
  }

  return r.json();
}
