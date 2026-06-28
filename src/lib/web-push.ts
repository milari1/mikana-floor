import 'server-only';

import { eq } from 'drizzle-orm';
import webpush from 'web-push';

import { db } from './db';
import { pushSubscriptions } from './db/schema';

export type PushMessage = {
  title: string;
  body: string;
  url?: string;
};

let configured: boolean | null = null;

function ensureConfigured(): boolean {
  if (configured !== null) return configured;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    configured = false;
    return false;
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? 'mailto:ops@mikana.example',
    publicKey,
    privateKey,
  );
  configured = true;
  return true;
}

/** Send a push to every subscription for a user. Prunes dead subscriptions. */
export async function sendPushToUser(
  userId: string,
  message: PushMessage,
): Promise<void> {
  if (!ensureConfigured()) {
    console.info('[push] VAPID not configured; skipping push.');
    return;
  }

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(message),
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Subscription expired/gone — remove it.
          await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.endpoint, sub.endpoint));
        }
      }
    }),
  );
}
