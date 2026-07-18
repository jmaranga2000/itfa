import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getCurrentUser } from "@/features/auth/server";
import { getR2Client, getR2Configuration } from "@/lib/r2";
import { getKycStoredDocument } from "@/repositories/kyc-document-repository";
import { canStaffAccessKycSubmission } from "@/repositories/request-onboarding-repository";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const principal = await getCurrentUser();
  if (!principal) return new Response("Unauthorized", { status: 401 });
  const { documentId } = await params;
  const document = await getKycStoredDocument(documentId);
  if (!document) return new Response("Not found", { status: 404 });

  const isAdministrator = principal.roleKeys.some((role) => role === "admin" || role === "super_admin");
  const isOwner = principal.id === document.clientUserId;
  const isAssignedReviewer = principal.id === document.assignedReviewerUserId;
  const hasStaffAccess = !isAdministrator && !isOwner && !isAssignedReviewer
    && principal.permissions.includes("kyc.read")
    && await canStaffAccessKycSubmission(`client-kyc-${document.submissionId}`, principal.id);
  if (!isAdministrator && !isOwner && !isAssignedReviewer && !hasStaffAccess) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const configuration = getR2Configuration();
    const object = await getR2Client().send(new GetObjectCommand({
      Bucket: configuration.bucketName,
      Key: document.r2Key,
    }));
    if (!object.Body) return new Response("Not found", { status: 404 });
    const bytes = await object.Body.transformToByteArray();
    const filename = document.filename.replace(/["\r\n]/g, "-");
    const download = new URL(request.url).searchParams.get("download") === "1";
    return new Response(Buffer.from(bytes), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
        "Content-Type": document.contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Unable to read KYC document from R2.", error);
    return new Response("File unavailable", { status: 404 });
  }
}
