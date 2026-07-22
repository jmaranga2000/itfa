"use client";

import { EngagementRouteError } from "@/components/dashboard/engagements/engagement-route-error";

export default function StaffEngagementError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <EngagementRouteError backHref="/staff/engagements" reset={reset} />;
}
