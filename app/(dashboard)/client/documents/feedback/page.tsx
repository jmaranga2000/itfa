import { ClientDocumentFeedback } from "@/components/dashboard/client/client-document-workflows";
import { requireUser } from "@/features/auth/server";
import { getClientDocuments } from "@/repositories/client-portal-repository";

export default async function ClientDocumentFeedbackPage({ searchParams }: { searchParams: Promise<{ responded?: string }> }) {
  const principal = await requireUser();
  const [query, documents] = await Promise.all([searchParams, getClientDocuments(principal)]);
  return <ClientDocumentFeedback documents={documents.filter((document) => document.status === "replacement_requested")} notice={query.responded ? "Your response was sent to the document reviewer." : undefined} />;
}
