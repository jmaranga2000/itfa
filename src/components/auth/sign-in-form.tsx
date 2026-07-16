"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { SubmitButton } from "@/components/ui/submit-button";

export function SignInForm() {
  return (
    <form action="/api/auth/sign-in" className="grid gap-4" method="post">
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input autoComplete="email" id="email" name="email" required type="email" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          autoComplete="current-password"
          id="password"
          name="password"
          required
        />
      </div>
      <SubmitButton pendingText="Signing in...">Sign in</SubmitButton>
    </form>
  );
}
