import { redirect } from "next/navigation";
import { AdjustmentNoteDetail } from "@/components/dashboard/finance/adjustment-note-detail";
import { hasPermission } from "@/features/authorization/access-control";
import { requireUser } from "@/features/auth/server";
import { getAdjustmentNote } from "@/repositories/adjustment-note-repository";

export default async function AdjustmentNotePage({
  params,
  searchParams,
}: {
  params: Promise<{ noteId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const [principal, { noteId }, query] = await Promise.all([
    requireUser(),
    params,
    searchParams,
  ]);
  const note = await getAdjustmentNote(principal, noteId);
  if (!note) redirect("/access-blocked");
  return (
    <AdjustmentNoteDetail
      canConfirm={hasPermission(principal, "adjustment_note.confirm")}
      note={note}
      query={query}
    />
  );
}
