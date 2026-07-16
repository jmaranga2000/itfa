import {
  Archive,
  CheckCircle2,
  Clock3,
  Lock,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getArchiveStatusLabel,
  type ArchiveStatus,
  type LegalHoldStatus,
} from "@/features/archive/types";

function StatusIcon({ status }: { status: ArchiveStatus }) {
  if (status === "legal_hold") {
    return <Lock aria-hidden="true" className="h-3.5 w-3.5" />;
  }

  if (status === "restore_requested" || status === "restored") {
    return <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />;
  }

  if (status === "retention_expired") {
    return <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />;
  }

  if (status === "pending_deletion" || status === "permanently_deleted") {
    return <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />;
  }

  if (status === "read_only") {
    return <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />;
  }

  return <Archive aria-hidden="true" className="h-3.5 w-3.5" />;
}

function statusTone(status: ArchiveStatus) {
  if (status === "legal_hold") {
    return "purple" as const;
  }

  if (status === "restore_requested" || status === "retention_expired") {
    return "gold" as const;
  }

  if (status === "restored") {
    return "green" as const;
  }

  if (status === "pending_deletion" || status === "permanently_deleted") {
    return "red" as const;
  }

  return "slate" as const;
}

export function ArchiveStatusBadge({ status }: { status: ArchiveStatus }) {
  return (
    <Badge className="gap-1.5" tone={statusTone(status)} title={getArchiveStatusLabel(status)}>
      <StatusIcon status={status} />
      {getArchiveStatusLabel(status)}
    </Badge>
  );
}

export function LegalHoldBadge({ status }: { status: LegalHoldStatus | null }) {
  if (!status || status === "released") {
    return <Badge tone="slate">No legal hold</Badge>;
  }

  return (
    <Badge className="gap-1.5" tone="purple">
      <Lock aria-hidden="true" className="h-3.5 w-3.5" />
      {status.replaceAll("_", " ")}
    </Badge>
  );
}
