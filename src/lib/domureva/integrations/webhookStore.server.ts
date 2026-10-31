import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { idempotencyKey } from "../security/webhook";

/**
 * Claims an inbound event. A competing in-flight or unconfirmed delivery
 * must NOT receive a successful duplicate acknowledgement: the sender must
 * retry after the first processing attempt has completed or been released.
 */
export async function beginWebhook(provider: string, eventId: string) {
  if (!provider || !eventId || eventId.length > 255) throw new Error("INVALID_WEBHOOK_ID");
  const db = supabaseAdmin;
  const key = idempotencyKey(provider, eventId);
  const { error } = await db.from("integration_idempotency")
    .insert({ key, provider, event_id: eventId });
  if (error?.code === "23505") {
    const { data, error: lookupError } = await db.from("integration_idempotency")
      .select("processed_at,outcome").eq("key", key).maybeSingle();
    if (lookupError) throw lookupError;
    if (!data?.processed_at || (data.outcome && typeof data.outcome === "object" && !Array.isArray(data.outcome) && data.outcome["ok"] === false)) {
      throw new Error("WEBHOOK_NOT_CONFIRMED");
    }
    return { duplicate: true as const, key, db };
  }
  if (error) throw error;
  return { duplicate: false as const, key, db };
}

export async function finishWebhook(db: typeof supabaseAdmin, key: string, outcome: unknown) {
  const { data, error } = await db.from("integration_idempotency")
    .update({
      processed_at: new Date().toISOString(),
      outcome: JSON.parse(JSON.stringify(outcome)),
    })
    .eq("key", key)
    .select("key")
    .maybeSingle();
  if (error || !data) throw new Error("WEBHOOK_COMPLETION_NOT_SAVED");
}

export async function releaseWebhook(db: typeof supabaseAdmin, key: string) {
  // Release only an unfinished claim. A committed event must remain protected.
  const { error } = await db.from("integration_idempotency")
    .delete().eq("key", key).is("processed_at", null);
  if (error) throw new Error("WEBHOOK_RELEASE_FAILED");
}
