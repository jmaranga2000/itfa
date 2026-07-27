export function canArchiveEngagementWorkflow(status: string) {
  return ["active", "completed"].includes(status);
}

export function getEngagementArchiveReason(status: string) {
  if (status === "active") {
    return "Engagement archived from the active execution workspace because the work is incomplete or no longer active.";
  }

  return "Engagement completed and archived from the execution workspace.";
}
