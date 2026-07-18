import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCheck, FileSearch } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { StaffEmptyState, staffDate, staffStatusLabel, staffStatusTone } from "@/components/dashboard/staff/staff-work-ui";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { StaffReviewRecord } from "@/repositories/staff-work-repository";

export function StaffReviews({ reviews }: { reviews: StaffReviewRecord[] }) {
  const pending = reviews.filter((review) => !["approved", "completed"].includes(review.status)).length;
  const completeQuestionnaires = reviews.filter((review) => review.questionnaireComplete).length;

  return (
    <AdminPageSurface
      description="KYC submissions for clients connected to your assigned work."
      icon={ClipboardCheck}
      summary={[
        { label: "Reviews", value: reviews.length, helper: "Visible client submissions", icon: ClipboardCheck },
        { label: "Pending", value: pending, helper: "Still need attention", icon: FileSearch },
        { label: "Questionnaires ready", value: completeQuestionnaires, helper: "Completed by clients", icon: CheckCircle2 },
      ]}
      title="Review queue"
    >
      {reviews.length === 0 ? (
        <StaffEmptyState description="A review appears after an assigned client starts their KYC submission." title="No reviews waiting" />
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Questionnaire</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <p className="font-semibold text-foreground">{review.clientName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{review.clientEmail}</p>
                  </TableCell>
                  <TableCell><Badge tone={staffStatusTone(review.status)}>{staffStatusLabel(review.status)}</Badge></TableCell>
                  <TableCell>{review.questionnaireComplete ? "Complete" : "Incomplete"}</TableCell>
                  <TableCell>{review.documentCount}</TableCell>
                  <TableCell>{staffDate(review.submittedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/staff/kyc/client-kyc-${review.id}`}>
                      Review KYC
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
