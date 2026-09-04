import { supabaseAdmin } from "@/integrations/supabase/client.server";

import { idempotencyKey } from "../security/webhook";

/**
 * Claims a webhook event so the same delivery is never processed twice.
 * Returns `duplicate: true` when this provider/event pair was already seen.
 */
export async function beginWebhook(provider: string, eventId: string) {
  const db = supabaseAdmin;
  const key = idempotencyKey(provider, eventId);
  const { error } = await db
    .from("integration_idempotency")
    .insert({ key, provider, event_id: eventId } as never);
  if (error && error.code === "23505") return { duplicate: true as const, key, db };
  if (error) throw error;
  return { duplicate: false as const, key, db };
}

export async function finishWebhook(
  db: typeof supabaseAdmin,
  key: string,
  outcome: unknown,
) {
  await db
    .from("integration_idempotency")
    .update({ processed_at: new Date().toISOString(), outcome } as never)
    .eq("key", key);
}
