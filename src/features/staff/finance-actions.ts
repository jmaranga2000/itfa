"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Types } from "mongoose";
import { z } from "zod";
import { requirePermission } from "@/features/auth/server";
import { sendClientJourneyEmail } from "@/features/engagements/client-journey-email";
import { connectToDatabase } from "@/lib/db/mongoose";
import { ClientPaymentModel } from "@/models/client-payment";
import { UserModel } from "@/models/user";
import { WorkflowInstanceModel } from "@/models/workflow-instance";
import { createCommunicationNotification } from "@/repositories/communication-repository";
import { getWorkflowForPrincipal } from "@/repositories/workflow-repository";

const idSchema = z.string().refine(Types.ObjectId.isValid);

async function notifyFinanceClient(input: {
  clientUserId: string | null;
  actorId: string;
  title: string;
  description: string;
  actionUrl: string;
  recordId: string;
  relatedModule: "invoices" | "payments";
}) {
  if (!input.clientUserId || !Types.ObjectId.isValid(input.clientUserId)) return;
  const client = await UserModel.findById(input.clientUserId).select("email firstName lastName").lean().exec();
  if (!client?.email) return;
  const recipientName = `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim() || client.email;
  await Promise.all([
    createCommunicationNotification({
      recipientUserId: input.clientUserId,
      type: "engagement_update",
      title: input.title,
      description: input.description,
      relatedModule: input.relatedModule,
      relatedRecordId: input.recordId,
      actionUrl: input.actionUrl,
      createdByUserId: input.actorId,
    }),
    sendClientJourneyEmail({
      recipientEmail: client.email,
      recipientName,
      title: input.title,
      summary: input.description,
      actionLabel: "Open finance record",
      actionPath: input.actionUrl,
    }),
  ]);
}

export async function approveAndIssueInvoiceAction(formData: FormData) {
  const actor = await requirePermission("invoices.approve");
  const parsedId = idSchema.safeParse(String(formData.get("workflowId") ?? ""));
  if (!parsedId.success) redirect("/staff/invoices?error=invalid");
  await connectToDatabase();
  const visibleWorkflow = await getWorkflowForPrincipal(actor, parsedId.data);
  if (!visibleWorkflow) redirect("/staff/invoices?error=access");
  if (visibleWorkflow.financial.balanceDue <= 0) redirect("/staff/invoices?error=amount");
  const invoiceTask = visibleWorkflow.tasks.find((task) => task.key === "approve_invoice" || (task.stageKey === "finance" && task.assignedRole === "finance_officer"));
  if (!invoiceTask || !["ready", "in_progress", "waiting_for_approval", "overdue"].includes(invoiceTask.status)) {
    redirect("/staff/invoices?error=not-ready");
  }

  const now = new Date();
  await WorkflowInstanceModel.updateOne(
    { _id: parsedId.data },
    {
      $set: {
        "financial.invoiceStatus": "issued",
        "tasks.$[invoiceTask].status": "completed",
        "tasks.$[invoiceTask].completedAt": now,
        "tasks.$[invoiceTask].completedByUserId": actor.id,
        "tasks.$[invoiceTask].completionNotes": "Invoice approved and issued to the client.",
        lastActivityAt: now,
      },
      $push: {
        activity: {
          type: "invoice_issued",
          title: "Invoice approved and issued",
          actorName: actor.email,
          actorUserId: actor.id,
          description: `${visibleWorkflow.financial.currency} ${visibleWorkflow.financial.balanceDue.toLocaleString("en-KE")} issued to the client.`,
          relatedResource: parsedId.data,
          clientVisible: true,
          createdAt: now,
        },
      },
    },
    { arrayFilters: [{ "invoiceTask.key": "approve_invoice" }] },
  ).exec();

  await notifyFinanceClient({
    clientUserId: visibleWorkflow.clientUserId,
    actorId: actor.id,
    title: "Your invoice is ready",
    description: `The invoice for ${visibleWorkflow.serviceName} has been approved and issued.`,
    actionUrl: `/client/invoices/${visibleWorkflow.id}`,
    recordId: visibleWorkflow.id,
    relatedModule: "invoices",
  });
  revalidatePath("/staff/invoices");
  revalidatePath("/staff/tasks");
  revalidatePath("/client/invoices");
  redirect("/staff/invoices?updated=1");
}

export async function reviewClientPaymentAction(formData: FormData) {
  const actor = await requirePermission("payments.reconcile");
  const parsedId = idSchema.safeParse(String(formData.get("paymentId") ?? ""));
  const decision = z.enum(["verified", "rejected"]).safeParse(formData.get("decision"));
  const reviewNote = String(formData.get("reviewNote") ?? "").trim().slice(0, 500);
  if (!parsedId.success || !decision.success) redirect("/staff/payments?error=invalid");
  await connectToDatabase();
  const payment = await ClientPaymentModel.findById(parsedId.data).exec();
  if (!payment || payment.status !== "pending") redirect("/staff/payments?error=missing");
  const workflow = await getWorkflowForPrincipal(actor, payment.workflowId.toString());
  if (!workflow) redirect("/staff/payments?error=access");

  const now = new Date();
  payment.status = decision.data;
  payment.reviewNote = reviewNote || (decision.data === "verified" ? "Payment verified by finance." : "Payment details rejected by finance.");
  payment.verifiedAt = decision.data === "verified" ? now : null;
  await payment.save();

  if (decision.data === "verified") {
    const balanceDue = Math.max(0, workflow.financial.balanceDue - payment.amount);
    await WorkflowInstanceModel.updateOne(
      { _id: workflow.id },
      {
        $set: {
          "financial.balanceDue": balanceDue,
          "financial.invoiceStatus": balanceDue === 0 ? "paid" : "partially_paid",
          "financial.paymentStatus": balanceDue === 0 ? "reconciled" : "partially_allocated",
          lastActivityAt: now,
        },
        $push: { activity: {
          type: "payment_recorded", title: "Payment verified", actorName: actor.email, actorUserId: actor.id,
          description: `${payment.currency} ${payment.amount.toLocaleString("en-KE")} verified.`, relatedResource: payment.transactionReference,
          clientVisible: true, createdAt: now,
        } },
      },
    ).exec();
  } else {
    await WorkflowInstanceModel.updateOne(
      { _id: workflow.id },
      { $set: { "financial.paymentStatus": "failed", lastActivityAt: now } },
    ).exec();
  }

  await notifyFinanceClient({
    clientUserId: workflow.clientUserId,
    actorId: actor.id,
    title: decision.data === "verified" ? "Payment verified" : "Payment details need attention",
    description: decision.data === "verified"
      ? `Your payment of ${payment.currency} ${payment.amount.toLocaleString("en-KE")} has been verified.`
      : (payment.reviewNote || "Please review and resubmit your payment details."),
    actionUrl: "/client/payments",
    recordId: payment._id.toString(),
    relatedModule: "payments",
  });
  revalidatePath("/staff/payments");
  revalidatePath("/staff/invoices");
  revalidatePath("/client/payments");
  revalidatePath("/client/invoices");
  redirect(`/staff/payments?updated=${decision.data}`);
}
