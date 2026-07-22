"use client";

import { Send } from "lucide-react";
import { submitContactAction } from "@/features/public/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm() {
  return (
    <form action={submitContactAction} className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input autoComplete="name" id="name" name="name" placeholder="Your full name" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input autoComplete="email" id="email" name="email" placeholder="name@company.com" required type="email" />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="company">Organization</Label>
          <Input autoComplete="organization" id="company" name="company" placeholder="Organization name" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="service">Service area</Label>
          <Select id="service" name="service" required>
            <option value="">Select a service</option>
            <option>Tax advisory and compliance</option>
            <option>Financial reporting and analysis</option>
            <option>Finance process consulting</option>
            <option>Managed engagement workspace</option>
          </Select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="message">What do you need help with?</Label>
        <Textarea id="message" name="message" placeholder="Describe the decision, issue, deadline and desired outcome." required />
        <p className="text-xs leading-5 text-muted-foreground">Do not include passwords, identity documents or confidential evidence.</p>
      </div>
      <SubmitButton className="w-full sm:w-auto" pendingText="Sending request...">
        Send consultation request
        <Send aria-hidden="true" className="h-4 w-4" />
      </SubmitButton>
    </form>
  );
}
