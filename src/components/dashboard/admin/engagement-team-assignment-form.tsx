"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Save } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { assignEngagementTeamAction } from "@/features/engagements/management-actions";
import type {
  EngagementTeamCandidate,
  EngagementTeamRole,
} from "@/repositories/engagement-management-repository";

const fields: Array<{ role: EngagementTeamRole; name: string; label: string }> = [
  { role: "consultant", name: "consultantUserId", label: "Consultant" },
  { role: "reviewer", name: "reviewerUserId", label: "Reviewer" },
  { role: "finance_officer", name: "financeOfficerUserId", label: "Finance officer" },
];

export function EngagementTeamAssignmentForm({
  workflowId,
  candidates,
  initialSelection,
}: {
  workflowId: string;
  candidates: EngagementTeamCandidate[];
  initialSelection: Partial<Record<EngagementTeamRole, string>>;
}) {
  const [selection, setSelection] = useState(initialSelection);
  const selectedCandidates = useMemo(() => fields.map((field) => ({
    ...field,
    candidate: candidates.find((candidate) => candidate.id === selection[field.role]),
  })), [candidates, selection]);
  const selectedIds = fields.map((field) => selection[field.role]).filter(Boolean);
  const hasDuplicate = new Set(selectedIds).size !== selectedIds.length;
  const complete = fields.every((field) => Boolean(selection[field.role]));

  return (
    <form action={assignEngagementTeamAction} className="grid gap-5">
      <input name="workflowId" type="hidden" value={workflowId} />
      <div className="grid gap-4 lg:grid-cols-3">
        {selectedCandidates.map(({ role, name, label, candidate }) => {
          const options = candidates.filter((item) => item.roleKeys.includes(role));
          return (
            <div className="grid content-start gap-2" key={role}>
              <Label htmlFor={name}>{label}</Label>
              <Select
                id={name}
                name={name}
                onChange={(event) => setSelection((current) => ({ ...current, [role]: event.target.value }))}
                required
                value={selection[role] ?? ""}
              >
                <option value="">Select staff</option>
                {options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name} - {option.activeEngagements} active
                  </option>
                ))}
              </Select>
              {candidate ? (
                <div className="rounded-md border border-border bg-muted/20 p-3 text-xs leading-5">
                  <p className="font-semibold text-foreground">{candidate.name}</p>
                  <p className="text-muted-foreground">{candidate.departments[role]}</p>
                  <p className="text-muted-foreground">{candidate.activeEngagements} current active engagement{candidate.activeEngagements === 1 ? "" : "s"}</p>
                  {candidate.heavyWorkload ? (
                    <p className="mt-2 flex items-start gap-1.5 font-semibold text-danger">
                      <AlertTriangle aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      Heavy workload. Consider another available staff member.
                    </p>
                  ) : null}
                </div>
              ) : null}
              {options.length === 0 ? <p className="text-xs font-medium text-danger">No active {label.toLowerCase()} account is available.</p> : null}
            </div>
          );
        })}
      </div>
      {hasDuplicate ? (
        <p className="rounded-md border border-warning/30 bg-warning-soft px-3 py-2 text-sm font-medium text-warning">
          Select a different person for each team role.
        </p>
      ) : null}
      <div className="sticky bottom-3 z-20 flex justify-end rounded-md border border-border bg-card/95 p-3 shadow-lg backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none">
        <SubmitButton disabled={!complete || hasDuplicate} pendingText="Saving team...">
          <Save aria-hidden="true" className="h-4 w-4" />
          Save entire team
        </SubmitButton>
      </div>
    </form>
  );
}
