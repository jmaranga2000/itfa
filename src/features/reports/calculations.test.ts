import { describe, expect, it } from "vitest";
import {
  calculateDaysOverdue,
  calculateFinancialSnapshot,
  calculateStaffWorkload,
  compareMetric,
  isTaskOverdue,
  previousEquivalentPeriod,
  resolveReportDateRange,
} from "@/features/reports/calculations";

const now = new Date("2026-07-15T12:00:00.000Z");

describe("report date ranges", () => {
  it("resolves last 7 days with inclusive start and end", () => {
    const range = resolveReportDateRange("last_7_days", now);

    expect(range.start.getFullYear()).toBe(2026);
    expect(range.start.getMonth()).toBe(6);
    expect(range.start.getDate()).toBe(9);
    expect(range.end.getDate()).toBe(15);
  });

  it("creates the previous equivalent period", () => {
    const range = resolveReportDateRange("last_7_days", now);
    const previous = previousEquivalentPeriod(range);

    expect(previous.end.getTime()).toBe(range.start.getTime() - 1);
    expect(previous.start.getTime()).toBeLessThan(previous.end.getTime());
  });
});

describe("report comparisons", () => {
  it("treats revenue increases as positive", () => {
    const result = compareMetric(120, 100, { interpretation: "higher_is_better" });

    expect(result.direction).toBe("up");
    expect(result.interpretation).toBe("positive");
    expect(Math.round(result.percentChange)).toBe(20);
  });

  it("treats overdue increases as negative", () => {
    const result = compareMetric(12, 8, { interpretation: "lower_is_better" });

    expect(result.direction).toBe("up");
    expect(result.interpretation).toBe("negative");
  });
});

describe("finance and task calculations", () => {
  it("places overdue balances into the correct aging bucket", () => {
    const snapshot = calculateFinancialSnapshot(
      {
        balanceDue: 1000,
        paymentStatus: "pending",
        dueDate: "2026-05-01T00:00:00.000Z",
      },
      now,
    );

    expect(snapshot.daysOverdue).toBe(76);
    expect(snapshot.agingBucket).toBe("61_90");
    expect(snapshot.overdueBalance).toBe(1000);
  });

  it("does not count completed tasks as overdue", () => {
    expect(
      isTaskOverdue(
        {
          status: "completed",
          dueDate: "2026-07-01T00:00:00.000Z",
        },
        now,
      ),
    ).toBe(false);
    expect(calculateDaysOverdue("2026-07-01T00:00:00.000Z", now)).toBe(15);
  });
});

describe("staff workload", () => {
  it("classifies overloaded staff from workload inputs", () => {
    const workload = calculateStaffWorkload({
      activeEngagements: 4,
      openTasks: 8,
      overdueTasks: 3,
      pendingReviews: 2,
      estimatedHours: 12,
    });

    expect(workload.workloadPercentage).toBeGreaterThanOrEqual(110);
    expect(workload.workloadLevel).toBe("overloaded");
  });
});
