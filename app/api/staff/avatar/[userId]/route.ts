import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getCurrentUser } from "@/features/auth/server";
import { getR2Client, getR2Configuration } from "@/lib/r2";
import { getStaffAvatarRecord } from "@/repositories/staff-profile-repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const [{ userId }, principal] = await Promise.all([params, getCurrentUser()]);
  if (!principal) return new Response("Unauthorized", { status: 401 });
  if (principal.id !== userId && !principal.permissions.includes("staff.read")) {
    return new Response("Forbidden", { status: 403 });
  }

  const avatar = await getStaffAvatarRecord(userId);
  if (!avatar?.avatarKey) return new Response("Not found", { status: 404 });

  try {
    const configuration = getR2Configuration();
    const object = await getR2Client().send(new GetObjectCommand({
      Bucket: configuration.bucketName,
      Key: avatar.avatarKey,
    }));
    if (!object.Body) return new Response("Not found", { status: 404 });
    const bytes = await object.Body.transformToByteArray();
    return new Response(Buffer.from(bytes), {
      headers: {
        "Cache-Control": "private, max-age=3600",
        "Content-Type": avatar.avatarContentType ?? "image/jpeg",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
