import { redirect } from "next/navigation";

export default async function AdminWorkflowDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ workflowId: string }>;
  searchParams: Promise<{ transitionError?: string; transitioned?: string }>;
}) {
  const [{ workflowId }, query] = await Promise.all([params, searchParams]);
  const target = new URLSearchParams({ tab: "overview" });
  if (query.transitionError) target.set("transitionError", query.transitionError);
  if (query.transitioned) target.set("transitioned", query.transitioned);
  redirect(`/admin/active-engagements/${workflowId}?${target.toString()}`);
}
