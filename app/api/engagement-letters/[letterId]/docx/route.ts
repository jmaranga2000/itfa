import { getCurrentUser } from "@/features/auth/server";
import { getEngagementLetterDocumentForPrincipal } from "@/features/engagement-letters/document-access";
import {
  engagementLetterFilename,
  renderEngagementLetterDocx,
} from "@/features/engagement-letters/document-service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ letterId: string }> }) {
  const principal = await getCurrentUser();
  if (!principal) return new Response("Unauthorized", { status: 401 });
  const { letterId } = await params;
  const letter = await getEngagementLetterDocumentForPrincipal(principal, letterId);
  if (!letter) return new Response("Not found", { status: 404 });
  const file = await renderEngagementLetterDocx(letter);
  return new Response(new Uint8Array(file), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${engagementLetterFilename(letter, "docx")}"`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
