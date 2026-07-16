import {
  Archive,
  CheckCircle2,
  Clock3,
  FilePenLine,
  History,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getTemplateStatusLabel, type TemplateStatus } from "@/features/templates/types";

function statusTone(status: TemplateStatus) {
  if (status === "published") {
    return "green" as const;
  }

  if (status === "pending_review") {
    return "purple" as const;
  }

  if (status === "superseded") {
    return "gold" as const;
  }

  if (status === "archived") {
    return "dark" as const;
  }

  return "slate" as const;
}

function StatusIcon({ status }: { status: TemplateStatus }) {
  if (status === "published") {
    return <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />;
  }

  if (status === "pending_review") {
    return <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />;
  }

  if (status === "superseded") {
    return <History aria-hidden="true" className="h-3.5 w-3.5" />;
  }

  if (status === "archived") {
    return <Archive aria-hidden="true" className="h-3.5 w-3.5" />;
  }

  return <FilePenLine aria-hidden="true" className="h-3.5 w-3.5" />;
}

export function TemplateStatusBadge({ status }: { status: TemplateStatus }) {
  const label = getTemplateStatusLabel(status);

  return (
    <Badge className="gap-1.5" title={label} tone={statusTone(status)}>
      <StatusIcon status={status} />
      {label}
    </Badge>
  );
}
