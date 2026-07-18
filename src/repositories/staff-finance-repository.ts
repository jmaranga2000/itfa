import { Types } from "mongoose";
import type { Principal } from "@/features/authorization/access-control";
import { connectToDatabase } from "@/lib/db/mongoose";
import { ClientPaymentModel } from "@/models/client-payment";
import { listWorkflowsForPrincipal, type WorkflowInstanceRecord } from "@/repositories/workflow-repository";

export type StaffPaymentRecord = {
  id: string;
  workflowId: string;
  engagementReference: string;
  clientName: string;
  amount: number;
  currency: string;
  method: string;
  transactionReference: string;
  status: "pending" | "verified" | "rejected";
  submittedAt: string;
  reviewNote: string;
};

export type StaffFinanceData = {
  workflows: WorkflowInstanceRecord[];
  payments: StaffPaymentRecord[];
};

type RawPayment = {
  _id: Types.ObjectId;
  workflowId: Types.ObjectId;
  amount: number;
  currency: string;
  method: string;
  transactionReference: string;
  status: StaffPaymentRecord["status"];
  submittedAt: Date;
  reviewNote?: string;
};

export async function getStaffFinanceData(principal: Principal): Promise<StaffFinanceData> {
  await connectToDatabase();
  const workflows = await listWorkflowsForPrincipal(principal);
  const workflowIds = workflows
    .map((workflow) => workflow.id)
    .filter(Types.ObjectId.isValid)
    .map((workflowId) => new Types.ObjectId(workflowId));
  const workflowById = new Map(workflows.map((workflow) => [workflow.id, workflow]));
  const storedPayments = workflowIds.length > 0
    ? await ClientPaymentModel.find({ workflowId: { $in: workflowIds } }).sort({ submittedAt: -1 }).lean().exec()
    : [];

  const payments = (storedPayments as unknown as RawPayment[]).map((payment): StaffPaymentRecord => {
    const workflow = workflowById.get(payment.workflowId.toString());
    return {
      id: payment._id.toString(),
      workflowId: payment.workflowId.toString(),
      engagementReference: workflow?.reference ?? "Engagement",
      clientName: workflow?.clientName ?? "Client",
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      transactionReference: payment.transactionReference,
      status: payment.status,
      submittedAt: payment.submittedAt.toISOString(),
      reviewNote: payment.reviewNote ?? "",
    };
  });

  return { workflows, payments };
}
