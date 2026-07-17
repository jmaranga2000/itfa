import { ClientDocuments } from "@/components/dashboard/client/client-documents";
import { requireUser } from "@/features/auth/server";
import { getClientDocuments } from "@/repositories/client-portal-repository";

export default async function ClientDocumentsPage({ searchParams }: { searchParams: Promise<{ uploaded?: string }> }) {
  const principal = await requireUser();
  const [query, documents] = await Promise.all([searchParams, getClientDocuments(principal)]);
  return <ClientDocuments documents={documents} notice={query.uploaded ? "Your document was uploaded for review." : undefined} />;
}
