"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/features/auth/server";
import { transitionWorkflowStage } from "@/features/workflows/transition-service";
import { AppError } from "@/lib/errors";

function workflowReturnPath(formData: FormData, workflowId: string) {
  const supplied = String(formData.get("returnPath") ?? "");
  const allowed = [
    `/admin/active-engagements/${workflowId}`,
    `/admin/workflows/${workflowId}`,
    `/staff/engagements/${workflowId}`,
  ];
  return allowed.includes(supplied) ? supplied : allowed[0];
}

export async function transitionWorkflowStageAction(formData: FormData) {
  const actor = await requireUser();
  const workflowId = String(formData.get("workflowId") ?? "");
  const nextStageKey = String(formData.get("nextStageKey") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const override = formData.get("override") === "on";
  const returnPath = workflowReturnPath(formData, workflowId);

  let transitionError = "";

  try {
    await transitionWorkflowStage({
      workflowId,
      nextStageKey,
      actor,
      reason,
      override,
    });
  } catch (error) {
    if (error instanceof AppError && error.status < 500) {
      transitionError = error.message;
    } else {
      console.error("Unable to advance workflow stage.", error);
      transitionError = "The workflow could not be advanced right now. Review the required items and try again.";
    }
  }

  if (transitionError) {
    redirect(`${returnPath}?tab=overview&transitionError=${encodeURIComponent(transitionError)}`);
  }

  revalidatePath("/admin/workflows");
  revalidatePath(`/admin/workflows/${workflowId}`);
  revalidatePath("/admin/active-engagements");
  revalidatePath(`/admin/active-engagements/${workflowId}`);
  revalidatePath(`/staff/engagements/${workflowId}`);
  revalidatePath(`/client/engagements/${workflowId}`);
  revalidatePath("/staff/tasks");
  revalidatePath("/client");
  redirect(`${returnPath}?tab=overview&transitioned=1`);
}
