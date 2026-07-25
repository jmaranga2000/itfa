"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { submitAccountClosureRequestAction } from "@/features/client/account-closure-actions";
import type { AccountClosureRequestRecord } from "@/repositories/account-closure-repository";

function statusTone(status: string) {
  if (status === "approved") return "green" as const;
  if (status === "requested") return "gold" as const;
  if (status === "rejected") return "red" as const;
  return "slate" as const;
}

export function ClientAccountClosureRequest({
  request,
  query,
}: {
  request: AccountClosureRequestRecord | null;
  query: { closureRequested?: string; closureRequestPending?: string; closureRequestRejected?: string };
}) {
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const hasPendingRequest = request?.status === "requested" || request?.status === "approved";
  const canSubmit = !hasPendingRequest || request?.status === "rejected";

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle>Account closure request</CardTitle>
        <CardDescription>
          Ask IFTA to review your account closure and disable your portal access.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-5 py-5">
        {query.closureRequested ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            Your request has been submitted and is awaiting review.
          </div>
        ) : null}
        {query.closureRequestPending ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            You already have an active closure request. The team will review it soon.
          </div>
        ) : null}
        {request ? (
          <div className="rounded-md border border-border bg-muted/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Request {request.requestReference}</p>
                <p className="mt-1 text-xs text-muted-foreground">Submitted {new Date(request.requestedAt).toLocaleString()}</p>
              </div>
              <Badge tone={statusTone(request.status)}>{request.status}</Badge>
            </div>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>{request.reason}</p>
              {request.status !== "requested" ? (
                <div>
                  <p className="text-xs font-semibold text-foreground">Review notes</p>
                  <p>{request.reviewNotes || "No review notes were provided."}</p>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {canSubmit ? (
          <form action={submitAccountClosureRequestAction} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="reason">Why do you want to close your account?</Label>
              <Textarea
                id="reason"
                name="reason"
                onChange={(event) => setReason(event.target.value)}
                placeholder="Explain your reason clearly so the admin team can review it."
                required
                value={reason}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <SubmitButton
                pendingText="Submitting request..."
                disabled={submitted || reason.trim().length < 10}
                onClick={() => setSubmitted(true)}
              >
                Request account closure
              </SubmitButton>
              <Button
                className={buttonClassName({ variant: "secondary", size: "sm" })}
                type="reset"
                onClick={() => setReason("")}
              >
                Reset
              </Button>
            </div>
          </form>
        ) : request?.status === "rejected" ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            Your previous request was rejected. You may submit a revised request.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
