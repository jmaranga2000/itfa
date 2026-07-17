import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getCurrentUser } from "@/features/auth/server";
import { getR2Client, getR2Configuration } from "@/lib/r2";
import { getClientDocumentFile } from "@/repositories/client-portal-repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const principal = await getCurrentUser();
  if (!principal) return new Response("Unauthorized", { status: 401 });
  const { documentId } = await params;
  const record = await getClientDocumentFile(principal, documentId);
  if (!record) return new Response("Not found", { status: 404 });

  try {
    const configuration = getR2Configuration();
    const object = await getR2Client().send(new GetObjectCommand({
      Bucket: configuration.bucketName,
      Key: record.storageKey,
    }));
    if (!object.Body) return new Response("Not found", { status: 404 });
    const bytes = await object.Body.transformToByteArray();
    const filename = record.name.replace(/["\r\n]/g, "-");
    return new Response(Buffer.from(bytes), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": record.contentType,
      },
    });
  } catch {
    return new Response("File unavailable", { status: 404 });
  }
}
