import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  MessageSquareText,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { EngagementTeamAssignmentForm } from "@/components/dashboard/admin/engagement-team-assignment-form";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { addEngagementInternalNoteAction } from "@/features/engagements/management-actions";
import type { EngagementTeamCandidate, EngagementTeamRole } from "@/repositories/engagement-management-repository";
import type { WorkflowInstanceRecord, WorkflowTeamMemberRecord } from "@/repositories/workflow-repository";

const teamRoles: Array<{ role: EngagementTeamRole; label: string; icon: typeof UsersRound }> = [
  { role: "consultant", label: "Consultant", icon: BriefcaseBusiness },
  { role: "reviewer", label: "Reviewer", icon: ShieldCheck },
  { role: "finance_officer", label: "Finance officer", icon: ClipboardList },
];

function dateLabel(value: string | null, includeTime = false) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-KE", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(includeTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(new Date(value));
}

function teamMember(workflow: WorkflowInstanceRecord, role: EngagementTeamRole) {
  return workflow.team.find((member) => member.role === role);
}

function TeamMemberDetails({
  member,
  role,
  candidates,
}: {
  member?: WorkflowTeamMemberRecord;
  role: EngagementTeamRole;
  candidates: EngagementTeamCandidate[];
}) {
  const candidate = candidates.find((item) => item.id === member?.userId);
  if (!member) {
    return <p className="text-sm text-muted-foreground">Not assigned yet.</p>;
  }
  return (
    <dl className="grid gap-2 text-sm">
      <div><dt className="text-xs font-medium uppercase text-muted-foreground">Name</dt><dd className="mt-0.5 font-semibold text-foreground">{member.name}</dd></div>
      <div><dt className="text-xs font-medium uppercase text-muted-foreground">Role</dt><dd className="mt-0.5 capitalize text-foreground">{role.replaceAll("_", " ")}</dd></div>
      <div><dt className="text-xs font-medium uppercase text-muted-foreground">Department</dt><dd className="mt-0.5 text-foreground">{member.department}</dd></div>
      <div><dt className="text-xs font-medium uppercase text-muted-foreground">Current active engagements</dt><dd className="mt-0.5 text-foreground">{candidate?.activeEngagements ?? "Not available"}</dd></div>
    </dl>
  );
}

function noticeForError(error?: string) {
  if (error === "duplicate") return "Choose a different person for each team role.";
  if (error === "role") return "One selected staff member does not have the required role.";
  if (error === "not_found") return "The engagement or selected staff account is no longer available.";
  if (error === "note") return "Enter a note before saving.";
  if (error) return "The change could not be saved. Check the selections and try again.";
  return null;
}

export function AdminEngagementWorkspace({
  workflow,
  candidates,
  query,
}: {
  workflow: WorkflowInstanceRecord;
  candidates: EngagementTeamCandidate[];
  query: { error?: string; team?: string; note?: string };
}) {
  const error = noticeForError(query.error);
  const initialSelection = Object.fromEntries(teamRoles.map(({ role }) => [
    role,
    teamMember(workflow, role)?.userId ?? "",
  ])) as Record<EngagementTeamRole, string>;
  const completeTeam = teamRoles.every(({ role }) => Boolean(teamMember(workflow, role)?.userId));
  const timeline = [...workflow.activity].sort((left, right) =>
    new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );
  const notes = [...workflow.internalNotes].sort((left, right) =>
    new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );

  return (
    <div className="grid min-w-0 gap-4 pb-8">
      <Card className="shadow-none">
        <CardHeader className="gap-4">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="green">Active</Badge>
                <span className="font-mono text-xs font-semibold text-primary">{workflow.reference}</span>
              </div>
              <CardTitle className="mt-3 text-2xl">{workflow.clientName}</CardTitle>
              <CardDescription className="mt-1 max-w-3xl">{workflow.serviceName}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href="/admin/active-engagements">
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                Back to active engagements
              </Link>
              <a className={buttonClassName({ size: "sm" })} href="#team-assignment">
                <UsersRound aria-hidden="true" className="h-4 w-4" />
                {completeTeam ? "Update team" : "Assign team"}
              </a>
            </div>
          </div>
        </CardHeader>
      </Card>

      {error ? <div className="rounded-md border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{error}</div> : null}
      {query.team === "saved" ? <div className="rounded-md border border-success/30 bg-success-soft px-4 py-3 text-sm font-semibold text-success">The engagement team was saved and each staff member was notified.</div> : null}
      {query.note === "saved" ? <div className="rounded-md border border-success/30 bg-success-soft px-4 py-3 text-sm font-semibold text-success">Internal note saved.</div> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Engagement overview">
        {[
          { label: "Engagement status", value: "Active", helper: `Signed ${dateLabel(workflow.signedAt)}`, icon: CheckCircle2 },
          { label: "Start date", value: dateLabel(workflow.activatedAt ?? workflow.startDate), helper: `Signed by ${workflow.signedByName || "Client"}`, icon: CalendarDays },
          { label: "Current stage", value: workflow.currentStageName, helper: workflow.nextAction, icon: UserRoundCheck },
          { label: "Progress", value: `${workflow.progress.overall}%`, helper: `${workflow.progress.completedStages} of ${workflow.progress.totalStages} stages complete`, icon: Clock3 },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card className="shadow-none" key={item.label}>
              <CardContent className="flex items-start gap-3 p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-brand-soft text-primary"><Icon aria-hidden="true" className="h-4 w-4" /></span>
                <div className="min-w-0"><p className="text-xs font-medium text-muted-foreground">{item.label}</p><p className="mt-1 break-words font-semibold text-foreground">{item.value}</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.helper}</p></div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card className="shadow-none" id="team">
        <CardHeader>
          <CardTitle>Assigned team</CardTitle>
          <CardDescription>The people responsible for delivering, reviewing and approving finance work.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:hidden">
            {teamRoles.map(({ role, label, icon: Icon }) => {
              const member = teamMember(workflow, role);
              return (
                <details className="rounded-md border border-border bg-background" key={role} open={!member}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
                    <span className="flex min-w-0 items-center gap-3"><Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" /><span><span className="block text-sm font-semibold text-foreground">{label}</span><span className="block truncate text-xs text-muted-foreground">{member?.name ?? "Not assigned"}</span></span></span>
                    <Badge tone={member ? "green" : "gold"}>{member ? "Assigned" : "Open"}</Badge>
                  </summary>
                  <div className="border-t border-border p-4"><TeamMemberDetails candidates={candidates} member={member} role={role} /></div>
                </details>
              );
            })}
          </div>
          <div className="hidden gap-3 md:grid md:grid-cols-3">
            {teamRoles.map(({ role, label, icon: Icon }) => {
              const member = teamMember(workflow, role);
              return (
                <div className="rounded-md border border-border bg-background p-4" key={role}>
                  <div className="mb-4 flex items-center justify-between gap-3"><span className="flex items-center gap-2 font-semibold text-foreground"><Icon aria-hidden="true" className="h-4 w-4 text-primary" />{label}</span><Badge tone={member ? "green" : "gold"}>{member ? "Assigned" : "Open"}</Badge></div>
                  <TeamMemberDetails candidates={candidates} member={member} role={role} />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="scroll-mt-24 shadow-none" id="team-assignment">
        <CardHeader>
          <CardTitle>{completeTeam ? "Update team assignment" : "Assign the engagement team"}</CardTitle>
          <CardDescription>Select one active staff member for each role. Workload warnings help prevent over-assignment.</CardDescription>
        </CardHeader>
        <CardContent>
          <EngagementTeamAssignmentForm candidates={candidates} initialSelection={initialSelection} workflowId={workflow.id} />
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.7fr)]">
        <Card className="shadow-none" id="timeline">
          <CardHeader>
            <CardTitle>Engagement timeline</CardTitle>
            <CardDescription>Events are added automatically in chronological order.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-0">
              {timeline.map((event, index) => (
                <li className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-3" key={`${event.type}-${event.createdAt}-${index}`}>
                  <div className="flex flex-col items-center"><span className="mt-1 h-2.5 w-2.5 rounded-full border-2 border-primary bg-card" />{index < timeline.length - 1 ? <span className="min-h-12 w-px flex-1 bg-border" /> : null}</div>
                  <div className="pb-5"><div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-start"><p className="font-semibold text-foreground">{event.title}</p><time className="shrink-0 text-xs text-muted-foreground">{dateLabel(event.createdAt, true)}</time></div><p className="mt-1 text-sm leading-6 text-muted-foreground">{event.description}</p><p className="mt-1 text-xs text-muted-foreground">{event.actorName}</p></div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card className="shadow-none" id="notes">
          <CardHeader>
            <CardTitle>Internal notes</CardTitle>
            <CardDescription>Only administrators and internal staff with engagement access can see these notes.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form action={addEngagementInternalNoteAction} className="grid gap-3">
              <input name="workflowId" type="hidden" value={workflow.id} />
              <Textarea aria-label="Internal engagement note" maxLength={2000} minLength={3} name="body" placeholder="Record a decision, risk or follow-up for the internal team..." required />
              <SubmitButton className="justify-self-end" pendingText="Saving note...">
                <MessageSquareText aria-hidden="true" className="h-4 w-4" />
                Add internal note
              </SubmitButton>
            </form>
            <div className="grid gap-3 border-t border-border pt-4">
              {notes.map((note) => (
                <article className="rounded-md border border-border bg-muted/20 p-3" key={note.id}><p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{note.body}</p><p className="mt-2 text-xs text-muted-foreground">{note.createdByName} - {dateLabel(note.createdAt, true)}</p></article>
              ))}
              {notes.length === 0 ? <p className="text-sm text-muted-foreground">No internal notes have been added.</p> : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
