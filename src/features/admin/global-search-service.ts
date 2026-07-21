import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { ClientKycSubmissionModel } from "@/models/client-kyc-submission";
import { EngagementRequestModel } from "@/models/engagement-request";
import { QuotationModel } from "@/models/quotation";
import { ServiceCatalogModel } from "@/models/service-catalog";
import { UserModel } from "@/models/user";
import { WorkflowInstanceModel } from "@/models/workflow-instance";

export type AdminSearchResult = {
  id: string;
  category: "Client" | "Staff" | "Request" | "Engagement" | "KYC" | "Service" | "Quotation";
  title: string;
  subtitle: string;
  href: string;
};

type SearchUser = {
  _id: Types.ObjectId;
  email: string;
  firstName?: string;
  lastName?: string;
  roleKeys?: string[];
  status?: string;
};

function safePattern(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function personName(user: SearchUser) {
  return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;
}

function idFilter(query: string) {
  return Types.ObjectId.isValid(query) ? new Types.ObjectId(query) : null;
}

export async function searchAdminPortal(rawQuery: string): Promise<AdminSearchResult[]> {
  const query = rawQuery.trim().slice(0, 80);
  if (query.length < 2) return [];
  await connectToDatabase();

  const expression = new RegExp(safePattern(query), "i");
  const objectId = idFilter(query);
  const userConditions: Array<Record<string, unknown>> = [
    { email: expression },
    { firstName: expression },
    { lastName: expression },
  ];
  if (objectId) userConditions.push({ _id: objectId });

  const matchedUsers = (await UserModel.find({ $or: userConditions })
    .select("email firstName lastName roleKeys status")
    .limit(12)
    .lean()
    .exec()) as unknown as SearchUser[];
  const matchedUserIds = matchedUsers.map((user) => user._id);

  const requestConditions: Array<Record<string, unknown>> = [
    { reference: expression },
    { clientName: expression },
    { clientEmail: expression },
    { "items.serviceTitle": expression },
  ];
  const workflowConditions: Array<Record<string, unknown>> = [
    { reference: expression },
    { clientName: expression },
    { organizationName: expression },
    { serviceName: expression },
  ];
  const serviceConditions: Array<Record<string, unknown>> = [
    { title: expression },
    { slug: expression },
    { summary: expression },
  ];
  const quotationConditions: Array<Record<string, unknown>> = [
    { number: expression },
    { clientName: expression },
    { clientEmail: expression },
  ];
  if (objectId) {
    requestConditions.push({ _id: objectId }, { clientUserId: objectId });
    workflowConditions.push({ _id: objectId }, { clientUserId: objectId }, { engagementId: objectId });
    serviceConditions.push({ _id: objectId });
    quotationConditions.push({ _id: objectId }, { requestId: objectId }, { clientUserId: objectId });
  }
  if (matchedUserIds.length > 0) {
    requestConditions.push({ clientUserId: { $in: matchedUserIds } });
    workflowConditions.push({ clientUserId: { $in: matchedUserIds } });
    quotationConditions.push({ clientUserId: { $in: matchedUserIds } });
  }

  const kycConditions: Array<Record<string, unknown>> = [];
  if (objectId) kycConditions.push({ _id: objectId }, { userId: objectId });
  if (matchedUserIds.length > 0) kycConditions.push({ userId: { $in: matchedUserIds } });
  const kycReferenceSuffix = query.replace(/^KYC-/i, "");
  if (/^KYC-[a-f\d]{2,6}$/i.test(query)) {
    kycConditions.push({
      $expr: {
        $regexMatch: {
          input: { $toString: "$_id" },
          regex: `${safePattern(kycReferenceSuffix)}$`,
          options: "i",
        },
      },
    });
  }

  const [requests, workflows, services, quotations, kycSubmissions] = await Promise.all([
    EngagementRequestModel.find({ $or: requestConditions })
      .select("reference clientName clientEmail status items")
      .sort({ submittedAt: -1 })
      .limit(6)
      .lean()
      .exec(),
    WorkflowInstanceModel.find({ $or: workflowConditions })
      .select("reference clientName serviceName status")
      .sort({ lastActivityAt: -1 })
      .limit(6)
      .lean()
      .exec(),
    ServiceCatalogModel.find({ $or: serviceConditions, archivedAt: null })
      .select("title slug status")
      .sort({ title: 1 })
      .limit(5)
      .lean()
      .exec(),
    QuotationModel.find({ $or: quotationConditions })
      .select("number requestId clientName status currency total")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
      .exec(),
    kycConditions.length > 0
      ? ClientKycSubmissionModel.find({ $or: kycConditions })
          .select("userId status submittedAt")
          .sort({ submittedAt: -1 })
          .limit(5)
          .lean()
          .exec()
      : Promise.resolve([]),
  ]);

  const userDirectory = new Map(matchedUsers.map((user) => [user._id.toString(), user]));
  const missingKycUserIds = kycSubmissions
    .map((submission) => submission.userId)
    .filter((userId) => !userDirectory.has(userId.toString()));
  if (missingKycUserIds.length > 0) {
    const kycUsers = (await UserModel.find({ _id: { $in: missingKycUserIds } })
      .select("email firstName lastName roleKeys status")
      .lean()
      .exec()) as unknown as SearchUser[];
    for (const user of kycUsers) userDirectory.set(user._id.toString(), user);
  }

  const people: AdminSearchResult[] = matchedUsers.map((user) => {
    const isClient = user.roleKeys?.some((role) => ["client", "client_representative"].includes(role)) ?? false;
    return {
      id: user._id.toString(),
      category: isClient ? "Client" : "Staff",
      title: personName(user),
      subtitle: `${user.email} · ${user.status ?? "active"}`,
      href: isClient ? `/admin/clients/${user._id.toString()}` : `/admin/staff/${user._id.toString()}`,
    };
  });
  const requestResults: AdminSearchResult[] = requests.map((request) => ({
    id: request._id.toString(),
    category: "Request",
    title: request.reference,
    subtitle: `${request.clientName} · ${request.items.map((item) => item.serviceTitle).join(", ") || request.status}`,
    href: `/admin/requests/${request._id.toString()}`,
  }));
  const workflowResults: AdminSearchResult[] = workflows.map((workflow) => ({
    id: workflow._id.toString(),
    category: "Engagement",
    title: workflow.reference,
    subtitle: `${workflow.clientName} · ${workflow.serviceName}`,
    href: `/admin/active-engagements/${workflow._id.toString()}?tab=overview`,
  }));
  const kycResults: AdminSearchResult[] = kycSubmissions.flatMap((submission) => {
    const client = userDirectory.get(submission.userId.toString());
    if (!client) return [];
    return [{
      id: submission._id.toString(),
      category: "KYC" as const,
      title: `KYC-${submission._id.toString().slice(-6).toUpperCase()}`,
      subtitle: `${personName(client)} · ${submission.status.replaceAll("_", " ")}`,
      href: `/admin/kyc/client-kyc-${submission._id.toString()}`,
    }];
  });
  const serviceResults: AdminSearchResult[] = services.map((service) => ({
    id: service._id.toString(),
    category: "Service",
    title: service.title,
    subtitle: `${service.slug} · ${service.status}`,
    href: `/admin/services/${service._id.toString()}`,
  }));
  const quotationResults: AdminSearchResult[] = quotations.map((quotation) => ({
    id: quotation._id.toString(),
    category: "Quotation",
    title: quotation.number,
    subtitle: `${quotation.clientName} · ${quotation.currency} ${quotation.total.toLocaleString()}`,
    href: `/admin/quotations/${quotation.requestId.toString()}`,
  }));

  return [
    ...people,
    ...requestResults,
    ...workflowResults,
    ...kycResults,
    ...serviceResults,
    ...quotationResults,
  ].slice(0, 24);
}
