import Link from "next/link";
import { ArrowRight, ClipboardList, LockKeyhole } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";

export type StaffWorkItem = {
  title: string;
  description: string;
  href?: string;
  status?: string;
};

export function StaffSpecialistArea({
  description,
  items,
  readOnly = false,
  roleLabel,
  title,
}: {
  description: string;
  items: readonly StaffWorkItem[];
  readOnly?: boolean;
  roleLabel: string;
  title: string;
}) {
  return (
    <AdminPageSurface
      actions={readOnly ? <Badge tone="slate">Read-only access</Badge> : undefined}
      description={description}
      icon={readOnly ? LockKeyhole : ClipboardList}
      title={title}
    >
      <div className="border-b border-border bg-muted/20 px-5 py-3">
        <Badge tone="teal">{roleLabel}</Badge>
      </div>
      <div className="divide-y divide-border">
        {items.map((item) => (
          <div className="flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center" key={item.title}>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-foreground">{item.title}</p>
                {item.status ? <Badge tone="slate">{item.status}</Badge> : null}
              </div>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">{item.description}</p>
            </div>
            {item.href ? (
              <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={item.href}>
                Open
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        ))}
      </div>
    </AdminPageSurface>
  );
}
