import Link from "next/link";
import { CheckCircle2, Save } from "lucide-react";
import { saveClientKycQuestionnaireAction } from "@/features/kyc/client-actions";
import { CLIENT_KYC_QUESTIONS, type ClientKycQuestion } from "@/features/kyc/client-questionnaire";
import type { ClientKycSubmission } from "@/repositories/client-kyc-repository";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";

function QuestionField({ question, value }: { question: ClientKycQuestion; value: string }) {
  const fieldId = `kyc-${question.id}`;

  return (
    <div className="grid gap-2" key={question.id}>
      <Label htmlFor={fieldId}>
        {question.label}
        {question.required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <p className="text-sm leading-6 text-muted-foreground">{question.helpText}</p>
      {question.kind === "textarea" ? (
        <Textarea defaultValue={value} id={fieldId} name={question.id} required={question.required} />
      ) : null}
      {question.kind === "select" ? (
        <Select defaultValue={value} id={fieldId} name={question.id} required={question.required}>
          <option value="">Select an answer</option>
          {question.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      ) : null}
      {question.kind === "text" ? (
        <Input defaultValue={value} id={fieldId} name={question.id} required={question.required} />
      ) : null}
    </div>
  );
}

export function ClientKycQuestionnaire({ saved, submission }: { saved: boolean; submission: ClientKycSubmission }) {
  const sections = [...new Set(CLIENT_KYC_QUESTIONS.map((question) => question.section))];

  return (
    <div className="grid min-w-0 gap-5">
      <section className="flex flex-col justify-between gap-4 border-b border-border pb-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">Client verification</p>
          <h1 className="mt-2 text-2xl font-bold text-foreground">KYC questionnaire</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Complete every required answer, then upload the requested document before sending your KYC for review.
          </p>
        </div>
        <Link className={buttonClassName({ variant: "secondary" })} href="/client/kyc">
          Back to KYC
        </Link>
      </section>

      {saved ? (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-medium text-emerald-800">
          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
          Your questionnaire answers have been saved.
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Questionnaire progress</CardTitle>
          <CardDescription>
            {submission.questionnaire.answered} of {submission.questionnaire.total} required questions completed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${(submission.questionnaire.answered / submission.questionnaire.total) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <form action={saveClientKycQuestionnaireAction} className="grid gap-5">
        {sections.map((section) => (
          <Card key={section}>
            <CardHeader>
              <CardTitle>{section}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              {CLIENT_KYC_QUESTIONS.filter((question) => question.section === section).map((question) => (
                <QuestionField key={question.id} question={question} value={submission.answers[question.id] ?? ""} />
              ))}
            </CardContent>
          </Card>
        ))}

        <div className="flex flex-wrap justify-end gap-3">
          <Link className={buttonClassName({ variant: "secondary" })} href="/client/kyc/upload-replacement">
            Upload replacement
          </Link>
          <SubmitButton pendingText="Saving answers...">
            <Save aria-hidden="true" className="h-4 w-4" />
            Save questionnaire
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
