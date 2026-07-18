import Link from "next/link";
import { ArrowLeft, Plus, UserRoundCheck, Users } from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { assignKycReviewerAction } from "@/features/kyc/review-actions";
import type {
  KycReviewerWorkloadRecord,
  KycSubmission,
} from "@/features/kyc/service";

export function KycReviewerAssignment({
  error,
  reviewers,
  submission,
}: {
  error?: string;
  reviewers: KycReviewerWorkloadRecord[];
  submission: KycSubmission | null;
}) {
  const available = reviewers.filter((reviewer) => reviewer.availability === "Available").length;

  return (
    <AdminPageSurface
      actions={
        <>
          <Link
            className={buttonClassName({ variant: "secondary" })}
            href={submission ? `/admin/kyc/${submission.id}` : "/admin/kyc"}
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            {submission ? "Back to review" : "KYC centre"}
          </Link>
          <Link className={buttonClassName()} href="/admin/staff/new">
            <Plus aria-hidden="true" className="h-4 w-4" />
            Create reviewer
          </Link>
        </>
      }
      description={submission
        ? `Choose a reviewer for ${submission.reference}. Reviewers with the lightest live KYC workload are shown first.`
        : "Live reviewer accounts and their current KYC workload. Open a KYC record and choose Assign to make an assignment."}
      icon={UserRoundCheck}
      summary={[
        { label: "Reviewers", value: reviewers.length, helper: "Active reviewer accounts", icon: Users },
        { label: "Available", value: available, helper: "Fewer than five open reviews", icon: UserRoundCheck },
      ]}
      title={submission ? `Assign reviewer to ${submission.clientName}` : "KYC reviewers"}
    >
      {error ? (
        <p className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-800">
          The reviewer could not be assigned. Confirm that the account is active and has the Reviewer role.
        </p>
      ) : null}
      {reviewers.length ? (
        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Reviewer</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Open reviews</TableHead>
                <TableHead>Overdue</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Conflict check</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviewers.map((reviewer) => (
                <TableRow key={reviewer.id}>
                  <TableCell>
                    <p className="font-semibold text-foreground">{reviewer.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{reviewer.email}</p>
                  </TableCell>
                  <TableCell>{reviewer.role}</TableCell>
                  <TableCell>{reviewer.currentReviews}</TableCell>
                  <TableCell>{reviewer.overdueReviews}</TableCell>
                  <TableCell>
                    <Badge tone={reviewer.availability === "Available" ? "green" : "gold"}>
                      {reviewer.availability}
                    </Badge>
                  </TableCell>
                  <TableCell>{reviewer.conflictWarning}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      {submission ? (
                        reviewer.assigned ? (
                          <Badge className="h-9 px-3" tone="green">Assigned</Badge>
                        ) : (
                          <form action={assignKycReviewerAction}>
                            <input name="submissionId" type="hidden" value={submission.id} />
                            <input name="reviewerUserId" type="hidden" value={reviewer.id} />
                            <SubmitButton pendingText="Assigning..." size="sm">
                              <UserRoundCheck aria-hidden="true" className="h-4 w-4" />
                              Assign
                            </SubmitButton>
                          </form>
                        )
                      ) : (
                        <Link
                          className={buttonClassName({ size: "sm", variant: "secondary" })}
                          href={`/admin/staff/${reviewer.id}`}
                        >
                          Open profile
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid justify-items-center gap-3 p-12 text-center">
          <Users aria-hidden="true" className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="font-semibold text-foreground">No active reviewers</p>
            <p className="mt-1 text-sm text-muted-foreground">Create a staff account with the Reviewer role first.</p>
          </div>
          <Link className={buttonClassName()} href="/admin/staff/new">Create reviewer</Link>
        </div>
      )}
    </AdminPageSurface>
  );
}
