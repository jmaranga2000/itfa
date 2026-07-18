"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, MessageSquareText, Send, X } from "lucide-react";
import {
  createWorkflowClientConversationAction,
  type WorkflowMessageState,
} from "@/features/communication/actions";
import { buttonClassName } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";

const initialWorkflowMessageState: WorkflowMessageState = {
  status: "idle",
  message: "",
};

export function WorkflowMessageDialog({
  clientName,
  reference,
  workflowId,
}: {
  clientName: string;
  reference: string;
  workflowId: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(
    createWorkflowClientConversationAction,
    initialWorkflowMessageState,
  );

  return (
    <>
      <button
        className={buttonClassName({ variant: "secondary", size: "sm" })}
        onClick={() => setOpen(true)}
        type="button"
      >
        <MessageSquareText aria-hidden="true" className="h-4 w-4" />
        Message client
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] bg-black/35 p-3 sm:p-5" role="presentation">
          <section
            aria-labelledby="workflow-message-title"
            aria-modal="true"
            className="absolute inset-x-3 bottom-3 flex max-h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-md border border-border bg-card shadow-2xl sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[440px]"
            role="dialog"
          >
            <header className="flex items-start justify-between gap-4 bg-brand-deep px-5 py-4 text-white">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-brand-mist">{reference}</p>
                <h2 className="mt-1 text-lg font-bold" id="workflow-message-title">Message {clientName}</h2>
                <p className="mt-1 text-xs leading-5 text-white/75">The client receives this in the portal and by email.</p>
              </div>
              <button
                aria-label="Close message form"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-white hover:bg-white/10"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </header>

            {state.status === "success" ? (
              <div className="grid gap-4 overflow-y-auto p-5">
                <div className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
                  <div><p className="font-semibold">Message sent</p><p className="mt-1 text-sm">{state.message}</p></div>
                </div>
                <button className={buttonClassName()} onClick={() => setOpen(false)} type="button">Done</button>
              </div>
            ) : (
              <form action={formAction} className="grid min-h-0 overflow-y-auto">
                <input name="workflowId" type="hidden" value={workflowId} />
                <div className="grid gap-4 p-5">
                  {state.status === "error" ? (
                    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">{state.message}</p>
                  ) : null}
                  <div className="grid gap-2">
                    <Label htmlFor={`workflow-message-subject-${workflowId}`}>Subject</Label>
                    <Input
                      defaultValue={`Update on ${reference}`}
                      id={`workflow-message-subject-${workflowId}`}
                      maxLength={180}
                      name="subject"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`workflow-message-body-${workflowId}`}>Message</Label>
                    <Textarea
                      className="min-h-44"
                      id={`workflow-message-body-${workflowId}`}
                      maxLength={6000}
                      name="body"
                      placeholder="Write the update, question, or action the client needs to take."
                      required
                    />
                  </div>
                </div>
                <footer className="flex gap-2 border-t border-border bg-muted/20 p-4">
                  <button className={buttonClassName({ variant: "secondary", className: "flex-1" })} onClick={() => setOpen(false)} type="button">Cancel</button>
                  <SubmitButton className="flex-1" pendingText="Sending...">
                    <Send aria-hidden="true" className="h-4 w-4" />
                    Send
                  </SubmitButton>
                </footer>
              </form>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
