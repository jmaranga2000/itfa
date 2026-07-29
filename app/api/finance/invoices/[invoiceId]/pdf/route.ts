import { GetObjectCommand } from "@aws-sdk/client-s3";
import { requireUser } from "@/features/auth/server";
import { getR2Client, getR2Configuration } from "@/lib/r2";
import { getFiscalInvoicePdfAccess } from "@/repositories/fiscal-invoice-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ invoiceId: string }> },
) {
  const [principal, { invoiceId }] = await Promise.all([requireUser(), params]);
  const access = await getFiscalInvoicePdfAccess(principal, invoiceId);
  if (!access) return new Response("Fiscal invoice not found.", { status: 404 });
  const configuration = getR2Configuration();
  const object = await getR2Client().send(new GetObjectCommand({
    Bucket: configuration.bucketName,
    Key: access.storageKey,
  }));
  if (!object.Body) return new Response("Fiscal invoice file not found.", { status: 404 });
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
