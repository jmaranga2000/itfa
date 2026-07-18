import Link from "next/link";
import { ArrowLeft, MessageSquareText } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { NewClientMessageForm } from "@/components/dashboard/communication/new-client-message-form";
import { buttonClassName } from "@/components/ui/button";
import { createStaffClientConversationAction } from "@/features/communication/actions";
import { requireStaffRoute } from "@/features/staff/server";
import { getStaffWorkData } from "@/repositories/staff-work-repository";

export default async function NewStaffMessagePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ principal }, query] = await Promise.all([requireStaffRoute("messages"), searchParams]);
  const data = await getStaffWorkData(principal);
  const clients = data.clients.flatMap((client) => client.userId && client.email ? [{
    id: client.userId,
    email: client.email,
    firstName: client.name,
    lastName: "",
  }] : []);
  return <AdminPageSurface actions={<Link className={buttonClassName({ variant: "secondary" })} href="/staff/messages"><ArrowLeft className="h-4 w-4" />Back to messages</Link>} description="Start a secure conversation with a client assigned to your work." icon={MessageSquareText} title="New client message">
    {query.error ? <p className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-800">{query.error === "unassigned" ? "You can only message clients assigned to your work or KYC queue." : "Choose an assigned client and complete the message."}</p> : null}
    <NewClientMessageForm action={createStaffClientConversationAction} cancelHref="/staff/messages" clients={clients} />
  </AdminPageSurface>;
}
