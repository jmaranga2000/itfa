import { Types } from "mongoose";
import { calculateRetentionExpiry } from "@/features/archive/lifecycle";
import type { ArchiveRecordType } from "@/features/archive/types";
import { connectToDatabase } from "@/lib/db/mongoose";
import { ArchiveDeletionRequestModel } from "@/models/archive-deletion-request";
import { ArchiveRecordModel } from "@/models/archive-record";
import { ArchiveRestoreRequestModel } from "@/models/archive-restore-request";
import { ArchiveRetentionPolicyModel } from "@/models/archive-retention-policy";
import { LegalHoldModel } from "@/models/legal-hold";
import { TemplateModel } from "@/models/template";
import { UserModel } from "@/models/user";
import { WorkflowInstanceModel } from "@/models/workflow-instance";
import { writeAuditLog } from "@/features/audit/audit-service";

const day = 86_400_000;

type SeedPolicy = {
  name: string;
  recordType: ArchiveRecordType;
  months: number;
  deletionEligible: boolean;
};

const policies: SeedPolicy[] = [
  { name: "Engagement records - 7 years", recordType: "engagement", months: 84, deletionEligible: true },
  { name: "Client records - 7 years", recordType: "client", months: 84, deletionEligible: true },
  { name: "Signed documents - 10 years", recordType: "document", months: 120, deletionEligible: false },
  { name: "KYC records - 7 years", recordType: "kyc_record", months: 84, deletionEligible: true },
  { name: "Finance records - 7 years", recordType: "invoice", months: 84, deletionEligible: true },
  { name: "Template history - permanent", recordType: "template", months: 240, deletionEligible: false },
  { name: "Staff history - 7 years", recordType: "staff_record", months: 84, deletionEligible: true },
  { name: "Archived messages - 7 years", recordType: "message", months: 84, deletionEligible: true },
];

function userName(user: { email: string; firstName?: string; lastName?: string } | null | undefined) {
  if (!user) {
    return "System";
  }

  return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;
}

function reference(prefix: string, index: number) {
  return `${prefix}-${String(index + 1).padStart(4, "0")}`;
}

export async function seedArchiveData() {
  await connectToDatabase();

  const [admin, workflows, template, staff] = await Promise.all([
    UserModel.findOne({ roleKeys: "admin" }).select("_id email firstName lastName roleKeys").lean().exec(),
    WorkflowInstanceModel.find({}).sort({ lastActivityAt: -1 }).limit(3).lean().exec(),
    TemplateModel.findOne({}).sort({ updatedAt: -1 }).lean().exec(),
    UserModel.findOne({ roleKeys: { $nin: ["client", "client_representative"] } })
      .select("_id email firstName lastName roleKeys")
      .lean()
      .exec(),
  ]);
  const adminId = (admin?._id as Types.ObjectId | undefined) ?? null;
  const adminLabel = userName(admin);
  const policyByType = new Map<ArchiveRecordType, { id: Types.ObjectId; name: string; months: number; deletionEligible: boolean }>();

  for (const policy of policies) {
    const saved = await ArchiveRetentionPolicyModel.findOneAndUpdate(
      { name: policy.name, version: 1 },
      {
        $set: {
          recordType: policy.recordType,
          retentionPeriodMonths: policy.months,
          retentionStartTrigger: "archive_date",
          warningDays: [90, 30, 7, 0],
          legalHoldBehavior: "suspend_expiry",
          restoreEligible: true,
          deletionEligible: policy.deletionEligible,
          requiredApproval: true,
          active: true,
          updatedByUserId: adminId,
          updatedByName: adminLabel,
          disabledAt: null,
        },
      },
      { returnDocument: "after", upsert: true },
    ).exec();

    policyByType.set(policy.recordType, {
      id: saved._id as Types.ObjectId,
      name: saved.name,
      months: saved.retentionPeriodMonths,
      deletionEligible: saved.deletionEligible,
    });
  }

  const workflow = workflows[0] as any;
  const secondWorkflow = workflows[1] as any;
  const now = Date.now();
  const seedRecords = [
    {
      type: "engagement" as const,
      ref: workflow?.reference ?? "IFT-ENG-2026-0042",
      name: workflow ? `${workflow.clientName} ${workflow.serviceName}` : "Amina Holdings KRA Assessment Review",
      clientName: workflow?.clientName ?? "Amina Holdings Ltd",
      engagementReference: workflow?.reference ?? "IFT-ENG-2026-0042",
      serviceName: workflow?.serviceName ?? "KRA Assessment Review",
      originalStatus: "completed",
      status: "archived" as const,
      reason: "Engagement completed, final deliverables confirmed and grace period ended.",
      archivedAt: new Date(now - 45 * day),
      expiry: new Date(now + 80 * day),
      previousLocation: "/admin/workflows",
      clientVisible: true,
      snapshot: {
        workflowHistory: (workflow?.stages ?? []).map((stage: any) => ({
          stage: stage.name,
          status: stage.status,
          duration: `${stage.expectedDurationDays ?? 0} days`,
          blockers: stage.blockedReason ?? "",
        })),
        documents: (workflow?.documents ?? []).map((document: any) => ({
          name: document.name,
          status: document.status,
          version: document.version,
          visibility: document.visibility,
        })),
        messages: [
          { title: "Completion confirmation", sender: "Engagement manager", date: "Archived", status: "Read-only" },
        ],
        finance: [
          {
            invoice: `INV-${workflow?.reference?.replace(/\D/g, "").slice(-5) || "0042"}`,
            status: workflow?.financial?.invoiceStatus ?? "issued",
            balance: workflow?.financial?.balanceDue ?? 0,
            currency: workflow?.financial?.currency ?? "KES",
          },
        ],
        timeline: [
          { title: "Work completed", date: "Completion approved", description: "Final deliverables and finance reviewed." },
          { title: "Workspace archived", date: "Archive date", description: "Workspace moved to read-only archive." },
        ],
      },
    },
    {
      type: "client" as const,
      ref: "CLIENT-AMINA",
      name: workflow?.clientName ?? "Amina Holdings Ltd",
      clientName: workflow?.clientName ?? "Amina Holdings Ltd",
      engagementReference: "",
      serviceName: "Multiple services",
      originalStatus: "inactive",
      status: "read_only" as const,
      reason: "Client inactive with all engagements completed.",
      archivedAt: new Date(now - 40 * day),
      expiry: new Date(now + 220 * day),
      previousLocation: "/admin/clients",
      clientVisible: false,
      snapshot: { timeline: [{ title: "Client archived", date: "Archive date", description: "Client moved out of active operations." }] },
    },
    {
      type: "document" as const,
      ref: "DOC-SIGNED-LETTER",
      name: "Signed engagement letter",
      clientName: workflow?.clientName ?? "Amina Holdings Ltd",
      engagementReference: workflow?.reference ?? "IFT-ENG-2026-0042",
      serviceName: workflow?.serviceName ?? "KRA Assessment Review",
      originalStatus: "final",
      status: "legal_hold" as const,
      reason: "Signed legal document retained with dispute hold.",
      archivedAt: new Date(now - 120 * day),
      expiry: new Date(now + 300 * day),
      previousLocation: "/admin/documents",
      clientVisible: true,
      snapshot: {
        documents: [{ name: "Signed engagement letter.pdf", status: "final", version: 1, visibility: "client" }],
        timeline: [{ title: "Legal hold applied", date: "Review pending", description: "Deletion suspended." }],
      },
    },
    {
      type: "invoice" as const,
      ref: "INV-ARCH-001",
      name: "Archived professional services invoice",
      clientName: secondWorkflow?.clientName ?? "Mavuno Traders",
      engagementReference: secondWorkflow?.reference ?? "IFT-ENG-2026-0048",
      serviceName: secondWorkflow?.serviceName ?? "Tax Advisory",
      originalStatus: "issued",
      status: "retention_expired" as const,
      reason: "Finance record reached configured retention review stage.",
      archivedAt: new Date(now - 400 * day),
      expiry: new Date(now - 5 * day),
      previousLocation: "/admin/invoices",
      clientVisible: true,
      snapshot: {
        finance: [{ invoice: "INV-ARCH-001", status: "issued", balance: secondWorkflow?.financial?.balanceDue ?? 0, currency: "KES" }],
      },
    },
    {
      type: "template" as const,
      ref: template?.slug ?? "standard-engagement-letter",
      name: template?.name ?? "Standard Engagement Letter",
      clientName: "",
      engagementReference: "",
      serviceName: template?.applicableServices?.[0] ?? "General Consultancy",
      originalStatus: "superseded",
      status: "archived" as const,
      reason: "Template superseded by a newer approved version.",
      archivedAt: new Date(now - 20 * day),
      expiry: new Date(now + 600 * day),
      previousLocation: "/admin/templates",
      clientVisible: false,
      snapshot: { timeline: [{ title: "Template retired", date: "Archive date", description: "Not available for new use." }] },
    },
    {
      type: "staff_record" as const,
      ref: staff?.email ?? "former.staff@ifta.test",
      name: userName(staff as any),
      clientName: "",
      engagementReference: "",
      serviceName: "Administration",
      originalStatus: "deactivated",
      status: "archived" as const,
      reason: "Staff account retired while preserving identity history.",
      archivedAt: new Date(now - 75 * day),
      expiry: new Date(now + 150 * day),
      previousLocation: "/admin/staff",
      clientVisible: false,
      snapshot: { timeline: [{ title: "Staff archived", date: "Archive date", description: "Access removed and history retained." }] },
    },
    {
      type: "kyc_record" as const,
      ref: "KYC-ARCH-001",
      name: "Corporate KYC submission",
      clientName: workflow?.clientName ?? "Amina Holdings Ltd",
      engagementReference: workflow?.reference ?? "IFT-ENG-2026-0042",
      serviceName: "Compliance Review",
      originalStatus: "approved",
      status: "archived" as const,
      reason: "KYC version replaced and retained for compliance history.",
      archivedAt: new Date(now - 65 * day),
      expiry: new Date(now + 95 * day),
      previousLocation: "/admin/kyc",
      clientVisible: false,
      snapshot: { timeline: [{ title: "KYC archived", date: "Archive date", description: "Approved KYC record retained." }] },
    },
    {
      type: "message" as const,
      ref: "MSG-ARCH-001",
      name: "Archived completion conversation",
      clientName: workflow?.clientName ?? "Amina Holdings Ltd",
      engagementReference: workflow?.reference ?? "IFT-ENG-2026-0042",
      serviceName: workflow?.serviceName ?? "KRA Assessment Review",
      originalStatus: "resolved",
      status: "archived" as const,
      reason: "Conversation archived with completed engagement workspace.",
      archivedAt: new Date(now - 45 * day),
      expiry: new Date(now + 110 * day),
      previousLocation: "/admin/messages",
      clientVisible: true,
      snapshot: { messages: [{ title: "Completion conversation", sender: "Client and staff", date: "Archived", status: "Resolved" }] },
    },
  ];

  let records = 0;

  for (const [index, seed] of seedRecords.entries()) {
    const policy = policyByType.get(seed.type) ?? policyByType.get("engagement");
    const saved = await ArchiveRecordModel.findOneAndUpdate(
      { archiveReference: reference("ARCH", index) },
      {
        $set: {
          recordId: seed.ref,
          recordType: seed.type,
          recordReference: seed.ref,
          recordName: seed.name,
          clientName: seed.clientName,
          engagementReference: seed.engagementReference,
          serviceName: seed.serviceName,
          originalStatus: seed.originalStatus,
          archiveStatus: seed.status,
          archiveReason: seed.reason,
          archivedByUserId: adminId,
          archivedByName: adminLabel,
          archivedAt: seed.archivedAt,
          retentionPolicyId: policy?.id ?? null,
          retentionPolicyName: policy?.name ?? "General archive retention",
          retentionStartDate: seed.archivedAt,
          retentionExpiryDate: seed.expiry ?? calculateRetentionExpiry(seed.archivedAt, policy?.months ?? 84),
          legalHoldStatus: seed.status === "legal_hold" ? "active" : null,
          legalHoldReason: seed.status === "legal_hold" ? "Dispute review hold." : "",
          restoreEligible: true,
          deleteEligible: Boolean(policy?.deletionEligible),
          deletionStatus: seed.status === "retention_expired" ? "eligible" : "not_eligible",
          readOnly: true,
          previousLocation: seed.previousLocation,
          archiveNotes: seed.reason,
          clientVisible: seed.clientVisible,
          snapshot: seed.snapshot,
        },
      },
      { returnDocument: "after", upsert: true },
    ).exec();

    await writeAuditLog({
      action: "archive.record_seeded",
      resourceType: "ArchiveRecord",
      resourceId: saved._id.toString(),
      newValues: {
        archiveReference: saved.archiveReference,
        recordType: seed.type,
      },
      metadata: { source: "seedArchiveData" },
    });

    records += 1;
  }

  const heldRecord = await ArchiveRecordModel.findOne({ archiveStatus: "legal_hold" }).exec();
  const expiredRecord = await ArchiveRecordModel.findOne({ archiveStatus: "retention_expired" }).exec();
  const engagementRecord = await ArchiveRecordModel.findOne({ recordType: "engagement" }).exec();

  if (heldRecord) {
    await LegalHoldModel.findOneAndUpdate(
      { archiveRecordId: heldRecord._id, status: "active" },
      {
        $set: {
          holdReference: "HOLD-0001",
          recordType: heldRecord.recordType,
          recordId: heldRecord.recordId,
          reason: "Potential dispute review. Deletion suspended.",
          appliedByUserId: adminId,
          appliedByName: adminLabel,
          appliedAt: new Date(now - 15 * day),
          reviewDate: new Date(now + 30 * day),
          expiryDate: null,
          status: "active",
        },
      },
      { upsert: true },
    ).exec();
  }

  if (engagementRecord) {
    await ArchiveRestoreRequestModel.findOneAndUpdate(
      { archiveRecordId: engagementRecord._id, requestReference: "RESTORE-0001" },
      {
        $set: {
          recordType: engagementRecord.recordType,
          recordReference: engagementRecord.recordReference,
          requestedByUserId: adminId,
          requestedByName: adminLabel,
          requestedAt: new Date(now - 2 * day),
          restoreReason: "Temporary viewing access requested for client follow-up.",
          restoreType: "restore_for_viewing",
          approvalStatus: "pending",
          assignedApproverName: adminLabel,
        },
      },
      { upsert: true },
    ).exec();
  }

  if (expiredRecord) {
    await ArchiveDeletionRequestModel.findOneAndUpdate(
      { archiveRecordId: expiredRecord._id, requestReference: "DELETE-0001" },
      {
        $set: {
          recordType: expiredRecord.recordType,
          recordReference: expiredRecord.recordReference,
          retentionExpiryDate: expiredRecord.retentionExpiryDate,
          legalHoldStatus: expiredRecord.legalHoldStatus ?? "",
          requestedByUserId: adminId,
          requestedByName: adminLabel,
          requestedAt: new Date(now - day),
          deletionReason: "Retention expired and finance review requested deletion approval.",
          status: "pending_approval",
          scheduledDeletionDate: new Date(now + 14 * day),
        },
      },
      { upsert: true },
    ).exec();
  }

  return {
    policies: policies.length,
    records,
    legalHolds: heldRecord ? 1 : 0,
    restoreRequests: engagementRecord ? 1 : 0,
    deletionRequests: expiredRecord ? 1 : 0,
  };
}
