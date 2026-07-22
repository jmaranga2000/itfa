import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getCurrentUser } from "@/features/auth/server";
import { getR2Client, getR2Configuration } from "@/lib/r2";
import { getArchivePackageFile } from "@/repositories/archive-repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ archiveId: string }> },
) {
  const principal = await getCurrentUser();
  if (!principal) return new Response("Unauthorized", { status: 401 });
  const { archiveId } = await params;
  const archivePackage = await getArchivePackageFile(principal, archiveId);
  if (!archivePackage) return new Response("Archive package not found", { status: 404 });
  try {
    const configuration = getR2Configuration();
    const object = await getR2Client().send(new GetObjectCommand({
      Bucket: configuration.bucketName,
      Key: archivePackage.storageKey,
    }));
    if (!object.Body) return new Response("Archive package not found", { status: 404 });
    const fileName = archivePackage.fileName.replace(/["\r\n]/g, "-");
    return new Response(Buffer.from(await object.Body.transformToByteArray()), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": "application/zip",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Archive package is temporarily unavailable", { status: 503 });
  }
}
