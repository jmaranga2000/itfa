import { AdminPortalSection } from "@/components/dashboard/admin/admin-portal-section";
import { adminPortalSections } from "@/content/admin-portal-sections";

export default function AdminPricingPage() {
  return <AdminPortalSection section={adminPortalSections.pricing} />;
}
