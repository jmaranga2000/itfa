import { LegalDocument } from "@/components/public/legal-document";

const sections = [
  {
    title: "Portal and website use",
    body: [
      "The website and portal are provided for requesting, managing and reviewing consulting engagements with IFTA Consulting. Users must provide accurate information and use only accounts they are authorized to access.",
      "Access may be restricted where account security, permission, compliance or engagement status requires it.",
    ],
  },
  {
    title: "Service requests",
    body: [
      "A service request is not confirmation that professional work has started. Requests may require administrative review, KYC completion, quotation approval, engagement-letter acceptance, invoicing or payment before delivery begins.",
      "IFTA Consulting may request additional context where the initial information is not sufficient to determine scope, responsibility or suitability.",
    ],
  },
  {
    title: "Engagement terms",
    body: [
      "Final deliverables, fees, responsibilities and timelines are governed by the accepted engagement letter or approved quotation. Where these terms differ from general website information, the engagement-specific terms apply.",
      "Material changes to scope should be documented and approved before they alter the work, fee or delivery commitment.",
    ],
  },
  {
    title: "User responsibilities",
    body: [
      "Users must protect login credentials, submit information they are authorized to provide and avoid uploading unlawful or malicious content.",
      "Professional advice should be used within the scope and assumptions stated in the relevant deliverable. General website content is informational and does not replace an approved engagement output.",
    ],
  },
] as const;

export default function TermsPage() {
  return (
    <LegalDocument
      description="The conditions governing website access, portal use, service requests and approved consulting engagements."
      eyebrow="Legal and access"
      sections={sections}
      title="Terms and conditions"
    />
  );
}
