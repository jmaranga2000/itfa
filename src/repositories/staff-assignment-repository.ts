import { Types } from "mongoose";
import type { Principal } from "@/features/authorization/access-control";
import { assertPermission } from "@/features/authorization/access-control";
import { writeAuditLog } from "@/features/audit/audit-service";
import { STAFF_ACCOUNT_ROLES } from "@/features/staff/types";
import { getAdminRequest } from "@/content/admin-requests";
import { engagementRequestExists } from "@/repositories/engagement-request-repository";
import { connectToDatabase } from "@/lib/db/mongoose";
import { RequestStaffAssignmentModel } from "@/models/request-staff-assignment";
import { UserModel } from "@/models/user";
import {
  listStaffForAdmin,
  type AdminDirectoryUser,
} from "@/repositories/user-repository";

export type StaffWorkloadRecord = AdminDirectoryUser & {
  requestAssignmentCount: number;
  totalWorkload: number;
  available: boolean;
};

export type RequestStaffAssignmentRecord = {
  requestId: string;
  staffUserId: string;
  staffName: string;
  staffEmail: string;
  assignedAt: string;
};

function staffName(staff: { firstName?: string; lastName?: string; email: string }) {
  return `${staff.firstName ?? ""} ${staff.lastName ?? ""}`.trim() || staff.email;
}

export async function listStaffWorkloadForAdmin() {
  await connectToDatabase();
  const staff = await listStaffForAdmin();
  const staffIds = staff
    .filter((member) => Types.ObjectId.isValid(member.id))
    .map((member) => new Types.ObjectId(member.id));
  const assignments = (await RequestStaffAssignmentModel.aggregate([
    { $match: { staffUserId: { $in: staffIds } } },
    { $group: { _id: "$staffUserId", count: { $sum: 1 } } },
  ]).exec()) as Array<{ _id: Types.ObjectId; count: number }>;
  const counts = new Map(
    assignments.map((assignment) => [assignment._id.toString(), assignment.count]),
  );

  return staff
    .map((member): StaffWorkloadRecord => {
      const requestAssignmentCount = counts.get(member.id) ?? 0;
      const totalWorkload = member.assignedEngagementCount + requestAssignmentCount;
      return {
        ...member,
        requestAssignmentCount,
        totalWorkload,
        available: member.status === "active" && totalWorkload === 0,
      };
    })
    .sort((left, right) => {
      if (left.status === "active" && right.status !== "active") return -1;
      if (left.status !== "active" && right.status === "active") return 1;
      if (left.available !== right.available) return left.available ? -1 : 1;
      if (left.totalWorkload !== right.totalWorkload) {
        return left.totalWorkload - right.totalWorkload;
      }
      return staffName(left).localeCompare(staffName(right));
    });
}

export async function getRequestStaffAssignment(
  requestId: string,
): Promise<RequestStaffAssignmentRecord | null> {
  await connectToDatabase();
  const assignment = await RequestStaffAssignmentModel.findOne({ requestId }).lean().exec();
  if (!assignment) return null;

  const staff = await UserModel.findById(assignment.staffUserId)
    .select("firstName lastName email")
    .lean()
    .exec();
  if (!staff) return null;

  return {
    requestId,
    staffUserId: assignment.staffUserId.toString(),
    staffName: staffName(staff),
    staffEmail: staff.email,
    assignedAt: assignment.assignedAt.toISOString(),
  };
}

export async function assignStaffToRequest(
  requestId: string,
  staffUserId: string,
  actor: Principal,
) {
  assertPermission(actor, "engagements.assign");
  await connectToDatabase();
  if ((!getAdminRequest(requestId) && !(await engagementRequestExists(requestId))) || !Types.ObjectId.isValid(staffUserId)) return false;

  const staff = await UserModel.findOne({
    _id: new Types.ObjectId(staffUserId),
    roleKeys: { $in: STAFF_ACCOUNT_ROLES },
    status: "active",
  })
    .select("firstName lastName email")
    .lean()
    .exec();
  if (!staff) return false;

  const actorId = Types.ObjectId.isValid(actor.id) ? new Types.ObjectId(actor.id) : null;
  if (!actorId) return false;
  const previous = await RequestStaffAssignmentModel.findOne({ requestId }).lean().exec();
  const assignedAt = new Date();

  await RequestStaffAssignmentModel.updateOne(
    { requestId },
    {
      $set: {
        staffUserId: new Types.ObjectId(staffUserId),
        assignedByUserId: actorId,
        assignedAt,
      },
    },
    { upsert: true },
  ).exec();

  await writeAuditLog({
    actor,
    action: previous ? "request.staff_reassigned" : "request.staff_assigned",
    resourceType: "EngagementRequest",
    resourceId: requestId,
    previousValues: previous,
    newValues: {
      staffUserId,
      staffName: staffName(staff),
      assignedAt,
    },
  });

  return true;
}
