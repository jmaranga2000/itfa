import { Download, Eye, FileText } from "lucide-react";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { EngagementLetterRecord } from "@/repositories/engagement-letter-repository";

export function EngagementLetterFiles({ letter }: { letter: EngagementLetterRecord }) {
  const pdfHref = `/api/engagement-letters/${letter.id}/pdf`;
  return (
    <Card>
      <CardHeader className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <CardTitle>Letter files</CardTitle>
          <CardDescription>Preview the generated PDF or download a signed PDF and editable Microsoft Word copy.</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className={buttonClassName({ variant: "secondary", size: "sm" })} href={pdfHref} rel="noreferrer" target="_blank"><Eye aria-hidden="true" className="h-4 w-4" />Open PDF</a>
          <a className={buttonClassName({ variant: "secondary", size: "sm" })} href={`${pdfHref}?download=1`}><Download aria-hidden="true" className="h-4 w-4" />PDF</a>
          <a className={buttonClassName({ variant: "secondary", size: "sm" })} href={`/api/engagement-letters/${letter.id}/docx`}><FileText aria-hidden="true" className="h-4 w-4" />Word</a>
        </div>
      </CardHeader>
      <CardContent>
        <iframe className="h-[720px] w-full border border-border bg-white" src={pdfHref} title={`PDF preview for ${letter.reference}`} />
      </CardContent>
    </Card>
  );
}
