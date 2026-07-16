"use client";

import { resendVerificationEmailAction } from "@/features/auth/actions";
import { SubmitButton } from "@/components/ui/submit-button";

export function ResendVerificationForm({ email }: { email: string }) {
  return (
    <form action={resendVerificationEmailAction}>
      <input name="email" type="hidden" value={email} />
      <SubmitButton pendingText="Sending verification..." variant="secondary">
        Resend verification email
      </SubmitButton>
    </form>
  );
}
