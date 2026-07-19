import { ClientDocuments } from "@/components/dashboard/client/client-documents";
import { requireUser } from "@/features/auth/server";
import { getClientDocuments } from "@/repositories/client-portal-repository";
import { listClientEngagementLetters } from "@/repositories/engagement-letter-repository";

export default async function ClientDocumentsPage({ searchParams }: {
  searchParams: Promise<{ uploaded?: string; signed?: string; activation?: string; reviewed?: string; error?: string }>;
}) {
  const principal = await requireUser();
  const [query, documents, letters] = await Promise.all([
    searchParams,
    getClientDocuments(principal),
    listClientEngagementLetters(principal.id),
  ]);
  const notice = query.signed
    ? query.activation === "pending"
      ? "Your signed engagement letter was received. IFTA will complete the engagement activation."
      : "Your signed engagement letter was received and the engagement has been activated."
    : query.reviewed === "approved"
      ? "Your approval was sent to the engagement team."
      : query.reviewed === "changes_requested"
        ? "Your requested changes were sent to the engagement team."
        : query.uploaded
          ? "Your document was uploaded for review."
          : undefined;
  return <ClientDocuments documents={documents} error={query.error} letters={letters} notice={notice} />;
}
