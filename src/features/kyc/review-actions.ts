"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/features/auth/server";
import { approveClientKycSubmission } from "@/repositories/request-onboarding-repository";

export async function approveClientKycSubmissionAction(formData: FormData) {
  const actor = await requireUser();
  const submissionId = String(formData.get("submissionId") ?? "");
  const returnPathValue = String(formData.get("returnPath") ?? "");
  const returnPath = returnPathValue.startsWith("/staff/kyc/")
    ? returnPathValue
    : returnPathValue.startsWith("/admin/kyc/")
      ? returnPathValue
      : `/admin/kyc/${submissionId}`;
  const result = await approveClientKycSubmission(submissionId, actor);
  if (!result.ok) redirect(`${returnPath}?error=${result.reason}`);
  revalidatePath("/admin/kyc");
  revalidatePath("/staff/kyc");
  revalidatePath("/client/kyc");
  revalidatePath("/client/documents");
  revalidatePath("/client/engagement-letters");
  revalidatePath("/admin/engagement-letters");
  redirect(`${returnPath}?approved=1`);
}
