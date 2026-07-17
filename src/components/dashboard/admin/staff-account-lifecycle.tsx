"use client";

import { useState } from "react";
import { Power, RotateCcw, Trash2, TriangleAlert, X } from "lucide-react";
import { Button, buttonClassName } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  deactivateStaffAccountAction,
  deleteStaffAccountAction,
  reactivateStaffAccountAction,
} from "@/features/staff/actions";

export function StaffAccountLifecycle({
  name,
  staffId,
  status,
}: {
  name: string;
  staffId: string;
  status: string;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const active = status === "active";

  return (
    <section className="border-t border-border bg-muted/20 p-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h2 className="text-base font-bold text-foreground">Account actions</h2>
          <p className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">
            {active
              ? "Deactivation signs the staff member out and prevents another sign-in."
              : "This account is deactivated and cannot sign in until it is reactivated."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={active ? deactivateStaffAccountAction : reactivateStaffAccountAction}>
            <input name="staffId" type="hidden" value={staffId} />
            <SubmitButton
              pendingText={active ? "Deactivating..." : "Reactivating..."}
              variant="secondary"
            >
              {active ? (
                <Power aria-hidden="true" className="h-4 w-4" />
              ) : (
                <RotateCcw aria-hidden="true" className="h-4 w-4" />
              )}
              {active ? "Deactivate account" : "Reactivate account"}
            </SubmitButton>
          </form>
          <Button onClick={() => setConfirmDelete(true)} variant="destructive">
            <Trash2 aria-hidden="true" className="h-4 w-4" />
            Delete account
          </Button>
        </div>
      </div>

      {confirmDelete ? (
        <div className="mt-4 flex flex-col justify-between gap-4 rounded-md border border-red-200 bg-red-50 p-4 text-red-950 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <TriangleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">Delete {name}?</p>
              <p className="mt-1 text-sm leading-5 text-red-800">
                The account will be removed from the staff directory and cannot sign in. Historical work and audit records will be retained.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              className={buttonClassName({ variant: "secondary", size: "sm" })}
              onClick={() => setConfirmDelete(false)}
              type="button"
            >
              <X aria-hidden="true" className="h-4 w-4" />
              Cancel
            </button>
            <form action={deleteStaffAccountAction}>
              <input name="staffId" type="hidden" value={staffId} />
              <SubmitButton pendingText="Deleting..." size="sm" variant="destructive">
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                Confirm delete
              </SubmitButton>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
