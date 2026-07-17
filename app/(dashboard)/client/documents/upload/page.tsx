import { ClientDocumentUpload } from "@/components/dashboard/client/client-document-workflows";
import { requireUser } from "@/features/auth/server";
import { listWorkflowsForPrincipal } from "@/repositories/workflow-repository";

export default async function ClientDocumentUploadPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const principal = await requireUser();
  const [query, workflows] = await Promise.all([searchParams, listWorkflowsForPrincipal(principal)]);
  return <ClientDocumentUpload error={query.error} workflows={workflows} />;
}
