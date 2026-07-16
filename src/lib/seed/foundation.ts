import { connectToDatabase } from "@/lib/db/mongoose";
import { Types } from "mongoose";
import {
  PERMISSION_DESCRIPTIONS,
  PERMISSIONS,
} from "@/features/authorization/permissions";
import {
  APP_ROLES,
  ROLE_LABELS,
  ROLE_PERMISSION_MATRIX,
  type AppRole,
} from "@/features/authorization/roles";
import { PermissionModel } from "@/models/permission";
import { RoleModel } from "@/models/role";
import { UserModel } from "@/models/user";
import { writeAuditLog } from "@/features/audit/audit-service";
import { hashPassword } from "@/features/auth/password";
import { CommunicationAnnouncementModel } from "@/models/communication-announcement";
import { CommunicationConversationModel } from "@/models/communication-conversation";
import { CommunicationMessageModel } from "@/models/communication-message";
import { CommunicationNotificationModel } from "@/models/communication-notification";
import { seedArchiveData } from "@/lib/seed/archive";
import { seedReportData } from "@/lib/seed/reports";
import { seedTemplateData } from "@/lib/seed/templates";
import { seedWorkflowData } from "@/lib/seed/workflows";
import { seedServiceAndPricingCatalog } from "@/repositories/service-catalog-repository";

type SeedUser = {
  email: string;
  firstName: string;
  lastName: string;
  roleKeys: AppRole[];
};

const seedUsers: SeedUser[] = [
  {
    email: process.env.SEED_ADMIN_EMAIL ?? "admin@ifta.test",
    firstName: "Admin",
    lastName: "Portal",
    roleKeys: ["admin"],
  },
  {
    email: process.env.SEED_STAFF_EMAIL ?? "staff@ifta.test",
    firstName: "Staff",
    lastName: "Portal",
    roleKeys: ["consultant"],
  },
  {
    email: process.env.SEED_CLIENT_EMAIL ?? "client@ifta.test",
    firstName: "Client",
    lastName: "Portal",
    roleKeys: ["client"],
  },
];

type SeededUserRecord = {
  _id: Types.ObjectId;
  email: string;
  firstName?: string;
  lastName?: string;
  roleKeys?: string[];
};

function userName(user: SeededUserRecord) {
  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return name || user.email;
}

function participantFor(user: SeededUserRecord, role: "admin" | "staff" | "client") {
  return {
    userId: user._id,
    role,
    displayName: userName(user),
    email: user.email,
    lastReadAt: null,
  };
}

async function upsertNotification(input: {
  recipientUserId: Types.ObjectId;
  type:
    | "new_message"
    | "new_engagement"
    | "engagement_update"
    | "kyc_update"
    | "document_uploaded"
    | "document_approved"
    | "task_assigned"
    | "invoice_generated"
    | "payment_received"
    | "announcement"
    | "action_required";
  title: string;
  description: string;
  relatedModule:
    | "messages"
    | "engagements"
    | "kyc"
    | "documents"
    | "invoices"
    | "payments"
    | "tasks"
    | "workflows"
    | "announcements"
    | "system";
  relatedRecordId?: string | null;
  actionUrl: string;
  createdByUserId?: Types.ObjectId;
  announcementId?: Types.ObjectId;
}) {
  await CommunicationNotificationModel.updateOne(
    {
      recipientUserId: input.recipientUserId,
      title: input.title,
      actionUrl: input.actionUrl,
    },
    {
      $set: {
        type: input.type,
        description: input.description,
        relatedModule: input.relatedModule,
        relatedRecordId: input.relatedRecordId ?? null,
        createdByUserId: input.createdByUserId ?? null,
        announcementId: input.announcementId ?? null,
        archivedAt: null,
      },
      $setOnInsert: {
        readAt: null,
      },
    },
    { upsert: true },
  ).exec();
}

async function seedCommunicationData() {
  const users = (await UserModel.find({
    email: { $in: seedUsers.map((user) => user.email) },
  })
    .select("email firstName lastName roleKeys")
    .lean()
    .exec()) as SeededUserRecord[];
  const admin = users.find((user) => user.roleKeys?.includes("admin"));
  const staff = users.find((user) => user.roleKeys?.includes("consultant"));
  const client = users.find((user) => user.roleKeys?.includes("client"));

  if (!admin || !staff || !client) {
    return {
      conversations: 0,
      messages: 0,
      notifications: 0,
      announcements: 0,
    };
  }

  const announcement = await CommunicationAnnouncementModel.findOneAndUpdate(
    { title: "IFTA portal communication centre is live" },
    {
      $set: {
        body: "Messages, notifications and announcements are now centralized across the portal.",
        audience: "everyone",
        actionUrl: "/admin/notifications",
        sendEmail: false,
        publishedByUserId: admin._id,
        archivedAt: null,
      },
      $setOnInsert: {
        publishedAt: new Date(),
      },
    },
    { returnDocument: "after", upsert: true },
  ).exec();

  const conversation = await CommunicationConversationModel.findOneAndUpdate(
    { title: "KYC document clarification", relatedModule: "kyc" },
    {
      $set: {
        type: "engagement",
        status: "waiting_for_client",
        participants: [participantFor(admin, "admin"), participantFor(staff, "staff"), participantFor(client, "client")],
        relatedModule: "kyc",
        relatedRecordId: "seed-kyc-001",
        actionUrl: "/admin/messages",
        lastMessagePreview: "Please confirm the updated identification document before review.",
        lastMessageAt: new Date(),
        lastActivityAt: new Date(),
        createdByUserId: admin._id,
        archivedAt: null,
      },
    },
    { returnDocument: "after", upsert: true },
  ).exec();
  const conversationId = conversation._id as Types.ObjectId;
  const announcementId = announcement._id as Types.ObjectId;

  const existingMessage = await CommunicationMessageModel.exists({
    conversationId,
  }).exec();

  if (!existingMessage) {
    await Promise.all([
      CommunicationMessageModel.create({
        conversationId,
        senderUserId: admin._id,
        senderName: userName(admin),
        body: "We received the KYC upload and need one clarification before approval.",
        attachments: [],
        readReceipts: [{ userId: admin._id, readAt: new Date() }],
        deletedAt: null,
      }),
      CommunicationMessageModel.create({
        conversationId,
        senderUserId: staff._id,
        senderName: userName(staff),
        body: "I have checked the document list and marked the missing item for client action.",
        attachments: [],
        readReceipts: [{ userId: staff._id, readAt: new Date() }],
        deletedAt: null,
      }),
    ]);
  }

  await Promise.all([
      {
        recipientUserId: client._id,
        type: "action_required" as const,
        title: "KYC clarification required",
        description: "Confirm the updated identification document before review can continue.",
        relatedModule: "kyc" as const,
        relatedRecordId: "seed-kyc-001",
        actionUrl: "/client/messages",
        createdByUserId: admin._id,
      },
      {
        recipientUserId: staff._id,
        type: "new_message" as const,
        title: "KYC document clarification",
        description: "A client KYC conversation is waiting for follow-up.",
        relatedModule: "messages" as const,
        relatedRecordId: conversationId.toString(),
        actionUrl: "/staff/messages",
        createdByUserId: admin._id,
      },
      {
        recipientUserId: admin._id,
        type: "announcement" as const,
        title: announcement.title,
        description: announcement.body,
        relatedModule: "announcements" as const,
        relatedRecordId: announcementId.toString(),
        actionUrl: "/admin/notifications",
        createdByUserId: admin._id,
        announcementId,
      },
    ].map(upsertNotification),
  );

  return {
    conversations: 1,
    messages: existingMessage ? 0 : 2,
    notifications: 3,
    announcements: 1,
  };
}

export async function seedFoundation() {
  await connectToDatabase();

  await PermissionModel.bulkWrite(
    PERMISSIONS.map((permission) => ({
      updateOne: {
        filter: { key: permission },
        update: {
          $set: {
            description: PERMISSION_DESCRIPTIONS[permission],
          },
        },
        upsert: true,
      },
    })),
  );

  await RoleModel.bulkWrite(
    APP_ROLES.map((role) => ({
      updateOne: {
        filter: { key: role },
        update: {
          $set: {
            label: ROLE_LABELS[role],
            description: `${ROLE_LABELS[role]} role for IFTA Consulting portal access.`,
            permissions: [...ROLE_PERMISSION_MATRIX[role]],
            systemManaged: true,
          },
        },
        upsert: true,
      },
    })),
  );

  const seedPassword = process.env.SEED_USER_PASSWORD ?? "ChangeMe!12345";
  const adminSeedPassword = process.env.SEED_ADMIN_PASSWORD ?? seedPassword;
  const seededUsers = await Promise.all(
    seedUsers.map(async (user) => ({
      ...user,
      passwordHash: await hashPassword(
        user.roleKeys.includes("admin") ? adminSeedPassword : seedPassword,
      ),
    })),
  );

  await UserModel.bulkWrite(
    seededUsers.map((user) => ({
      updateOne: {
        filter: { email: user.email },
        update: {
          $set: {
            email: user.email,
            passwordHash: user.passwordHash,
            firstName: user.firstName,
            lastName: user.lastName,
            roleKeys: user.roleKeys,
            status: "active",
            emailVerifiedAt: new Date(),
            archivedAt: null,
          },
          $setOnInsert: {
            directPermissions: [],
            clientOrganizationIds: [],
            assignedEngagementIds: [],
          },
        },
        upsert: true,
      },
    })),
  );

  await writeAuditLog({
    action: "system.foundation_seeded",
    resourceType: "System",
    resourceId: "foundation",
    newValues: {
      permissions: PERMISSIONS.length,
      roles: APP_ROLES.length,
      users: seedUsers.length,
    },
    metadata: {
      source: "scripts/seed.ts",
    },
  });
  const communication = await seedCommunicationData();
  const workflows = await seedWorkflowData();
  const templates = await seedTemplateData();
  const reports = await seedReportData();
  const archive = await seedArchiveData();
  const catalog = await seedServiceAndPricingCatalog();

  return {
    permissions: PERMISSIONS.length,
    roles: APP_ROLES.length,
    users: seedUsers.length,
    communication,
    workflows,
    templates,
    reports,
    archive,
    catalog,
  };
}
