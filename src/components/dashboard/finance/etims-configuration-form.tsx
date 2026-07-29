import Link from "next/link";
import { ArrowLeft, CheckCircle2, PlugZap, Save, ShieldAlert } from "lucide-react";
import {
  migrateLegacyFiscalInvoicesAction,
  saveEtimsConfigurationAction,
  testEtimsConnectionAction,
} from "@/features/etims/actions";
import { AdminPageSurface } from "@/components/dashboard/admin/admin-page-surface";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import type { EtimsConfigurationRecord } from "@/repositories/etims-configuration-repository";

function Toggle({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-4">
      <input className="mt-1 h-4 w-4 accent-primary" defaultChecked={defaultChecked} name={name} type="checkbox" />
      <span><span className="block font-semibold text-foreground">{label}</span><span className="mt-1 block text-sm text-muted-foreground">{description}</span></span>
    </label>
  );
}

export function EtimsConfigurationForm({
  configuration,
  query,
}: {
  configuration: EtimsConfigurationRecord;
  query: { saved?: string; error?: string; test?: string; migrated?: string; review?: string };
}) {
  return (
    <AdminPageSurface
      actions={<Link className={buttonClassName({ variant: "secondary", size: "sm" })} href="/admin/finance/etims"><ArrowLeft className="h-4 w-4" />eTIMS activity</Link>}
      description="Connect IFTA to its approved KRA OSCU or certified integrator. Secret credentials remain in environment variables and are never displayed."
      icon={PlugZap}
      summary={[
        { label: "Integration", value: configuration.enabled ? "Enabled" : "Disabled", helper: configuration.environment, icon: PlugZap },
        { label: "Readiness", value: configuration.readiness.ready ? "Ready" : "Incomplete", helper: configuration.readiness.ready ? "Required settings present" : `${configuration.readiness.missing.length} item(s) missing`, icon: ShieldAlert },
        { label: "Credential", value: configuration.credentialConfigured ? "Available" : "Missing", helper: configuration.credentialReference, icon: CheckCircle2 },
        { label: "Last test", value: configuration.lastConnectionTestSucceeded ? "Passed" : "Not passed", helper: configuration.lastConnectionTestAt ? new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(configuration.lastConnectionTestAt)) : "Not tested", icon: PlugZap },
      ]}
      title="eTIMS connection setup"
    >
      <div className="grid gap-5">
        {query.saved ? <p className="rounded-md border border-success/30 bg-success-soft px-4 py-3 text-sm font-semibold text-success">eTIMS settings were saved.</p> : null}
        {query.test ? <p className={`rounded-md border px-4 py-3 text-sm font-semibold ${query.test === "passed" ? "border-success/30 bg-success-soft text-success" : "border-danger/30 bg-danger-soft text-danger"}`}>{query.test === "passed" ? "Connection test passed." : "Connection test failed. Check the URL, credential, branch, and device details."}</p> : null}
        {query.error ? <p className="rounded-md border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">Settings were not saved. Review the highlighted values and production safeguards.</p> : null}
        {query.migrated ? <p className="rounded-md border border-success/30 bg-success-soft px-4 py-3 text-sm font-semibold text-success">Legacy invoice classification completed: {query.migrated} imported and {query.review ?? "0"} marked for manual reconciliation. No historical transaction was retransmitted.</p> : null}
        {!configuration.readiness.ready ? <div className="rounded-md border border-warning/30 bg-warning-soft p-4"><p className="font-semibold text-foreground">Complete these items before approving invoices</p><ul className="mt-2 grid gap-1 text-sm text-muted-foreground">{configuration.readiness.missing.map((item) => <li key={item}>· {item}</li>)}</ul></div> : null}

        <form action={saveEtimsConfigurationAction} className="grid gap-6">
          <section className="grid gap-4">
            <div><h2 className="text-lg font-semibold text-foreground">Connection</h2><p className="mt-1 text-sm text-muted-foreground">Use sandbox while testing. Production is blocked for debit notes until its mapping is verified.</p></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label htmlFor="environment">Environment</Label><Select className="mt-2" defaultValue={configuration.environment} id="environment" name="environment"><option value="SANDBOX">Sandbox · testing</option><option value="PRODUCTION">Production · live KRA records</option></Select></div>
              <div><Label htmlFor="integrationType">Connection type</Label><Select className="mt-2" defaultValue={configuration.integrationType} id="integrationType" name="integrationType"><option value="DIRECT_OSCU">Direct OSCU</option><option value="CERTIFIED_INTEGRATOR">Certified integrator</option></Select></div>
              <div><Label htmlFor="providerName">Provider name</Label><Input className="mt-2" defaultValue={configuration.providerName} id="providerName" name="providerName" required /></div>
              <div><Label htmlFor="apiBaseUrl">API base URL</Label><Input className="mt-2" defaultValue={configuration.apiBaseUrl} id="apiBaseUrl" name="apiBaseUrl" placeholder="Uses KRA_ETIMS_API_URL when blank" type="url" /></div>
              <div><Label htmlFor="taxpayerPin">IFTA KRA PIN</Label><Input className="mt-2" defaultValue={configuration.taxpayerPin} id="taxpayerPin" name="taxpayerPin" required /></div>
              <div><Label htmlFor="branchId">Branch identifier</Label><Input className="mt-2" defaultValue={configuration.branchId} id="branchId" name="branchId" required /></div>
              <div><Label htmlFor="deviceId">Device or control-unit identifier</Label><Input className="mt-2" defaultValue={configuration.deviceId} id="deviceId" name="deviceId" required /></div>
              <div><Label>Connector credential</Label><div className="mt-2 flex h-10 items-center justify-between rounded-md border border-border bg-muted/30 px-3 text-sm"><span>{configuration.credentialReference}</span><Badge tone={configuration.credentialConfigured ? "green" : "red"}>{configuration.credentialConfigured ? "Configured" : "Missing"}</Badge></div></div>
            </div>
            <div className="grid gap-3 md:grid-cols-2"><Toggle defaultChecked={configuration.enabled} description="Allow approved fiscal records to enter the OSCU queue." label="Enable eTIMS submission" name="enabled" /><Toggle defaultChecked={configuration.taxRegistered} description="Calculate and submit tax values from verified service mappings." label="Tax registered" name="taxRegistered" /></div>
          </section>

          <section className="grid gap-4 border-t border-border pt-6">
            <div><h2 className="text-lg font-semibold text-foreground">Document rules</h2><p className="mt-1 text-sm text-muted-foreground">Prefixes and payment details used in locked fiscal snapshots.</p></div>
            <div className="grid gap-4 md:grid-cols-3">
              <div><Label htmlFor="defaultCurrency">Currency</Label><Input className="mt-2" defaultValue={configuration.defaultCurrency} id="defaultCurrency" maxLength={3} name="defaultCurrency" required /></div>
              <div><Label htmlFor="defaultPaymentType">Payment type</Label><Select className="mt-2" defaultValue={configuration.defaultPaymentType} id="defaultPaymentType" name="defaultPaymentType"><option value="BANK_TRANSFER">Bank transfer</option><option value="MOBILE_MONEY">Mobile money</option><option value="CARD">Card</option><option value="CASH">Cash</option></Select></div>
              <div><Label htmlFor="invoicePrefix">Invoice prefix</Label><Input className="mt-2" defaultValue={configuration.invoicePrefix} id="invoicePrefix" name="invoicePrefix" required /></div>
              <div><Label htmlFor="creditNotePrefix">Credit note prefix</Label><Input className="mt-2" defaultValue={configuration.creditNotePrefix} id="creditNotePrefix" name="creditNotePrefix" required /></div>
              <div><Label htmlFor="debitNotePrefix">Debit note prefix</Label><Input className="mt-2" defaultValue={configuration.debitNotePrefix} id="debitNotePrefix" name="debitNotePrefix" required /></div>
            </div>
          </section>

          <section className="grid gap-4 border-t border-border pt-6">
            <div><h2 className="text-lg font-semibold text-foreground">Connector paths and retries</h2><p className="mt-1 text-sm text-muted-foreground">Use the paths supplied by KRA or the certified integrator.</p></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label htmlFor="salePath">Sales invoice path</Label><Input className="mt-2" defaultValue={configuration.salePath} id="salePath" name="salePath" required /></div>
              <div><Label htmlFor="creditNotePath">Credit note path</Label><Input className="mt-2" defaultValue={configuration.creditNotePath} id="creditNotePath" name="creditNotePath" required /></div>
              <div><Label htmlFor="debitNotePath">Debit note path</Label><Input className="mt-2" defaultValue={configuration.debitNotePath} id="debitNotePath" name="debitNotePath" placeholder="Required only after approved mapping is verified" /></div>
              <div><Label htmlFor="reconciliationPath">Reconciliation path</Label><Input className="mt-2" defaultValue={configuration.reconciliationPath} id="reconciliationPath" name="reconciliationPath" required /></div>
              <div><Label htmlFor="maxAttempts">Maximum automatic attempts</Label><Input className="mt-2" defaultValue={configuration.maxAttempts} id="maxAttempts" max="20" min="1" name="maxAttempts" type="number" required /></div>
              <div><Label htmlFor="initialRetrySeconds">First retry delay · seconds</Label><Input className="mt-2" defaultValue={configuration.initialRetrySeconds} id="initialRetrySeconds" min="10" name="initialRetrySeconds" type="number" required /></div>
            </div>
            <div className="grid gap-3 md:grid-cols-2"><Toggle defaultChecked={configuration.reconciliationEnabled} description="Check uncertain submissions by their idempotency key instead of resending." label="Enable reconciliation" name="reconciliationEnabled" /><Toggle defaultChecked={configuration.debitNoteProductionVerified} description="Turn this on only after the approved KRA or integrator debit-note mapping is documented." label="Production debit mapping verified" name="debitNoteProductionVerified" /></div>
          </section>

          <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
            <SubmitButton pendingText="Saving settings..."><Save className="h-4 w-4" />Save settings</SubmitButton>
          </div>
        </form>
        <div className="flex flex-col gap-3 sm:flex-row">
          <form action={testEtimsConnectionAction}>
            <SubmitButton pendingText="Testing connection..." variant="secondary"><PlugZap className="h-4 w-4" />Test connection</SubmitButton>
          </form>
          <form action={migrateLegacyFiscalInvoicesAction}>
            <SubmitButton pendingText="Classifying legacy invoices..." variant="secondary">Classify legacy invoices</SubmitButton>
          </form>
        </div>
      </div>
    </AdminPageSurface>
  );
}
