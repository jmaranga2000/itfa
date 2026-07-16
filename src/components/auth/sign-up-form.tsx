"use client";

import { useMemo, useState } from "react";
import { signUpAction } from "@/features/auth/actions";
import { getPasswordChecklist, isPasswordPolicySatisfied } from "@/features/auth/password-policy";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { SubmitButton } from "@/components/ui/submit-button";

export function SignUpForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const checklist = useMemo(() => getPasswordChecklist(password), [password]);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const canSubmit = isPasswordPolicySatisfied(password) && passwordsMatch;

  return (
    <form action={signUpAction} className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="firstName">First name</Label>
          <Input autoComplete="given-name" id="firstName" name="firstName" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input autoComplete="family-name" id="lastName" name="lastName" required />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input autoComplete="email" id="email" name="email" required type="email" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          autoComplete="new-password"
          id="password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
        <div className="grid gap-2 rounded-md border border-border bg-muted/50 p-3">
          {checklist.map((item) => (
            <div className="flex items-center gap-2 text-sm" key={item.key}>
              <span
                aria-hidden="true"
                className={
                  item.met
                    ? "grid h-5 min-w-8 place-items-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white"
                    : "grid h-5 w-5 place-items-center rounded-full border border-border text-xs font-bold text-muted-foreground"
                }
              >
                {item.met ? "OK" : ""}
              </span>
              <span className={item.met ? "font-medium text-foreground" : "text-muted-foreground"}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <PasswordInput
          autoComplete="new-password"
          id="confirmPassword"
          name="confirmPassword"
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          type="password"
          value={confirmPassword}
        />
        {confirmPassword ? (
          <p className={passwordsMatch ? "text-sm font-medium text-emerald-700" : "text-sm font-medium text-red-700"}>
            {passwordsMatch ? "Passwords match." : "Passwords do not match."}
          </p>
        ) : null}
      </div>
      <SubmitButton disabled={!canSubmit} pendingText="Creating account...">
        Create account
      </SubmitButton>
    </form>
  );
}
