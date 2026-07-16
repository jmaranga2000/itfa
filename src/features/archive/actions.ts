"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/auth/server";
import {
  RESTORE_TYPES,
  type RestoreType,
} from "@/features/archive/types";
import {
  applyArchiveLegalHold,
  approveArchiveRestore,
  extendArchiveRetention,
  releaseArchiveLegalHold,
  requestArchiveDeletion,
  requestArchiveRestore,
} from "@/repositories/archive-repository";

function parseRestoreType(value: FormDataEntryValue | null): RestoreType {
  const restoreType = String(value ?? "restore_for_viewing");

  if (RESTORE_TYPES.includes(restoreType as RestoreType)) {
    return restoreType as RestoreType;
  }

  return "restore_for_viewing";
}

function revalidateArchive(archiveRecordId?: string) {
  revalidatePath("/admin/archive");

  if (archiveRecordId) {
    revalidatePath(`/admin/archive/${archiveRecordId}`);
  }
}

export async function requestArchiveRestoreAction(formData: FormData) {
  const actor = await requireUser();
  const archiveRecordId = String(formData.get("archiveRecordId") ?? "");
  const restoreReason = String(formData.get("restoreReason") ?? "");
  const restoreType = parseRestoreType(formData.get("restoreType"));

  await requestArchiveRestore({ actor, archiveRecordId, restoreReason, restoreType });
  revalidateArchive(archiveRecordId);
}

export async function approveArchiveRestoreAction(formData: FormData) {
  const actor = await requireUser();
  const requestId = String(formData.get("requestId") ?? "");
  const archiveRecordId = String(formData.get("archiveRecordId") ?? "");
  const decisionReason = String(formData.get("decisionReason") ?? "");

  await approveArchiveRestore({ actor, requestId, decisionReason });
  revalidateArchive(archiveRecordId);
}

export async function applyArchiveLegalHoldAction(formData: FormData) {
  const actor = await requireUser();
  const archiveRecordId = String(formData.get("archiveRecordId") ?? "");
  const reason = String(formData.get("reason") ?? "");

  await applyArchiveLegalHold({ actor, archiveRecordId, reason });
  revalidateArchive(archiveRecordId);
}

export async function releaseArchiveLegalHoldAction(formData: FormData) {
  const actor = await requireUser();
  const holdId = String(formData.get("holdId") ?? "");
  const archiveRecordId = String(formData.get("archiveRecordId") ?? "");
  const removalReason = String(formData.get("removalReason") ?? "");

  await releaseArchiveLegalHold({ actor, holdId, removalReason });
  revalidateArchive(archiveRecordId);
}

export async function extendArchiveRetentionAction(formData: FormData) {
  const actor = await requireUser();
  const archiveRecordId = String(formData.get("archiveRecordId") ?? "");
  const months = Number(formData.get("months") ?? 12);
  const reason = String(formData.get("reason") ?? "");

  await extendArchiveRetention({ actor, archiveRecordId, months, reason });
  revalidateArchive(archiveRecordId);
}

export async function requestArchiveDeletionAction(formData: FormData) {
  const actor = await requireUser();
  const archiveRecordId = String(formData.get("archiveRecordId") ?? "");
  const deletionReason = String(formData.get("deletionReason") ?? "");

  await requestArchiveDeletion({ actor, archiveRecordId, deletionReason });
  revalidateArchive(archiveRecordId);
}
