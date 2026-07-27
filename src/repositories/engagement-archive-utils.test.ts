import { describe, expect, it } from "vitest";
import { canArchiveEngagementWorkflow, getEngagementArchiveReason } from "./engagement-archive-utils";

describe("engagement archive helpers", () => {
  it("allows active and completed engagements to be archived", () => {
    expect(canArchiveEngagementWorkflow("active")).toBe(true);
    expect(canArchiveEngagementWorkflow("completed")).toBe(true);
    expect(canArchiveEngagementWorkflow("archived")).toBe(false);
    expect(canArchiveEngagementWorkflow("request")).toBe(false);
  });

  it("returns a reason that reflects whether the archive came from active or completed work", () => {
    expect(getEngagementArchiveReason("active")).toContain("active execution workspace");
    expect(getEngagementArchiveReason("completed")).toContain("completed");
  });
});
