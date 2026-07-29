import { redirect } from "next/navigation";
import { EtimsServiceMappings } from "@/components/dashboard/finance/etims-service-mappings";
import { hasPermission } from "@/features/authorization/access-control";
import { requireUser } from "@/features/auth/server";
import { listEtimsServiceMappings } from "@/repositories/etims-configuration-repository";

export default async function EtimsMappingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const [principal, query] = await Promise.all([requireUser(), searchParams]);
  if (!hasPermission(principal, "etims.mapping.read")) redirect("/access-blocked");
  return <EtimsServiceMappings mappings={await listEtimsServiceMappings()} query={query} />;
}
