import { ClientArchive } from "@/components/dashboard/client/client-archive";
import { requireUser } from "@/features/auth/server";
import { getClientArchive } from "@/repositories/client-portal-repository";

export default async function ClientArchivePage() {
  const principal = await requireUser();
  return <ClientArchive workflows={await getClientArchive(principal)} />;
}
