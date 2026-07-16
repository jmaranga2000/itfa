import { LegalDocument } from "@/components/public/legal-document";

const sections = [
  {
    title: "Information we collect",
    body: [
      "IFTA Consulting collects information needed to respond to enquiries, create and secure accounts, manage engagements, perform KYC checks, exchange documents, issue invoices and maintain professional records.",
      "The information collected depends on the service and may include identity, organization, contact, engagement, billing and communication details.",
    ],
  },
  {
    title: "How information is used",
    body: [
      "Information is used to assess service requests, deliver approved engagements, communicate required actions, meet professional obligations and protect the integrity of the portal.",
      "Client information is not made available outside the relevant role, permission or engagement context without an appropriate operational or legal basis.",
    ],
  },
  {
    title: "Security and access",
    body: [
      "Access to client information is limited through account authentication, role-based permissions and engagement assignment. Sensitive documents should be uploaded only through protected portal workflows.",
      "Users are responsible for protecting their credentials and reporting suspected unauthorized access promptly.",
    ],
  },
  {
    title: "Retention and enquiries",
    body: [
      "Operational records may be retained where required for legal, tax, compliance, audit and professional-services obligations. Records that no longer have an applicable purpose should be handled according to the relevant retention process.",
      "Questions about privacy or a specific client record can be submitted through the contact page for appropriate review.",
    ],
  },
] as const;

export default function PrivacyPage() {
  return (
    <LegalDocument
      description="How personal, organization and engagement information is collected, used, protected and retained across IFTA Consulting services."
      eyebrow="Legal and privacy"
      sections={sections}
      title="Privacy policy"
    />
  );
}
