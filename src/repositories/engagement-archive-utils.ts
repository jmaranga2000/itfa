export function canArchiveEngagementWorkflow(status: string) {
  return ["active", "completed"].includes(status);
}

export function getEngagementArchiveReason(status: string) {
  if (status === "active") {
    return "Engagement archived from the active execution workspace because the work is incomplete or no longer active.";
  }

  return "Engagement completed and archived from the execution workspace.";
}

export type EngagementArchiveLinkedState = {
  documents: Array<{ id: string; status: string }>;
  conversations: Array<{ id: string; status: string; closedAt: string | null }>;
  payments: string[];
  requests: string[];
  quotations: string[];
  staffNotes: string[];
  notifications: string[];
  engagementLetters: string[];
  requestAssignments: string[];
};

function recordValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function stringIds(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.length > 0)
    : [];
}

export function getEngagementArchiveLinkedState(snapshot: unknown): EngagementArchiveLinkedState | null {
  const snapshotRecord = recordValue(snapshot);
  const linkedState = recordValue(snapshotRecord?.linkedState);
  if (!linkedState) return null;

  const documents = Array.isArray(linkedState.documents)
    ? linkedState.documents.flatMap((value) => {
        const item = recordValue(value);
        return typeof item?.id === "string" && typeof item.status === "string"
          ? [{ id: item.id, status: item.status }]
          : [];
      })
    : [];
  const conversations = Array.isArray(linkedState.conversations)
    ? linkedState.conversations.flatMap((value) => {
        const item = recordValue(value);
        return typeof item?.id === "string" && typeof item.status === "string"
          ? [{
              id: item.id,
              status: item.status,
              closedAt: typeof item.closedAt === "string" ? item.closedAt : null,
            }]
          : [];
      })
    : [];

  return {
    documents,
    conversations,
    payments: stringIds(linkedState.payments),
    requests: stringIds(linkedState.requests),
    quotations: stringIds(linkedState.quotations),
    staffNotes: stringIds(linkedState.staffNotes),
    notifications: stringIds(linkedState.notifications),
    engagementLetters: stringIds(linkedState.engagementLetters),
    requestAssignments: stringIds(linkedState.requestAssignments),
  };
}
