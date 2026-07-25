import { redirect } from "next/navigation";
import { StaffClientDetail } from "@/components/dashboard/staff/staff-client-detail";
import { requireStaffRoute } from "@/features/staff/server";
import { getKycSubmissionDetail } from "@/features/kyc/service";
import { getAdminEngagementLetter } from "@/repositories/engagement-letter-repository";
import { getEngagementExecutionData } from "@/repositories/engagement-execution-repository";
import { getStaffClientRecord } from "@/repositories/staff-work-repository";

export default async function StaffClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientKey: string }>;
  searchParams: Promise<{ engagement?: string; task?: string }>;
}) {
  const [{ principal }, { clientKey }, query] = await Promise.all([
    requireStaffRoute("clients"),
    params,
    searchParams,
  ]);
  const data = await getStaffClientRecord(principal, decodeURIComponent(clientKey));
  if (!data) redirect("/access-blocked");

  const workflow = query.engagement
    ? data.workflows.find((candidate) => candidate.id === query.engagement) ?? null
    : null;
  const task = workflow && query.task
    ? workflow.tasks.find((candidate) => candidate.key === query.task) ?? null
    : null;
  const kycReview = data.reviews.find((review) => review.clientUserId === data.client.userId) ?? null;
  const [kyc, letter, engagement] = await Promise.all([
    kycReview ? getKycSubmissionDetail(`client-kyc-${kycReview.id}`) : Promise.resolve(null),
    workflow?.engagementLetterId ? getAdminEngagementLetter(workflow.engagementLetterId) : Promise.resolve(null),
    workflow ? getEngagementExecutionData(principal, workflow.id) : Promise.resolve(null),
  ]);

  return (
    <StaffClientDetail
      data={data}
      reviewContext={workflow && task ? {
        workflow,
        task,
        kyc,
        letter,
        documents: engagement?.documents ?? [],
        canComplete: task.key === "initial_review" && task.status === "in_progress"
          && (task.assignedUserId === principal.id || principal.roleKeys.includes("engagement_manager")),
      } : null}
    />
  );
}