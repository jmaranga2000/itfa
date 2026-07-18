import { Types } from "mongoose";
import type { Principal } from "@/features/authorization/access-control";
import { connectToDatabase } from "@/lib/db/mongoose";
import { EngagementLetterModel } from "@/models/engagement-letter";
import { QuotationModel } from "@/models/quotation";
import { listWorkflowsForPrincipal } from "@/repositories/workflow-repository";

export type ClientCalendarEvent = {
  id: string;
  title: string;
  date: string;
  type: "engagement" | "task" | "client_action" | "milestone" | "quotation" | "letter";
  reference: string;
  detail: string;
  href: string;
};

export async function getClientCalendarEvents(principal: Principal): Promise<ClientCalendarEvent[]> {
  if (!Types.ObjectId.isValid(principal.id)) return [];
  await connectToDatabase();
  const [workflows, quotations, letters] = await Promise.all([
    listWorkflowsForPrincipal(principal),
    QuotationModel.find({ clientUserId: principal.id, status: "sent" }).select("number validUntil total currency").lean().exec(),
    EngagementLetterModel.find({
      clientUserId: principal.id,
      status: { $in: ["awaiting_signatures", "partially_signed"] },
    }).select("reference subject expiresAt").lean().exec(),
  ]);
  const events: ClientCalendarEvent[] = [];
  for (const workflow of workflows) {
    if (workflow.dueDate) events.push({ id: `${workflow.id}-due`, title: "Engagement target date", date: workflow.dueDate, type: "engagement", reference: workflow.reference, detail: workflow.serviceName, href: `/client/engagements` });
    for (const task of workflow.tasks) {
      if (task.clientVisible && task.dueDate) events.push({ id: `${workflow.id}-task-${task.key}`, title: task.title, date: task.dueDate, type: "task", reference: workflow.reference, detail: task.description || workflow.serviceName, href: "/client/engagements" });
    }
    for (const action of workflow.clientActions) {
      if (action.dueDate) events.push({ id: `${workflow.id}-action-${action.key}`, title: action.title, date: action.dueDate, type: "client_action", reference: workflow.reference, detail: action.instructions, href: "/client/engagements" });
    }
    for (const milestone of workflow.milestones) {
      if (milestone.date) events.push({ id: `${workflow.id}-milestone-${milestone.key}`, title: milestone.title, date: milestone.date, type: "milestone", reference: workflow.reference, detail: "Engagement milestone", href: "/client/engagements" });
    }
  }
  for (const quotation of quotations) events.push({ id: `quotation-${quotation._id}`, title: "Quotation response due", date: quotation.validUntil.toISOString(), type: "quotation", reference: quotation.number, detail: `${quotation.currency} ${quotation.total.toLocaleString("en-KE")}`, href: `/client/quotations/${quotation._id}` });
  for (const letter of letters) events.push({ id: `letter-${letter._id}`, title: "Sign engagement letter", date: letter.expiresAt.toISOString(), type: "letter", reference: letter.reference, detail: letter.subject, href: `/client/engagement-letters/${letter._id}` });
  return events.sort((left, right) => left.date.localeCompare(right.date));
}
