import { notFound } from "next/navigation";
import { TemplateDetail } from "@/components/dashboard/templates/template-detail";
import { requirePermission } from "@/features/auth/server";
import { getTemplateDetail } from "@/repositories/template-repository";

export default async function AdminTemplateDetailPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const [{ templateId }, principal] = await Promise.all([params, requirePermission("templates.read")]);
  const data = await getTemplateDetail(principal, templateId);

  if (!data) {
    notFound();
  }

  return <TemplateDetail data={data} />;
}
