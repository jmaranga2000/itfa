import Link from "next/link";
import { ArrowRight, CheckCircle2, Files, ScanSearch } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { StaffEmptyState, staffDate, staffStatusLabel, staffStatusTone } from "@/components/dashboard/staff/staff-work-ui";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { StaffDocumentRecord } from "@/repositories/staff-work-repository";

export function StaffDocuments({ documents }: { documents: StaffDocumentRecord[] }) {
  const awaitingReview = documents.filter((document) => document.status === "pending_review").length;
  const approved = documents.filter((document) => ["approved", "final"].includes(document.status)).length;

  return (
    <AdminPageSurface
      description="Documents attached to the client work you can access."
      icon={Files}
      summary={[
        { label: "Documents", value: documents.length, helper: "Across assigned engagements", icon: Files },
        { label: "Awaiting review", value: awaitingReview, helper: "Need a decision", icon: ScanSearch },
        { label: "Approved", value: approved, helper: "Ready or final", icon: CheckCircle2 },
      ]}
      title="Documents"
    >
      {documents.length === 0 ? (
        <StaffEmptyState description="Files will appear here when they are added to your assigned engagements." title="No documents available" />
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Engagement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((document) => (
                <TableRow key={`${document.workflowId}-${document.id}`}>
                  <TableCell>
                    <p className="font-semibold text-foreground">{document.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{document.reference}</p>
                  </TableCell>
                  <TableCell>{document.clientName}</TableCell>
                  <TableCell><Badge tone={staffStatusTone(document.status)}>{staffStatusLabel(document.status)}</Badge></TableCell>
                  <TableCell>v{document.version}</TableCell>
                  <TableCell>{staffStatusLabel(document.visibility)}</TableCell>
                  <TableCell>{staffDate(document.uploadedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/staff/engagements/${document.workflowId}`}>
                      Open
                      <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminPageSurface>
  );
}
