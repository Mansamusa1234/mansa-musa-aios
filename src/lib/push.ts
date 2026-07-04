import webpush from "web-push";
import { db } from "@/lib/db";

const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  ?? process.env.WEB_PUSH_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? process.env.WEB_PUSH_PRIVATE_KEY;
const configured = !!(VAPID_PUBLIC && VAPID_PRIVATE);

if (configured) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:support@example.com",
    VAPID_PUBLIC!,
    VAPID_PRIVATE!
  );
}

export function isPushConfigured(): boolean {
  return configured;
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/** Sends a push notification to every subscription for a user (or all users if userId is omitted). Best-effort -- never throws. Removes subscriptions that report gone (410/404). */
export async function sendPushNotification(payload: PushPayload, userId?: string): Promise<{ sent: number; failed: number }> {
  if (!configured) {
    console.log("[push] VAPID keys not configured -- skipping send:", payload.title);
    return { sent: 0, failed: 0 };
  }

  const subscriptions = await db.pushSubscription.findMany({
    where: userId ? { userId } : {},
  });

  let sent = 0;
  let failed = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
        sent++;
      } catch (err: unknown) {
        failed++;
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error("[push] send failed:", err);
        }
      }
    })
  );

  return { sent, failed };
}
