import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/auth/server";
import { listUnreadNotificationsForPrincipal } from "@/repositories/communication-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const principal = await getCurrentUser();
  if (!principal) return NextResponse.json({ notifications: [] }, { status: 401 });
  const notifications = await listUnreadNotificationsForPrincipal(principal, 12);
  return NextResponse.json(
    { notifications },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
