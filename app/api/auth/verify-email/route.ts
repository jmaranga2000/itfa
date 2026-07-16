import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/features/audit/audit-service";
import { createSession } from "@/features/auth/session";
import { verifyEmailToken } from "@/features/auth/email-verification";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const baseUrl = request.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/verify-email/sent?error=missing-token`);
  }

  const principal = await verifyEmailToken(token);

  if (!principal) {
    return NextResponse.redirect(`${baseUrl}/verify-email/sent?error=invalid-token`);
  }

  await createSession(principal.id, {
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: request.headers.get("user-agent"),
  });

  await writeAuditLog({
    actor: principal,
    action: "auth.email_verified_session_created",
    resourceType: "User",
    resourceId: principal.id,
  });

  return NextResponse.redirect(`${baseUrl}/client?verified=1`);
}
