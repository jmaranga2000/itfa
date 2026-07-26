import { GetObjectCommand } from "@aws-sdk/client-s3";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { getR2Client, getR2Configuration } from "@/lib/r2";
import { ServiceCatalogModel } from "@/models/service-catalog";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ serviceId: string }> },
) {
  const { serviceId } = await params;
  if (!Types.ObjectId.isValid(serviceId)) return new Response("Not found", { status: 404 });
  await connectToDatabase();
  const service = await ServiceCatalogModel.findById(serviceId)
    .select("imageStorageKey imageContentType")
    .lean()
    .exec();
  if (!service?.imageStorageKey) return new Response("Not found", { status: 404 });

  try {
    const configuration = getR2Configuration();
    const object = await getR2Client().send(new GetObjectCommand({
      Bucket: configuration.bucketName,
      Key: service.imageStorageKey,
    }));
    if (!object.Body) return new Response("Not found", { status: 404 });
    const bytes = await object.Body.transformToByteArray();
    return new Response(Buffer.from(bytes), {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "Content-Type": service.imageContentType || object.ContentType || "image/jpeg",
        ...(object.ETag ? { ETag: object.ETag } : {}),
      },
    });
  } catch (error) {
    console.error("Unable to read service image from R2.", error);
    return new Response("Not found", { status: 404 });
  }
}
