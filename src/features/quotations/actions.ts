"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/features/auth/server";
import { saveAndSendQuotation } from "@/repositories/quotation-repository";

const headerSchema = z.object({
  requestId: z.string().min(1),
  currency: z.string().trim().min(3).max(3),
  validDays: z.coerce.number().int().min(1).max(90),
  taxRate: z.coerce.number().min(0).max(100),
  notes: z.string().trim().max(2000),
  terms: z.string().trim().min(5).max(3000),
  lineCount: z.coerce.number().int().min(1).max(30),
});

function safeBase(value: FormDataEntryValue | null) {
  return String(value) === "/staff/quotations" ? "/staff/quotations" : "/admin/quotations";
}

export async function saveAndSendQuotationAction(formData: FormData) {
  const principal = await requireUser();
  const base = safeBase(formData.get("returnBase"));
  const parsed = headerSchema.safeParse({
    requestId: formData.get("requestId"),
    currency: formData.get("currency"),
    validDays: formData.get("validDays"),
    taxRate: formData.get("taxRate"),
    notes: formData.get("notes") ?? "",
    terms: formData.get("terms") ?? "",
    lineCount: formData.get("lineCount"),
  });
  if (!parsed.success) redirect(`${base}?error=invalid`);
  const lines = Array.from({ length: parsed.data.lineCount }, (_, index) => ({
    serviceId: String(formData.get(`serviceId:${index}`) ?? "") || null,
    description: String(formData.get(`description:${index}`) ?? "").trim(),
    quantity: Number(formData.get(`quantity:${index}`)),
    unitPrice: Number(formData.get(`unitPrice:${index}`)),
  }));
  const quotation = await saveAndSendQuotation({ ...parsed.data, principal, lines });
  if (!quotation) redirect(`${base}/${parsed.data.requestId}?error=quotation`);
  revalidatePath("/admin/quotations");
  revalidatePath("/staff/quotations");
  revalidatePath(`/admin/requests/${parsed.data.requestId}`);
  revalidatePath("/client/quotations");
  revalidatePath("/client/engagements");
  redirect(`${base}/${parsed.data.requestId}?sent=1`);
}
