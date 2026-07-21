import Link from "next/link";
import {
  Bell,
  Building2,
  CheckCircle2,
  FileSignature,
  Link2,
  Save,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { SubmitButton } from "@/components/ui/submit-button";
import { buttonClassName } from "@/components/ui/button";
import { updatePlatformSettingsAction } from "@/features/settings/actions";
import type { PlatformSettingsRecord } from "@/repositories/platform-settings-repository";

const inputClassName = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/20";
const textareaClassName = "min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/20";

function Field({ label, name, defaultValue, type = "text", required = false, placeholder }: {
  label: string;
  name: string;
  defaultValue: string | number;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-foreground">
      {label}
      <input className={inputClassName} defaultValue={defaultValue} name={name} placeholder={placeholder} required={required} type={type} />
    </label>
  );
}

function Toggle({ name, label, description, defaultChecked }: {
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-background p-3">
      <input className="mt-1 h-4 w-4 accent-primary" defaultChecked={defaultChecked} name={name} type="checkbox" />
      <span>
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}

function SectionHeader({ icon: Icon, title, description }: {
  icon: typeof Settings;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-border px-5 py-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-brand-soft text-primary">
        <Icon aria-hidden="true" className="h-4 w-4" />
      </span>
      <div>
        <h2 className="font-bold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function AdminSettings({ settings, saved, error }: {
  settings: PlatformSettingsRecord;
  saved?: string;
  error?: string;
}) {
  const companyReady = [settings.company.legalName, settings.company.email, settings.company.address]
    .filter(Boolean).length;

  return (
    <AdminPageSurface
      actions={(
        <Link className={buttonClassName({ variant: "secondary", size: "sm" })} href="/admin/integrations">
          <Link2 aria-hidden="true" className="h-4 w-4" />
          Connections
        </Link>
      )}
      description="Manage the company details, engagement terms, signatures and client notifications used throughout the portal."
      icon={Settings}
      summary={[
        { label: "Company details", value: `${companyReady}/3`, helper: "Core letter fields ready", icon: Building2 },
        { label: "Letter creation", value: settings.engagement.autoGenerateLetters ? "Automatic" : "Manual", helper: "For approved requests", icon: FileSignature },
        { label: "Signatures", value: settings.engagement.requireInternalSignature ? "Two-party" : "Client", helper: "Required before activation", icon: ShieldCheck },
        { label: "Timezone", value: settings.portal.timezone, helper: "Portal date and time", icon: Bell },
      ]}
      title="Settings"
    >
      {saved ? (
        <p className="flex items-center gap-2 border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
          {saved === "company" ? "Company profile" : saved === "engagement" ? "Engagement and signature defaults" : "Portal preferences"} saved.
        </p>
      ) : null}
      {error ? (
        <p className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          Check the highlighted section and complete all required fields before saving.
        </p>
      ) : null}

      <div className="divide-y divide-border">
        <form action={updatePlatformSettingsAction}>
          <input name="section" type="hidden" value="company" />
          <SectionHeader description="These details appear on engagement letters and client-facing records." icon={Building2} title="Company profile" />
          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            <Field defaultValue={settings.company.tradingName} label="Trading name" name="tradingName" required />
            <Field defaultValue={settings.company.legalName} label="Legal name" name="legalName" required />
            <Field defaultValue={settings.company.registrationNumber} label="Registration number" name="registrationNumber" />
            <Field defaultValue={settings.company.kraPin} label="KRA PIN" name="kraPin" />
            <Field defaultValue={settings.company.email} label="Company email" name="email" placeholder="office@example.com" type="email" />
            <Field defaultValue={settings.company.phone} label="Phone" name="phone" />
            <Field defaultValue={settings.company.website} label="Website" name="website" placeholder="https://example.com" type="url" />
            <Field defaultValue={settings.company.city} label="City" name="city" required />
            <Field defaultValue={settings.company.country} label="Country" name="country" required />
            <label className="grid gap-2 text-sm font-semibold text-foreground md:col-span-2 xl:col-span-3">
              Postal or physical address
              <textarea className={textareaClassName} defaultValue={settings.company.address} name="address" />
            </label>
          </div>
          <div className="flex justify-end border-t border-border bg-muted/15 px-5 py-4">
            <SubmitButton pendingText="Saving company profile..."><Save aria-hidden="true" className="h-4 w-4" />Save company profile</SubmitButton>
          </div>
        </form>

        <form action={updatePlatformSettingsAction}>
          <input name="section" type="hidden" value="engagement" />
          <SectionHeader description="Control how engagement letters are generated, accepted and signed." icon={FileSignature} title="Engagement letters and signatures" />
          <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-4 md:grid-cols-2">
              <Field defaultValue={settings.engagement.defaultCurrency} label="Default currency" name="defaultCurrency" required />
              <Field defaultValue={settings.engagement.letterValidityDays} label="Acceptance period (days)" name="letterValidityDays" required type="number" />
              <Field defaultValue={settings.engagement.signatureReminderDays} label="Signature reminder (days)" name="signatureReminderDays" required type="number" />
              <Field defaultValue={settings.engagement.signatoryName} label="IFTA signatory name" name="signatoryName" required />
              <Field defaultValue={settings.engagement.signatoryTitle} label="IFTA signatory title" name="signatoryTitle" required />
              <Field defaultValue={settings.engagement.governingLaw} label="Governing law" name="governingLaw" required />
              <label className="grid gap-2 text-sm font-semibold text-foreground md:col-span-2">
                Default payment terms
                <textarea className={textareaClassName} defaultValue={settings.engagement.paymentTerms} name="paymentTerms" required />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-foreground md:col-span-2">
                Default dispute resolution
                <textarea className={textareaClassName} defaultValue={settings.engagement.disputeResolution} name="disputeResolution" required />
              </label>
            </div>
            <div className="grid content-start gap-3">
              <Toggle defaultChecked={settings.engagement.autoGenerateLetters} description="Create a customized draft when an administrator approves and sets up a request." label="Generate letters automatically" name="autoGenerateLetters" />
              <Toggle defaultChecked={settings.engagement.requireInternalSignature} description="Require an authorized IFTA signer as well as the client before activation." label="Require IFTA signature" name="requireInternalSignature" />
              <Toggle defaultChecked={settings.engagement.allowTypedSignatures} description="Allow signers to type their legal name and confirm their signing intention." label="Allow typed electronic signatures" name="allowTypedSignatures" />
              <Toggle defaultChecked={settings.engagement.requireDeliverableApproval} description="Require reviewer approval before an official deliverable can be released to the client." label="Require deliverable approval" name="requireDeliverableApproval" />
              <p className="rounded-md border border-border bg-muted/20 p-3 text-xs leading-5 text-muted-foreground">
                Every signature records the signer, time, content fingerprint, browser details and an audit event. Signed letters cannot be edited.
              </p>
            </div>
          </div>
          <div className="flex justify-end border-t border-border bg-muted/15 px-5 py-4">
            <SubmitButton pendingText="Saving engagement settings..."><Save aria-hidden="true" className="h-4 w-4" />Save engagement settings</SubmitButton>
          </div>
        </form>

        <form action={updatePlatformSettingsAction}>
          <input name="section" type="hidden" value="portal" />
          <SectionHeader description="Set client-facing contact details and useful signature notifications." icon={Bell} title="Portal and notifications" />
          <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-4 md:grid-cols-2">
              <Field defaultValue={settings.portal.timezone} label="Timezone" name="timezone" required />
              <Field defaultValue={settings.portal.supportEmail} label="Support email" name="supportEmail" type="email" />
              <label className="grid gap-2 text-sm font-semibold text-foreground md:col-span-2">
                Client welcome message
                <textarea className={textareaClassName} defaultValue={settings.portal.clientWelcomeMessage} name="clientWelcomeMessage" required />
              </label>
            </div>
            <div className="grid content-start gap-3">
              <Toggle defaultChecked={settings.portal.notifyClientOnLetterReady} description="Send an in-app and push alert when a letter is ready for client review." label="Notify clients about letters" name="notifyClientOnLetterReady" />
              <Toggle defaultChecked={settings.portal.notifyAdminOnClientSignature} description="Record a portal alert when the client completes their signature." label="Notify team after client signing" name="notifyAdminOnClientSignature" />
            </div>
          </div>
          <div className="flex justify-end border-t border-border bg-muted/15 px-5 py-4">
            <SubmitButton pendingText="Saving portal preferences..."><Save aria-hidden="true" className="h-4 w-4" />Save portal preferences</SubmitButton>
          </div>
        </form>
      </div>
    </AdminPageSurface>
  );
}
