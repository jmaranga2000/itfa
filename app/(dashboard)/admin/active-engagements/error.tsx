"use client";

import { EngagementRouteError } from "@/components/dashboard/engagements/engagement-route-error";

export default function AdminEngagementError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <EngagementRouteError backHref="/admin/active-engagements" reset={reset} />;
}
