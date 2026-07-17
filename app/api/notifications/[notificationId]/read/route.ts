import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/auth/server";
import { markNotificationRead } from "@/repositories/communication-repository";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ notificationId: string }> },
) {
  const principal = await getCurrentUser();
  if (!principal) return NextResponse.json({ ok: false }, { status: 401 });
  const { notificationId } = await params;
  await markNotificationRead(principal, notificationId);
  return NextResponse.json({ ok: true });
}
