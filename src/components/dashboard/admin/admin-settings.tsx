import { Bell, CheckCircle2, Plug, Settings, ShieldCheck } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const settingGroups = [
  {
    label: "Security",
    status: "Configured",
    items: ["Session duration", "Password policy", "Email verification", "Audit logging"],
  },
  {
    label: "Portal defaults",
    status: "Review",
    items: ["Client onboarding", "Staff assignment", "Theme preference", "Timezone"],
  },
  {
    label: "Notifications",
    status: "Draft",
    items: ["KYC alerts", "Invoice reminders", "Staff task updates", "Client messages"],
  },
  {
    label: "Integrations",
    status: "Review",
    items: ["MongoDB", "Email provider", "Payments", "AI workspace"],
  },
];

const safeguards = [
  "Sensitive changes should write an audit record.",
  "Secrets should stay in environment variables, never in UI state.",
  "Permission changes should be reviewed from the Roles and permissions page.",
];

function statusTone(status: string) {
  if (status === "Configured") {
    return "green" as const;
  }

  if (status === "Review") {
    return "gold" as const;
  }

  return "slate" as const;
}

export function AdminSettings() {
  const configured = settingGroups.filter((group) => group.status === "Configured").length;
  const needsReview = settingGroups.filter((group) => group.status === "Review").length;
  const settingItems = settingGroups.reduce((total, group) => total + group.items.length, 0);
  const groupIcons = [ShieldCheck, Settings, Bell, Plug];

  return (
    <AdminPageSurface
      description="Review the main settings that control security, notifications and connected services."
      icon={Settings}
      summary={[
        { label: "Ready", value: configured, helper: "Configured groups", icon: CheckCircle2 },
        { label: "Review", value: needsReview, helper: "Need confirmation", icon: Settings },
        { label: "Options", value: settingItems, helper: "Settings available", icon: Bell },
      ]}
      title="Settings"
      footer={
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {safeguards.map((safeguard) => (
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground" key={safeguard}>
              <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
              {safeguard}
            </span>
          ))}
        </div>
      }
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Setting area</TableHead>
              <TableHead>What it controls</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {settingGroups.map((group, index) => {
              const Icon = groupIcons[index] ?? Settings;

              return (
                <TableRow key={group.label}>
                  <TableCell>
                    <span className="inline-flex items-center gap-3 font-semibold text-foreground">
                      <span className="grid h-9 w-9 place-items-center rounded-md bg-brand-soft text-primary">
                        <Icon aria-hidden="true" className="h-4 w-4" />
                      </span>
                      {group.label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-72 flex-wrap gap-x-4 gap-y-1">
                      {group.items.map((item) => (
                        <span className="text-sm text-muted-foreground" key={item}>{item}</span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge tone={statusTone(group.status)}>{group.status}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </AdminPageSurface>
  );
}
