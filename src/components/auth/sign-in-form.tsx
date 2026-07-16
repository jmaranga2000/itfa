"use client";

import Image from "next/image";
import { useState } from "react";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { SubmitButton } from "@/components/ui/submit-button";

export function SignInForm() {
  const [submitting, setSubmitting] = useState(false);

  return (
    <>
      <form
        action="/api/auth/sign-in"
        className="grid gap-4"
        method="post"
        onSubmit={() => setSubmitting(true)}
      >
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input autoComplete="email" id="email" name="email" required type="email" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput autoComplete="current-password" id="password" name="password" required />
        </div>
        <SubmitButton pendingText="Signing in...">Sign in</SubmitButton>
      </form>

      {submitting ? (
        <div className="fixed inset-0 z-[100] grid min-h-screen place-items-center bg-brand-deep px-5 py-8 text-white">
          <div className="relative w-full max-w-xl overflow-hidden rounded-md border border-white/20 bg-brand-deep shadow-2xl">
            <Image
              alt="IFTA Consulting team at work"
              className="h-44 w-full object-cover opacity-65"
              height={420}
              priority
              src="/images/ifta-consulting-team.png"
              width={760}
            />
            <div className="absolute inset-x-0 top-0 h-44 bg-brand-deep/35" />
            <div className="relative grid gap-4 p-6 sm:p-8">
              <span className="grid h-11 w-11 place-items-center rounded-md bg-brand-mist text-brand-deep">
                <ShieldCheck aria-hidden="true" className="h-6 w-6" />
              </span>
              <div>
                <p className="text-lg font-bold">IFTA Consulting</p>
                <p className="mt-1 text-sm text-brand-mist">Preparing your secure workspace</p>
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-white">
                <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin text-brand-mist" />
                Checking your access and opening the right portal...
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
