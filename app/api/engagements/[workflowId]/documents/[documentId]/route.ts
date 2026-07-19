import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getCurrentUser } from "@/features/auth/server";
import { getR2Client, getR2Configuration } from "@/lib/r2";
import { getEngagementDocumentFile } from "@/repositories/engagement-workspace-repository";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workflowId: string; documentId: string }> },
) {
  const principal = await getCurrentUser();
  if (!principal) return new Response("Unauthorized", { status: 401 });
  const { workflowId, documentId } = await params;
  const record = await getEngagementDocumentFile(principal, documentId);
  if (!record || record.workflowId?.toString() !== workflowId) return new Response("Not found", { status: 404 });
  try {
    const object = await getR2Client().send(new GetObjectCommand({
      Bucket: getR2Configuration().bucketName,
      Key: record.storageKey,
    }));
    if (!object.Body) return new Response("Not found", { status: 404 });
    const bytes = await object.Body.transformToByteArray();
    const filename = record.name.replace(/["\r\n]/g, "-");
    const inline = new URL(request.url).searchParams.get("preview") === "1";
    return new Response(Buffer.from(bytes), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename}"`,
        "Content-Type": record.contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("File unavailable", { status: 404 });
  }
}
