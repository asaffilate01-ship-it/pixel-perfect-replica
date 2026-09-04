import { supabaseAdmin } from "@/integrations/supabase/client.server";

import { sendEmail } from "./resend.server";
import { renderNotification, type NotificationTemplateKey } from "./templates";

type Channel = "email" | "push" | "in_app";

/**
 * Records a notification delivery attempt and, where the channel supports it,
 * dispatches it. Push transport requires VAPID configuration; without it the
 * delivery is recorded as `skipped` rather than failing the caller.
 */
export async function notifyUser(
  userId: string,
  key: NotificationTemplateKey,
  data: Record<string, string> = {},
  channels: Channel[] = ["in_app", "email"],
) {
  const db = supabaseAdmin;
  const { title, body } = renderNotification(key, data);

  const { data: prefs } = await db
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const results: { channel: Channel; status: string }[] = [];

  for (const channel of channels) {
    if (channel === "email" && prefs && prefs.email === false) {
      results.push({ channel, status: "opted_out" });
      continue;
    }
    if (channel === "push" && prefs && prefs.push === false) {
      results.push({ channel, status: "opted_out" });
      continue;
    }

    let status = "queued";
    let error: string | null = null;

    try {
      if (channel === "email" && data["email"]) {
        const sent = await sendEmail(data["email"], title, `<p>${body}</p>`);
        status = "skipped" in sent && sent["skipped"] ? "skipped" : "sent";
      } else if (channel === "in_app") {
        status = "sent";
      } else {
        status = "skipped";
      }
    } catch (e) {
      status = "failed";
      error = e instanceof Error ? e.message : String(e);
    }

    await db.from("notification_deliveries").insert({
      user_id: userId,
      notification_type: key,
      channel,
      status,
      error,
      delivered_at: status === "sent" ? new Date().toISOString() : null,
    } as never);

    results.push({ channel, status });
  }

  return { title, body, results };
}
