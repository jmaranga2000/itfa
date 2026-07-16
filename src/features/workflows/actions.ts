"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/auth/server";
import { transitionWorkflowStage } from "@/features/workflows/transition-service";

export async function transitionWorkflowStageAction(formData: FormData) {
  const actor = await requireUser();
  const workflowId = String(formData.get("workflowId") ?? "");
  const nextStageKey = String(formData.get("nextStageKey") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const override = formData.get("override") === "on";

  await transitionWorkflowStage({
    workflowId,
    nextStageKey,
    actor,
    reason,
    override,
  });

  revalidatePath("/admin/workflows");
  revalidatePath(`/admin/workflows/${workflowId}`);
  revalidatePath("/staff/tasks");
  revalidatePath("/client");
}
