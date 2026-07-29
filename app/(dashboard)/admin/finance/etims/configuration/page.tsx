import { redirect } from "next/navigation";
import { EtimsConfigurationForm } from "@/components/dashboard/finance/etims-configuration-form";
import { hasPermission } from "@/features/authorization/access-control";
import { requireUser } from "@/features/auth/server";
import { getEtimsConfiguration } from "@/repositories/etims-configuration-repository";

export default async function EtimsConfigurationPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; test?: string; migrated?: string; review?: string }>;
}) {
  const [principal, query] = await Promise.all([requireUser(), searchParams]);
  if (!hasPermission(principal, "etims.config.read")) redirect("/access-blocked");
  return <EtimsConfigurationForm configuration={await getEtimsConfiguration()} query={query} />;
}
