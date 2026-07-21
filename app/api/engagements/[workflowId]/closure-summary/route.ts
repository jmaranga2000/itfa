import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { getCurrentUser } from "@/features/auth/server";
import { getWorkflowForPrincipal } from "@/repositories/workflow-repository";

function dateLabel(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(new Date(value)) : "Not recorded";
}

function money(currency: string, amount: number) {
  return `${currency} ${amount.toLocaleString("en-KE", { maximumFractionDigits: 2 })}`;
}

function durationLabel(start: string | null, end: string | null) {
  if (!start || !end) return "Not recorded";
  const days = Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000));
  return `${days} day${days === 1 ? "" : "s"}`;
}

function drawWrapped(page: PDFPage, text: string, x: number, y: number, width: number, font: PDFFont, size = 9) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= width) current = candidate;
    else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  lines.slice(0, 5).forEach((line, index) => page.drawText(line, { x, y: y - index * 13, size, font, color: rgb(0.16, 0.2, 0.22) }));
  return y - Math.max(1, Math.min(lines.length, 5)) * 13;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workflowId: string }> },
) {
  const principal = await getCurrentUser();
  if (!principal) return new Response("Unauthorized", { status: 401 });
  if (!principal.roleKeys.some((role) => role === "admin" || role === "super_admin")) {
    return new Response("Forbidden", { status: 403 });
  }
  const { workflowId } = await params;
  const workflow = await getWorkflowForPrincipal(principal, workflowId, true);
  const summary = workflow?.completion.closureSummary;
  if (!workflow || !summary) return new Response("Closure summary not found", { status: 404 });

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const deep = rgb(3 / 255, 54 / 255, 61 / 255);
  const soft = rgb(189 / 255, 217 / 255, 215 / 255);
  const ink = rgb(0.16, 0.2, 0.22);

  page.drawRectangle({ x: 0, y: 742, width: 595, height: 100, color: deep });
  page.drawText("IFTA CONSULTING", { x: 42, y: 796, size: 20, font: bold, color: rgb(1, 1, 1) });
  page.drawText("ENGAGEMENT CLOSURE SUMMARY", { x: 42, y: 769, size: 11, font: regular, color: soft });
  page.drawText(workflow.reference, { x: 410, y: 794, size: 12, font: bold, color: rgb(1, 1, 1) });

  const team = (role: string) => workflow.team.find((member) => member.role === role)?.name ?? "Not assigned";
  const drawSection = (title: string, y: number) => {
    page.drawRectangle({ x: 42, y: y - 5, width: 511, height: 24, color: soft });
    page.drawText(title, { x: 52, y: y + 2, size: 10, font: bold, color: deep });
    return y - 30;
  };
  const drawRows = (rows: Array<[string, string]>, startY: number) => {
    let y = startY;
    for (const [label, value] of rows) {
      page.drawText(label, { x: 52, y, size: 9, font: bold, color: deep });
      page.drawText(value.slice(0, 66), { x: 190, y, size: 9, font: regular, color: ink });
      y -= 18;
    }
    return y;
  };

  let y = drawSection("GENERAL INFORMATION", 710);
  y = drawRows([
    ["Client", workflow.clientName],
    ["Service", workflow.serviceName],
    ["Consultant", team("consultant")],
    ["Reviewer", team("reviewer")],
    ["Finance officer", team("finance_officer")],
    ["Start date", dateLabel(workflow.startDate)],
    ["Completion date", dateLabel(workflow.completion.completedAt)],
    ["Total duration", durationLabel(workflow.startDate, workflow.completion.completedAt)],
  ], y);

  y = drawSection("WORK SUMMARY", y - 4);
  y = drawRows([
    ["Tasks completed", String(summary.totalTasksCompleted)],
    ["Documents uploaded", String(summary.totalDocumentsUploaded)],
    ["Deliverables released", String(summary.totalDeliverablesReleased)],
    ["Internal reviews", String(summary.totalInternalReviews)],
    ["Messages exchanged", String(summary.totalMessages)],
  ], y);

  y = drawSection("FINANCIAL SUMMARY", y - 4);
  y = drawRows([
    ["Total invoiced", money(workflow.financial.currency, summary.totalInvoiced)],
    ["Total paid", money(workflow.financial.currency, summary.totalPaid)],
    ["Outstanding balance", money(workflow.financial.currency, summary.outstandingBalance)],
  ], y);

  y = drawSection("FINAL OUTCOME", y - 4);
  y = drawRows([
    ["Status", workflow.status.replaceAll("_", " ").toUpperCase()],
    ["Approved by", workflow.completion.completedByName || summary.generatedByName],
    ["Generated", dateLabel(summary.generatedAt)],
  ], y);
  page.drawText("Completion notes", { x: 52, y, size: 9, font: bold, color: deep });
  drawWrapped(page, workflow.completion.notes || workflow.completion.summary, 190, y, 350, regular);

  page.drawText("Generated from the permanent IFTA engagement record.", { x: 42, y: 46, size: 8, font: regular, color: deep });
  const bytes = await pdf.save();
  const download = new URL(request.url).searchParams.get("download") === "1";
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${workflow.reference}-closure-summary.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
