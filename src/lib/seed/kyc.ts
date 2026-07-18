import { UserModel } from "@/models/user";
import { ClientKycSubmissionModel } from "@/models/client-kyc-submission";
import { KycRiskRuleModel } from "@/models/kyc-risk-rule";
import { KycTemplateModel } from "@/models/kyc-template";

const seedAnswers = {
  legal_name: "Client Portal",
  nationality: "Kenyan",
  residential_address: "Westlands, Nairobi, Kenya",
  tax_identifier: "A012345678Z",
  source_of_funds: "Business income",
  engagement_purpose: "Tax advisory, compliance review and ongoing consultancy support.",
  politically_exposed: "No",
};

export async function seedKycData() {
  const email = process.env.SEED_CLIENT_EMAIL ?? "client@ifta.test";
  const [client, reviewer, administrator] = await Promise.all([
    UserModel.findOne({ email, roleKeys: { $in: ["client", "client_representative"] } })
      .select("_id")
      .lean()
      .exec(),
    UserModel.findOne({ roleKeys: "reviewer", status: "active", archivedAt: null })
      .select("_id")
      .lean()
      .exec(),
    UserModel.findOne({ roleKeys: { $in: ["admin", "super_admin"] }, status: "active", archivedAt: null })
      .select("_id")
      .lean()
      .exec(),
  ]);

  const templates = [
    { name: "Corporate onboarding - tax advisory", clientType: "Corporate", requirements: 10, mandatory: 8, status: "Published", owner: "Compliance admin" },
    { name: "Returning client refresh", clientType: "Returning client", requirements: 7, mandatory: 6, status: "Published", owner: "Engagement manager" },
    { name: "Individual client onboarding", clientType: "Individual", requirements: 10, mandatory: 10, status: "Published", owner: "Reviewer" },
    { name: "High-risk senior review", clientType: "Corporate", requirements: 12, mandatory: 11, status: "Review", owner: "Senior reviewer" },
  ] as const;
  const riskRules = [
    { rule: "Beneficial owner is politically exposed", risk: "High", action: "Senior review required", owner: "Senior reviewer" },
    { rule: "Company name mismatch", risk: "Elevated", action: "Request replacement or escalate", owner: "Compliance reviewer" },
    { rule: "Expired mandatory identity document", risk: "Standard", action: "Request replacement", owner: "Assigned reviewer" },
    { rule: "Repeated replacement failure", risk: "Elevated", action: "Escalate review", owner: "Engagement manager" },
  ] as const;

  await Promise.all([
    ...templates.map((template) =>
      KycTemplateModel.findOneAndUpdate(
        { name: template.name },
        { $set: { ...template, archivedAt: null } },
        { upsert: true },
      ).exec(),
    ),
    ...riskRules.map((rule) =>
      KycRiskRuleModel.findOneAndUpdate(
        { rule: rule.rule },
        { $set: { ...rule, status: "active" } },
        { upsert: true },
      ).exec(),
    ),
  ]);

  if (!client) return { submissions: 0, templates: templates.length, riskRules: riskRules.length };

  const submittedAt = new Date(Date.now() - 10 * 86_400_000);
  const expiresAt = new Date(Date.now() + 45 * 86_400_000);
  await ClientKycSubmissionModel.findOneAndUpdate(
    { userId: client._id },
    {
      $set: {
        questionnaireVersion: "individual-v1",
        answers: seedAnswers,
        questionnaireComplete: true,
        documents: [
          {
            r2Key: `seed/kyc/${client._id.toString()}/national-id.pdf`,
            filename: "national-id.pdf",
            contentType: "application/pdf",
            size: 842_000,
            uploadedAt: submittedAt,
            documentType: "National identification",
            documentDate: submittedAt,
            expiryDate: expiresAt,
            version: 1,
            checksum: `seed-${client._id.toString()}-national-id`,
            reviewStatus: "approved",
          },
          {
            r2Key: `seed/kyc/${client._id.toString()}/kra-pin.pdf`,
            filename: "kra-pin.pdf",
            contentType: "application/pdf",
            size: 314_000,
            uploadedAt: submittedAt,
            documentType: "KRA tax PIN",
            documentDate: submittedAt,
            version: 1,
            checksum: `seed-${client._id.toString()}-kra-pin`,
            reviewStatus: "approved",
          },
          {
            r2Key: `seed/kyc/${client._id.toString()}/proof-of-address.pdf`,
            filename: "proof-of-address.pdf",
            contentType: "application/pdf",
            size: 526_000,
            uploadedAt: submittedAt,
            documentType: "Proof of address",
            documentDate: submittedAt,
            expiryDate: expiresAt,
            version: 1,
            checksum: `seed-${client._id.toString()}-proof-of-address`,
            reviewStatus: "approved",
          },
        ],
        status: "approved",
        submittedAt,
        assignedReviewerUserId: reviewer?._id ?? null,
        assignedByUserId: administrator?._id ?? null,
        assignedAt: reviewer ? submittedAt : null,
      },
    },
    { upsert: true },
  ).exec();

  return { submissions: 1, templates: templates.length, riskRules: riskRules.length };
}
