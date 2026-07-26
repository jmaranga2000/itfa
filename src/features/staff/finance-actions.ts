"use server";

import { redirect } from "next/navigation";

export async function approveAndIssueInvoiceAction() {
  redirect("/access-blocked");
}

export async function reviewClientPaymentAction() {
  redirect("/access-blocked");
}
