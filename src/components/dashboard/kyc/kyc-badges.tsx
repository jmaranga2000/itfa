import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock3,
  Eye,
  ShieldAlert,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getKycRequirementStatusLabel,
  getKycRiskLabel,
  getKycStatusLabel,
} from "@/repositories/kyc-repository";
import type {
  KycRequirementStatus,
  KycRiskLevel,
  KycStatus,
} from "@/features/kyc/types";

export function KycStatusBadge({ status }: { status: KycStatus }) {
  const tone =
    status === "approved"
      ? "green"
      : status === "rejected" || status === "expired"
        ? "red"
        : status === "changes_requested" || status === "escalated"
          ? "gold"
          : "teal";

  return <Badge tone={tone}>{getKycStatusLabel(status)}</Badge>;
}

export function KycRiskBadge({ risk }: { risk: KycRiskLevel }) {
  const tone =
    risk === "high"
      ? "red"
      : risk === "elevated"
        ? "gold"
        : risk === "low"
          ? "green"
          : "slate";

  return (
    <Badge className="gap-1.5" tone={tone} title="Internal risk label for authorized staff">
      {risk === "high" || risk === "elevated" ? (
        <ShieldAlert aria-hidden="true" className="h-3.5 w-3.5" />
      ) : (
        <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
      )}
      {getKycRiskLabel(risk)}
    </Badge>
  );
}

function RequirementIcon({ status }: { status: KycRequirementStatus }) {
  if (status === "not_submitted") {
    return <Circle aria-hidden="true" className="h-3.5 w-3.5" />;
  }

  if (status === "submitted") {
    return <Upload aria-hidden="true" className="h-3.5 w-3.5" />;
  }

  if (status === "under_review") {
    return <Eye aria-hidden="true" className="h-3.5 w-3.5" />;
  }

  if (status === "approved") {
    return <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />;
  }

  if (status === "replacement_requested" || status === "escalated") {
    return <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />;
  }

  if (status === "expired") {
    return <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />;
  }

  return <XCircle aria-hidden="true" className="h-3.5 w-3.5" />;
}

export function KycRequirementStatusBadge({ status }: { status: KycRequirementStatus }) {
  const tone =
    status === "approved"
      ? "green"
      : status === "rejected" || status === "expired"
        ? "red"
        : status === "replacement_requested" || status === "escalated"
          ? "gold"
          : status === "not_submitted"
            ? "slate"
            : "teal";

  return (
    <Badge className="gap-1.5" tone={tone}>
      <RequirementIcon status={status} />
      {getKycRequirementStatusLabel(status)}
    </Badge>
  );
}

export function KycProgressBar({
  label,
  value,
  total,
  tone = "teal",
}: {
  label: string;
  value: number;
  total: number;
  tone?: "teal" | "green" | "gold" | "slate";
}) {
  const percent = total === 0 ? 0 : Math.round((value / total) * 100);
  const color =
    tone === "green"
      ? "bg-emerald-600"
      : tone === "gold"
        ? "bg-amber-500"
        : tone === "slate"
          ? "bg-muted-foreground"
          : "bg-primary";

  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold text-foreground">
          {value}/{total} ({percent}%)
        </span>
      </div>
      <div className="h-2 rounded-sm bg-muted">
        <div className={`h-2 rounded-sm ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
