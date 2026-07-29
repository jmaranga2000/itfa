import { GetObjectCommand } from "@aws-sdk/client-s3";
import { requireUser } from "@/features/auth/server";
import { getR2Client, getR2Configuration } from "@/lib/r2";
import { getAdjustmentNotePdfAccess } from "@/repositories/adjustment-note-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ noteId: string }> },
) {
  const [principal, { noteId }] = await Promise.all([requireUser(), params]);
  const access = await getAdjustmentNotePdfAccess(principal, noteId);
  if (!access) return new Response("Fiscal adjustment note not found.", { status: 404 });
  const configuration = getR2Configuration();
  const object = await getR2Client().send(new GetObjectCommand({
    Bucket: configuration.bucketName,
    Key: access.storageKey,
  }));
  if (!object.Body) return new Response("Fiscal adjustment file not found.", { status: 404 });
  const filename = access.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return new Response(Buffer.from(await object.Body.transformToByteArray()), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
