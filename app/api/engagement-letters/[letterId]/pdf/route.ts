import { getCurrentUser } from "@/features/auth/server";
import { getEngagementLetterDocumentForPrincipal } from "@/features/engagement-letters/document-access";
import {
  engagementLetterFilename,
  renderEngagementLetterPdf,
} from "@/features/engagement-letters/document-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ letterId: string }> }) {
  const principal = await getCurrentUser();
  if (!principal) return new Response("Unauthorized", { status: 401 });
  const { letterId } = await params;
  const letter = await getEngagementLetterDocumentForPrincipal(principal, letterId);
  if (!letter) return new Response("Not found", { status: 404 });
  const file = await renderEngagementLetterPdf(letter);
  const download = new URL(request.url).searchParams.get("download") === "1";
  return new Response(new Uint8Array(file), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${engagementLetterFilename(letter, "pdf")}"`,
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
