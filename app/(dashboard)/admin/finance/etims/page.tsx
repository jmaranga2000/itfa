import { EtimsOperationsConsole } from "@/components/dashboard/finance/etims-operations-console";
import { requireUser } from "@/features/auth/server";
import { getEtimsOperations } from "@/repositories/etims-operations-repository";

export default async function AdminEtimsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const [principal, query] = await Promise.all([requireUser(), searchParams]);
  return <EtimsOperationsConsole data={await getEtimsOperations(principal)} query={query} />;
}
