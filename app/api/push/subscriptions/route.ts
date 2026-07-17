import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/features/auth/server";
import {
  removePushSubscription,
  savePushSubscription,
} from "@/features/communication/push-notifications";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

export async function POST(request: Request) {
  const principal = await getCurrentUser();
  if (!principal) return NextResponse.json({ ok: false }, { status: 401 });
  const parsed = subscriptionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const saved = await savePushSubscription({
    userId: principal.id,
    endpoint: parsed.data.endpoint,
    p256dh: parsed.data.keys.p256dh,
    auth: parsed.data.keys.auth,
    userAgent: request.headers.get("user-agent") ?? "",
  });
  return NextResponse.json({ ok: saved });
}

export async function DELETE(request: Request) {
  const principal = await getCurrentUser();
  if (!principal) return NextResponse.json({ ok: false }, { status: 401 });
  const parsed = z.object({ endpoint: z.string().url() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  await removePushSubscription(principal.id, parsed.data.endpoint);
  return NextResponse.json({ ok: true });
}
