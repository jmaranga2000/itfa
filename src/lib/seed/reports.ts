import { Types } from "mongoose";
import { REPORT_CATEGORY_META } from "@/features/reports/types";
import { connectToDatabase } from "@/lib/db/mongoose";
import { ReportExportModel } from "@/models/report-export";
import { ReportSavedViewModel } from "@/models/report-saved-view";
import { ReportScheduleModel } from "@/models/report-schedule";
import { UserModel } from "@/models/user";

const day = 86_400_000;

export async function seedReportData() {
  await connectToDatabase();

  const admin = await UserModel.findOne({ roleKeys: "admin" })
    .select("_id email firstName lastName")
    .lean()
    .exec();
  const adminId = (admin?._id as Types.ObjectId | undefined) ?? null;
  const adminName =
    `${admin?.firstName ?? ""} ${admin?.lastName ?? ""}`.trim() || admin?.email || "System";
  const savedReports = [
    {
      name: "Weekly Engagement Summary",
      reportKey: "engagement-register",
      category: "engagements" as const,
      description: "Active engagements, overdue work and at-risk delivery items.",
      filters: { dateRange: "last_7_days", status: "active" },
    },
    {
      name: "Monthly Finance Overview",
      reportKey: "finance-overview",
      category: "finance" as const,
      description: "Revenue, outstanding balances and invoice aging for management review.",
      filters: { dateRange: "current_month" },
    },
    {
      name: "Executive Risk Watch",
      reportKey: "executive-overview",
      category: "executive" as const,
      description: "Director view of risk, finance and operational attention points.",
      filters: { dateRange: "last_30_days", riskLevel: "high" },
    },
  ];

  for (const report of savedReports) {
    await ReportSavedViewModel.findOneAndUpdate(
      { name: report.name, reportKey: report.reportKey },
      {
        $set: {
          description: report.description,
          category: report.category,
          dataSource: report.reportKey,
          filters: report.filters,
          columns: [],
          grouping: [],
          sorting: {},
          chartConfiguration: {},
          dateRangeKey: report.filters.dateRange,
          comparisonEnabled: true,
          visibility: "all_authorized_admins",
          ownerUserId: adminId,
          ownerName: adminName,
          sharedRole: "admin",
          lastOpenedAt: new Date(Date.now() - 2 * day),
          archivedAt: null,
        },
      },
      { upsert: true },
    ).exec();
  }

  const weekly = await ReportSavedViewModel.findOne({ name: "Weekly Engagement Summary" }).exec();

  await ReportScheduleModel.findOneAndUpdate(
    { name: "Weekly Engagement Summary Delivery" },
    {
      $set: {
        savedReportId: weekly?._id ?? null,
        reportKey: "engagement-register",
        recipients: [admin?.email ?? "admin@ifta.test"],
        frequency: "weekly",
        deliveryTime: "08:00",
        timezone: "Africa/Nairobi",
        exportFormat: "xlsx",
        emailSubject: "Weekly Engagement Summary",
        active: true,
        lastDeliveredAt: new Date(Date.now() - 7 * day),
        nextDeliveryAt: new Date(Date.now() + 2 * day),
        createdByUserId: adminId,
      },
    },
    { upsert: true },
  ).exec();

  for (const report of savedReports) {
    await ReportExportModel.findOneAndUpdate(
      { reportKey: report.reportKey, reportName: REPORT_CATEGORY_META[report.category].label },
      {
        $set: {
          category: report.category,
          filters: report.filters,
          format: report.category === "finance" ? "pdf" : "xlsx",
          generatedByUserId: adminId,
          generatedByName: adminName,
          status: "completed",
          fileReference: `seed://${report.reportKey}`,
          expiresAt: new Date(Date.now() + 30 * day),
          deletedAt: null,
        },
      },
      { upsert: true },
    ).exec();
  }

  return {
    savedReports: savedReports.length,
    schedules: 1,
    exports: savedReports.length,
  };
}
