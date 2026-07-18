import { getCurrentUser } from "@/features/auth/server";
import { getClientEngagementLetter } from "@/repositories/engagement-letter-repository";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] ?? character);
}

function letterBody(content: string) {
  return content.split("\n").map((line) => {
    const value = line.trim();
    if (!value) return "<div class=\"space\"></div>";
    if (value.startsWith("# ")) return `<h1>${escapeHtml(value.slice(2))}</h1>`;
    if (value.startsWith("## ")) return `<h2>${escapeHtml(value.slice(3))}</h2>`;
    return `<p>${escapeHtml(value)}</p>`;
  }).join("");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ letterId: string }> },
) {
  const principal = await getCurrentUser();
  if (!principal) return new Response("Unauthorized", { status: 401 });
  const { letterId } = await params;
  const letter = await getClientEngagementLetter(letterId, principal.id);
  if (!letter) return new Response("Not found", { status: 404 });

  const companyAddress = [letter.company.address, letter.company.city, letter.company.country]
    .filter(Boolean)
    .map(escapeHtml)
    .join(", ");
  const signatures = letter.signers.filter((signer) => signer.required || signer.status === "signed").map((signer) => `
    <section class="signature">
      <strong>${signer.role === "ifta" ? "For IFTA Consulting" : "For the client"}</strong>
      <div class="signature-line">${signer.status === "signed" ? escapeHtml(signer.signatureText ?? signer.name) : "Signature"}</div>
      <p>${escapeHtml(signer.name)}${signer.title ? `, ${escapeHtml(signer.title)}` : ""}</p>
      <small>${signer.signedAt ? `Signed ${escapeHtml(new Date(signer.signedAt).toLocaleDateString("en-KE"))}` : "Date: __________________"}</small>
    </section>
  `).join("");
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${escapeHtml(letter.reference)} - Engagement letter</title>
<style>
  *{box-sizing:border-box}body{margin:0;background:#eef5f4;color:#03363D;font:15px/1.65 Arial,sans-serif}.page{max-width:850px;margin:24px auto;background:#fff;box-shadow:0 8px 30px rgba(3,54,61,.12)}header{display:flex;justify-content:space-between;gap:24px;padding:30px 42px;background:#BDD9D7;border-bottom:5px solid #03363D}.brand{font-size:24px;font-weight:800}.contact{text-align:right;font-size:12px}.meta{display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:24px 42px;border-bottom:1px solid #d8e5e4}.meta div:last-child{text-align:right}.label{margin:0;color:#4e6c70;font-size:11px;font-weight:700;text-transform:uppercase}.body{padding:34px 42px}.body h1{font-size:25px}.body h2{margin-top:28px;padding-bottom:8px;border-bottom:1px solid #d8e5e4;font-size:17px}.body p{margin:8px 0;white-space:pre-wrap}.space{height:5px}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:28px 42px;background:#f5f9f8;border-top:1px solid #d8e5e4}.signature{min-height:150px;padding:18px;border:1px solid #b7cfcd}.signature-line{margin-top:38px;padding-bottom:5px;border-bottom:1px solid #03363D;font:italic 20px Georgia,serif}.signature p{margin:9px 0 2px}.fingerprint{padding:16px 42px;border-top:1px solid #d8e5e4;font:10px/1.4 monospace;word-break:break-all;color:#587276}@media print{body{background:#fff}.page{margin:0;box-shadow:none}}@media(max-width:650px){header,.meta,.signatures{grid-template-columns:1fr;display:grid}.contact,.meta div:last-child{text-align:left}.page{margin:0}.body,header,.meta,.signatures,.fingerprint{padding-left:20px;padding-right:20px}}
</style></head><body><main class="page"><header><div><div class="brand">${escapeHtml(letter.company.tradingName)}</div><div>Professional consulting and advisory services</div></div><div class="contact">${escapeHtml(letter.company.email)}<br>${escapeHtml(letter.company.phone)}<br>${companyAddress}</div></header><section class="meta"><div><p class="label">Prepared for</p><strong>${escapeHtml(letter.clientName)}</strong><br>${escapeHtml(letter.clientEmail)}</div><div><p class="label">Letter reference</p><strong>${escapeHtml(letter.reference)}</strong><br>Issued ${escapeHtml(new Date(letter.generatedAt).toLocaleDateString("en-KE"))}</div></section><section class="body">${letterBody(letter.content)}</section><section class="signatures">${signatures}</section><footer class="fingerprint">Document fingerprint: ${escapeHtml(letter.contentHash)}</footer></main></body></html>`;
  const filename = `${letter.reference.replace(/[^a-zA-Z0-9_-]/g, "-")}-engagement-letter.html`;
  return new Response(html, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
