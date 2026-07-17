import { ClientSharedDocuments } from "@/components/dashboard/client/client-document-workflows";
import { requireUser } from "@/features/auth/server";
import { getClientDocuments } from "@/repositories/client-portal-repository";

export default async function ClientSharedDocumentsPage() {
  const principal = await requireUser();
  const documents = await getClientDocuments(principal);
  return <ClientSharedDocuments documents={documents.filter((document) => document.direction === "received")} />;
}
