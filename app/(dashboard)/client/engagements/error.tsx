"use client";

import { EngagementRouteError } from "@/components/dashboard/engagements/engagement-route-error";

export default function ClientEngagementError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <EngagementRouteError backHref="/client/engagements" reset={reset} />;
}
