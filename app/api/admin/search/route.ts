import { NextResponse } from "next/server";
import { searchAdminPortal } from "@/features/admin/global-search-service";
import { getCurrentUser } from "@/features/auth/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const principal = await getCurrentUser();
  if (!principal) return NextResponse.json({ results: [] }, { status: 401 });
  if (!principal.roleKeys.some((role) => role === "admin" || role === "super_admin")) {
    return NextResponse.json({ results: [] }, { status: 403 });
  }

  const query = new URL(request.url).searchParams.get("q") ?? "";
  const results = await searchAdminPortal(query);
  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
