import Link from "next/link";
import { ArrowLeft, MessageSquareText } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { NewClientMessageForm } from "@/components/dashboard/communication/new-client-message-form";
import { buttonClassName } from "@/components/ui/button";
import { requirePermission } from "@/features/auth/server";
import { createClientConversationAction } from "@/features/communication/actions";
import { listRegisteredClientsForAdmin } from "@/repositories/user-repository";

export default async function NewClientMessagePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePermission("messages.send");
  const [clients, query] = await Promise.all([
    listRegisteredClientsForAdmin(),
    searchParams,
  ]);

  return (
    <AdminPageSurface
      actions={
        <Link className={buttonClassName({ variant: "secondary" })} href="/admin/messages">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to messages
        </Link>
      }
      description="Start a secure portal conversation. The client also receives a branded email alert."
      icon={MessageSquareText}
      title="New client message"
    >
      {query.error ? (
        <p className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-800">
          Choose a client and complete the subject and message.
        </p>
      ) : null}
      <NewClientMessageForm action={createClientConversationAction} clients={clients} />
    </AdminPageSurface>
  );
}
