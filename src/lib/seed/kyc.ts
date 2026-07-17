import { UserModel } from "@/models/user";
import { ClientKycSubmissionModel } from "@/models/client-kyc-submission";

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
  const client = await UserModel.findOne({ email, roleKeys: { $in: ["client", "client_representative"] } })
    .select("_id")
    .lean()
    .exec();

  if (!client) return { submissions: 0 };

  const submittedAt = new Date(Date.now() - 10 * 86_400_000);
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
          },
          {
            r2Key: `seed/kyc/${client._id.toString()}/kra-pin.pdf`,
            filename: "kra-pin.pdf",
            contentType: "application/pdf",
            size: 314_000,
            uploadedAt: submittedAt,
          },
          {
            r2Key: `seed/kyc/${client._id.toString()}/proof-of-address.pdf`,
            filename: "proof-of-address.pdf",
            contentType: "application/pdf",
            size: 526_000,
            uploadedAt: submittedAt,
          },
        ],
        status: "approved",
        submittedAt,
      },
    },
    { upsert: true },
  ).exec();

  return { submissions: 1 };
}
