import webpush from "web-push";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { getServerEnv } from "@/lib/env";
import { PushSubscriptionModel } from "@/models/push-subscription";

export type PushAlert = {
  notificationId: string;
  title: string;
  body: string;
  actionUrl: string;
  tag?: string;
};

function pushConfiguration() {
  const env = getServerEnv();
  if (!env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) return null;
  return {
    publicKey: env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
    subject: env.VAPID_SUBJECT,
  };
}

export async function savePushSubscription(input: {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}) {
  if (!Types.ObjectId.isValid(input.userId) || !input.endpoint || !input.p256dh || !input.auth) return false;
  await connectToDatabase();
  await PushSubscriptionModel.updateOne(
    { endpoint: input.endpoint },
    {
      $set: {
        userId: new Types.ObjectId(input.userId),
        keys: { p256dh: input.p256dh, auth: input.auth },
        userAgent: input.userAgent ?? "",
        lastUsedAt: new Date(),
      },
    },
    { upsert: true },
  ).exec();
  return true;
}

export async function removePushSubscription(userId: string, endpoint: string) {
  if (!Types.ObjectId.isValid(userId) || !endpoint) return;
  await connectToDatabase();
  await PushSubscriptionModel.deleteOne({ userId: new Types.ObjectId(userId), endpoint }).exec();
}

export async function sendPushNotificationToUser(userId: string, alert: PushAlert) {
  const configuration = pushConfiguration();
  if (!configuration || !Types.ObjectId.isValid(userId)) return { delivered: 0 };
  await connectToDatabase();
  webpush.setVapidDetails(configuration.subject, configuration.publicKey, configuration.privateKey);
  const subscriptions = await PushSubscriptionModel.find({ userId: new Types.ObjectId(userId) }).lean().exec();
  let delivered = 0;
  await Promise.all(subscriptions.map(async (subscription) => {
    const p256dh = subscription.keys?.p256dh;
    const auth = subscription.keys?.auth;
    if (!p256dh || !auth) return;
    try {
      await webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: { p256dh, auth } },
        JSON.stringify(alert),
        { TTL: 60 * 60 * 24, urgency: "high" },
      );
      delivered += 1;
      await PushSubscriptionModel.updateOne({ _id: subscription._id }, { $set: { lastUsedAt: new Date() } }).exec();
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await PushSubscriptionModel.deleteOne({ _id: subscription._id }).exec();
      } else {
        console.error("Unable to deliver web push notification.", error);
      }
    }
  }));
  return { delivered };
}
