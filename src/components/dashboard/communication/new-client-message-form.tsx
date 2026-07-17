import Link from "next/link";
import { Send } from "lucide-react";
import { SubmitButton } from "@/components/ui/submit-button";
import { buttonClassName } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AdminDirectoryUser } from "@/repositories/user-repository";

function displayName(client: AdminDirectoryUser) {
  const name = `${client.firstName} ${client.lastName}`.trim();
  return name || client.email;
}

export function NewClientMessageForm({
  action,
  clients,
}: {
  action: (formData: FormData) => Promise<void>;
  clients: AdminDirectoryUser[];
}) {
  return (
    <form action={action}>
      <div className="grid gap-5 p-5">
        <div className="grid gap-2">
          <Label htmlFor="clientUserId">Client</Label>
          <Select id="clientUserId" name="clientUserId" required>
            <option value="">Choose a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {displayName(client)} - {client.email}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            maxLength={180}
            name="subject"
            placeholder="Documents needed for your engagement"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="body">Message</Label>
          <Textarea
            className="min-h-56"
            id="body"
            maxLength={6000}
            name="body"
            placeholder="Write a clear message explaining what the client needs to know or do."
            required
          />
          <p className="text-xs leading-5 text-muted-foreground">
            The full message is stored in the portal. Email contains a short preview and a secure
            portal link.
          </p>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/20 p-4 sm:flex-row sm:justify-end">
        <Link
          className={buttonClassName({ className: "w-full sm:w-auto", variant: "secondary" })}
          href="/admin/messages"
        >
          Cancel
        </Link>
        <SubmitButton className="w-full sm:w-auto" pendingText="Sending message...">
          <Send aria-hidden="true" className="h-4 w-4" />
          Send message
        </SubmitButton>
      </div>
    </form>
  );
}
