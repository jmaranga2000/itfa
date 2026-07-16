import type {
  ReportDateRangeKey,
  ReportInterpretation,
  ReportMetricRule,
  ReportTrendDirection,
} from "@/features/reports/types";

export type DateRange = {
  label: string;
  start: Date;
  end: Date;
};

export type ComparisonResult = {
  current: number;
  previous: number;
  absoluteChange: number;
  percentChange: number;
  direction: ReportTrendDirection;
  interpretation: ReportInterpretation;
};

export type FinancialSnapshotInput = {
  balanceDue: number;
  paymentStatus: string;
  dueDate?: Date | string | null;
};

export type FinancialSnapshot = {
  total: number;
  paid: number;
  balance: number;
  overdueBalance: number;
  agingBucket: "current" | "1_30" | "31_60" | "61_90" | "over_90";
  daysOverdue: number;
};

export type TaskLike = {
  status: string;
  dueDate?: Date | string | null;
  priority?: string;
};

export type StaffWorkloadInput = {
  activeEngagements: number;
  openTasks: number;
  overdueTasks: number;
  pendingReviews: number;
  estimatedHours: number;
};

export type StaffWorkloadResult = StaffWorkloadInput & {
  workloadPercentage: number;
  workloadLevel: "available" | "balanced" | "high" | "overloaded";
};

const DAY = 86_400_000;

export function resolveReportDateRange(
  rangeKey: ReportDateRangeKey,
  now = new Date(),
  customStart?: Date,
  customEnd?: Date,
): DateRange {
  const end = endOfDay(now);

  if (rangeKey === "custom" && customStart && customEnd) {
    return {
      label: "Custom range",
      start: startOfDay(customStart),
      end: endOfDay(customEnd),
    };
  }

  if (rangeKey === "today") {
    return { label: "Today", start: startOfDay(now), end };
  }

  if (rangeKey === "last_7_days") {
    return { label: "Last 7 Days", start: startOfDay(addDays(now, -6)), end };
  }

  if (rangeKey === "last_30_days") {
    return { label: "Last 30 Days", start: startOfDay(addDays(now, -29)), end };
  }

  if (rangeKey === "current_month") {
    return {
      label: "Current Month",
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end,
    };
  }

  if (rangeKey === "previous_month") {
    return {
      label: "Previous Month",
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: endOfDay(new Date(now.getFullYear(), now.getMonth(), 0)),
    };
  }

  if (rangeKey === "current_quarter") {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    return {
      label: "Current Quarter",
      start: new Date(now.getFullYear(), quarterStartMonth, 1),
      end,
    };
  }

  if (rangeKey === "previous_quarter") {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    return {
      label: "Previous Quarter",
      start: new Date(now.getFullYear(), quarterStartMonth - 3, 1),
      end: endOfDay(new Date(now.getFullYear(), quarterStartMonth, 0)),
    };
  }

  if (rangeKey === "current_year") {
    return {
      label: "Current Year",
      start: new Date(now.getFullYear(), 0, 1),
      end,
    };
  }

  return {
    label: "Previous Year",
    start: new Date(now.getFullYear() - 1, 0, 1),
    end: endOfDay(new Date(now.getFullYear() - 1, 11, 31)),
  };
}

export function previousEquivalentPeriod(range: DateRange): DateRange {
  const duration = range.end.getTime() - range.start.getTime();
  const previousEnd = new Date(range.start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - duration);

  return {
    label: "Previous Period",
    start: previousStart,
    end: previousEnd,
  };
}

export function compareMetric(
  current: number,
  previous: number,
  rule: Pick<ReportMetricRule, "interpretation">,
): ComparisonResult {
  const absoluteChange = current - previous;
  const percentChange = previous === 0 ? (current === 0 ? 0 : 100) : (absoluteChange / previous) * 100;
  const direction: ReportTrendDirection =
    absoluteChange > 0 ? "up" : absoluteChange < 0 ? "down" : "flat";
  const interpretation = interpretDirection(direction, rule.interpretation);

  return {
    current,
    previous,
    absoluteChange,
    percentChange,
    direction,
    interpretation,
  };
}

export function calculateFinancialSnapshot(
  input: FinancialSnapshotInput,
  now = new Date(),
): FinancialSnapshot {
  const balance = Math.max(0, input.balanceDue);
  const status = input.paymentStatus;
  const paid =
    status === "allocated" || status === "reconciled" || status === "verified"
      ? balance
      : status === "partially_allocated"
        ? Math.round(balance * 0.5)
        : 0;
  const total = balance + paid;
  const daysOverdue = calculateDaysOverdue(input.dueDate, now);

  return {
    total,
    paid,
    balance,
    overdueBalance: daysOverdue > 0 ? balance : 0,
    agingBucket: agingBucket(daysOverdue),
    daysOverdue,
  };
}

export function calculateDaysOverdue(value: Date | string | null | undefined, now = new Date()) {
  if (!value) {
    return 0;
  }

  const dueTime = new Date(value).getTime();

  if (!Number.isFinite(dueTime) || dueTime >= now.getTime()) {
    return 0;
  }

  return Math.ceil((now.getTime() - dueTime) / DAY);
}

export function isTaskOverdue(task: TaskLike, now = new Date()) {
  return (
    task.status !== "completed" &&
    task.status !== "cancelled" &&
    calculateDaysOverdue(task.dueDate, now) > 0
  );
}

export function calculateStaffWorkload(input: StaffWorkloadInput): StaffWorkloadResult {
  const score =
    input.activeEngagements * 12 +
    input.openTasks * 5 +
    input.overdueTasks * 10 +
    input.pendingReviews * 8 +
    input.estimatedHours * 2;
  const workloadPercentage = Math.min(160, Math.round(score));
  const workloadLevel =
    workloadPercentage >= 110
      ? "overloaded"
      : workloadPercentage >= 85
        ? "high"
        : workloadPercentage >= 45
          ? "balanced"
          : "available";

  return {
    ...input,
    workloadPercentage,
    workloadLevel,
  };
}

export function calculateCompletionRate(completed: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((completed / total) * 100);
}

export function calculateAverage(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function interpretDirection(
  direction: ReportTrendDirection,
  rule: ReportMetricRule["interpretation"],
): ReportInterpretation {
  if (direction === "flat" || rule === "neutral") {
    return "neutral";
  }

  if (rule === "higher_is_better") {
    return direction === "up" ? "positive" : "negative";
  }

  return direction === "down" ? "positive" : "negative";
}

function agingBucket(daysOverdue: number): FinancialSnapshot["agingBucket"] {
  if (daysOverdue <= 0) {
    return "current";
  }

  if (daysOverdue <= 30) {
    return "1_30";
  }

  if (daysOverdue <= 60) {
    return "31_60";
  }

  if (daysOverdue <= 90) {
    return "61_90";
  }

  return "over_90";
}

function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * DAY);
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function endOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);
}
