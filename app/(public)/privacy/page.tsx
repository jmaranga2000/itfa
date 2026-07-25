import { LegalDocument } from "@/components/public/legal-document";

const sections = [
  {
    id: "about-this-privacy-policy",
    title: "About this Privacy Policy",
    body: [
      "This Privacy Policy explains how IFTA Consulting (K) Ltd collects, uses, stores, shares, protects, and otherwise processes personal data through its public website, secure client portal, communications, and financial consulting services.",
      "In this policy, “IFTA Consulting”, “we”, “us”, and “our” refer to IFTA Consulting (K) Ltd. “You” refers to a website visitor, prospective client, client, authorised representative, portal user, supplier, or other individual whose personal data we process.",
      "This policy should be read together with our Terms and Conditions, Cookie Policy, engagement-specific documents, and any additional privacy notice provided for a particular service or processing activity.",
    ],
  },
  {
    id: "scope-of-this-policy",
    title: "Scope of this policy",
    body: [
      "This policy applies to personal data processed through our public website, secure client portal, service-request process, KYC workflows, engagement management, document exchange, communications, invoicing, payment administration, reporting, completion, and archived engagement records.",
      "It also applies to personal data received through official email, telephone, meetings, approved third-party systems, and other authorised communication channels used in connection with our services.",
      "A separate privacy notice may apply where a specific activity requires additional information or different processing terms.",
    ],
  },
  {
    id: "our-role",
    title: "Our role in processing personal data",
    body: [
      "IFTA Consulting generally acts as a data controller where it determines why and how personal data is processed for account administration, client onboarding, engagement management, communications, billing, security, compliance, and business operations.",
      "In some engagements, we may process personal data on behalf of a client according to the client’s documented instructions. In that context, our respective responsibilities may be addressed in the engagement terms or another appropriate agreement.",
      "The role we perform depends on the processing activity, the agreed service, and the level of control exercised by each party.",
    ],
  },
  {
    id: "information-you-provide",
    title: "Information you provide directly",
    body: [
      "We collect information you provide when you contact us, request a service, create an account, complete onboarding, submit KYC information, upload documents, communicate through the portal, approve work, accept an engagement, or make a payment.",
      "The information requested depends on the service, client type, engagement scope, verification requirements, and your relationship with the client.",
    ],
    bullets: [
      "Names, titles, signatures, and contact details.",
      "Account-registration and authentication information.",
      "Organisation, employment, directorship, or representative details.",
      "Service-request and engagement information.",
      "KYC, identity-verification, and authority documents.",
      "Tax, accounting, financial, and business information.",
      "Documents, messages, comments, approvals, and instructions.",
      "Billing, invoicing, and payment-administration information.",
      "Feedback, enquiries, complaints, and support requests.",
    ],
  },
  {
    id: "identity-and-kyc-information",
    title: "Identity and KYC information",
    body: [
      "We may collect information required to identify a client, beneficial owner, director, authorised representative, account user, or other relevant person.",
      "The information requested may vary depending on whether the client is an individual, company, partnership, trust, nonprofit organisation, or another type of entity.",
    ],
    bullets: [
      "Full legal name and date of birth where relevant.",
      "National identification, passport, or other identity details.",
      "Postal, residential, registered-office, or business address.",
      "Company-registration and tax-registration information.",
      "Director, shareholder, beneficial-owner, trustee, or partner details.",
      "Evidence of authority to act for another person or organisation.",
      "Copies of identity, registration, ownership, and verification documents.",
      "Source-of-funds or related information where reasonably required.",
    ],
  },
  {
    id: "financial-and-tax-information",
    title: "Financial, accounting, and tax information",
    body: [
      "Financial consulting engagements may require us to process information about a client’s finances, accounting records, tax position, operations, transactions, performance, obligations, or business activities.",
      "You should provide only information that is relevant to the engagement and that you are authorised to disclose.",
    ],
    bullets: [
      "Financial statements, trial balances, ledgers, and reconciliations.",
      "Budgets, forecasts, cash-flow information, and management accounts.",
      "Tax registrations, returns, computations, correspondence, and supporting records.",
      "Invoices, receipts, expense records, and transaction information.",
      "Payroll or remuneration information where relevant to the engagement.",
      "Banking or financing information required for analysis or payment administration.",
      "Business plans, financial models, performance reports, and operational data.",
      "Supplier, customer, employee, contractor, or counterparty information contained in client records.",
    ],
  },
  {
    id: "account-and-portal-information",
    title: "Account and portal information",
    body: [
      "When you create or use a portal account, we process information needed to administer the account, authenticate access, apply permissions, and protect restricted information.",
      "Portal records may include account status, assigned role, engagement access, document activity, approvals, messages, workflow actions, and account-security events.",
    ],
    bullets: [
      "Registered email address and user identifier.",
      "Password hash and authentication status.",
      "Verification and password-reset records.",
      "Role, permission, and engagement-assignment information.",
      "Login, logout, session, and security-event records.",
      "Document uploads, downloads, versions, and approvals.",
      "Tasks, messages, comments, and workflow activity.",
      "Account suspension, revocation, or access-change records.",
    ],
  },
  {
    id: "technical-information",
    title: "Technical and usage information",
    body: [
      "We may automatically collect limited technical information when you access the website or client portal.",
      "This information is used to maintain functionality, investigate errors, protect accounts, detect misuse, and understand how the platform performs.",
    ],
    bullets: [
      "Internet Protocol address.",
      "Browser type and version.",
      "Device and operating-system information.",
      "Language, time-zone, and display preferences.",
      "Pages, features, and portal areas accessed.",
      "Dates, times, and duration of relevant activity.",
      "Referral information and navigation events.",
      "Error, diagnostic, security, and audit records.",
    ],
  },
  {
    id: "communications",
    title: "Communications and engagement records",
    body: [
      "We process communications exchanged through the portal, official email, meetings, telephone calls, contact forms, and other approved channels.",
      "Communications may be retained as part of the engagement record where they contain instructions, approvals, decisions, deliverable feedback, payment information, or other relevant information.",
      "We do not recommend sending passwords, verification codes, session tokens, or unnecessary sensitive information through ordinary email or public contact forms.",
    ],
  },
  {
    id: "information-from-other-sources",
    title: "Information received from other sources",
    body: [
      "We may receive personal data from a client, authorised representative, employer, business associate, service provider, public record, regulator, tax authority, professional adviser, payment provider, or another legitimate source.",
      "A client may provide information about directors, employees, beneficial owners, customers, suppliers, contractors, or other individuals where that information is relevant to an engagement.",
      "Where you provide personal data about another person, you should have appropriate authority or another lawful basis to provide it and should ensure that the person receives relevant privacy information where required.",
    ],
  },
  {
    id: "accuracy-of-information",
    title: "Accuracy of information",
    body: [
      "We rely on clients and users to provide information that is accurate, complete, current, and not misleading.",
      "You should notify us promptly if your contact details, authority, ownership information, KYC records, or other relevant information changes.",
      "We may request clarification, supporting evidence, or updated documents where information appears incomplete, inconsistent, outdated, or inaccurate.",
    ],
  },
  {
    id: "how-we-use-information",
    title: "How we use personal data",
    body: [
      "We use personal data only where it is reasonably necessary for an identified business, contractual, security, compliance, or professional purpose.",
      "The exact purposes depend on your relationship with us and the services requested or provided.",
    ],
    bullets: [
      "Responding to enquiries and assessing service requests.",
      "Creating, authenticating, and administering user accounts.",
      "Verifying identity, authority, ownership, and client information.",
      "Preparing quotations, proposals, and engagement letters.",
      "Accepting, activating, and administering engagements.",
      "Delivering tax, accounting, financial, and business-advisory services.",
      "Requesting, reviewing, and exchanging engagement documents.",
      "Managing tasks, messages, reviews, approvals, and deliverables.",
      "Preparing invoices, recording payments, and issuing receipts.",
      "Providing support and responding to complaints.",
      "Protecting accounts, documents, systems, and users.",
      "Maintaining audit trails and professional records.",
      "Improving the reliability and usability of the platform.",
      "Meeting applicable regulatory, tax, accounting, and compliance obligations.",
    ],
  },
  {
    id: "lawful-bases",
    title: "Bases for processing",
    body: [
      "The basis used to process personal data depends on the purpose and circumstances of the processing.",
      "Different processing activities may rely on different bases. Where consent is used, you may withdraw it, although withdrawal does not affect processing that occurred before the withdrawal.",
    ],
    bullets: [
      "Taking steps requested before entering into an engagement.",
      "Performing an accepted engagement or another agreement with you.",
      "Meeting applicable statutory, regulatory, tax, or compliance obligations.",
      "Protecting legitimate business, professional, security, and administrative interests.",
      "Protecting the vital interests of an individual where relevant.",
      "Performing a task supported by another applicable lawful basis.",
      "Obtaining consent where consent is appropriate or required.",
    ],
  },
  {
    id: "failure-to-provide-information",
    title: "When information is required",
    body: [
      "Some information is necessary to create an account, verify identity, establish authority, assess a service request, perform an engagement, issue an invoice, or meet applicable requirements.",
      "If required information is not provided, we may be unable to register an account, accept a service request, complete KYC, begin or continue an engagement, provide a deliverable, or process a requested transaction.",
      "We will aim to distinguish between information that is required and information that is optional where reasonably practical.",
    ],
  },
  {
    id: "sensitive-information",
    title: "Sensitive and high-risk information",
    body: [
      "Certain engagement records may contain sensitive or high-risk information, including identity records, financial information, account details, remuneration records, tax information, signatures, or information about other individuals.",
      "We seek to collect only information reasonably necessary for the relevant purpose and apply additional controls where the nature of the information requires them.",
      "You should not upload medical, biometric, family, political, religious, criminal, or other particularly sensitive information unless it is specifically relevant, requested, and appropriate for the engagement.",
    ],
  },
  {
    id: "automated-processing",
    title: "Automated processing and decision support",
    body: [
      "The platform may use automated functions to support tasks such as account security, workflow routing, reminders, document classification, status updates, or detection of unusual activity.",
      "These functions may assist staff but are not intended to replace professional judgement where a material engagement decision requires human review.",
      "If we introduce processing that makes a significant decision solely through automated means, we will provide appropriate information and controls where required.",
    ],
  },
  {
    id: "how-information-is-shared",
    title: "How personal data may be shared",
    body: [
      "We do not make client information generally available outside the relevant engagement, role, permission, operational, or compliance context.",
      "Personal data may be shared only where reasonably necessary for service delivery, platform operation, security, professional administration, or another appropriate purpose.",
    ],
    bullets: [
      "Authorised IFTA Consulting personnel and assigned engagement team members.",
      "Authorised client users and representatives.",
      "Professional advisers or specialists involved in an engagement where approved or appropriate.",
      "Hosting, infrastructure, storage, email, monitoring, and security providers.",
      "Payment, banking, or transaction-service providers where relevant.",
      "Electronic-signature, document-rendering, or communication providers.",
      "Auditors, insurers, professional advisers, and compliance providers.",
      "Regulators, tax authorities, courts, or public bodies where properly required.",
      "A successor or participant in a legitimate business reorganisation, subject to appropriate safeguards.",
    ],
  },
  {
    id: "service-providers",
    title: "Service providers and processors",
    body: [
      "We may engage service providers to host the platform, store files, deliver email, process payments, monitor system performance, provide security controls, render documents, or support other operational functions.",
      "Service providers are expected to process personal data only for authorised purposes and subject to appropriate confidentiality, security, and contractual requirements.",
      "We assess the function performed, information involved, access required, and safeguards available when selecting and managing service providers.",
    ],
  },
  {
    id: "payment-information",
    title: "Payment information",
    body: [
      "Where electronic payments are supported, payment details may be processed by a bank, payment gateway, mobile-payment provider, or another authorised payment-service provider.",
      "IFTA Consulting may receive transaction references, payer details, amount, payment status, date, and other information needed to allocate and reconcile the payment.",
      "We should not receive or store complete card-security codes or other payment credentials that are intended to remain with the payment provider.",
    ],
  },
  {
    id: "international-transfers",
    title: "Processing and transfers outside Kenya",
    body: [
      "Some service providers or technical systems may process or store personal data outside Kenya.",
      "Where personal data is transferred outside Kenya, we will consider the purpose of the transfer, the recipient, the destination, and the safeguards available.",
      "Appropriate contractual, organisational, technical, or other recognised safeguards should be used where required.",
      "Information about a relevant international provider or transfer may also be provided in an engagement-specific notice or service-provider disclosure.",
    ],
  },
  {
    id: "information-security",
    title: "Information security",
    body: [
      "We use technical and organisational measures intended to protect personal data against unauthorised access, use, disclosure, alteration, destruction, or loss.",
      "Security controls are selected according to the nature of the information, the processing activity, available technology, and reasonably foreseeable risks.",
    ],
    bullets: [
      "Encrypted connections for website and portal traffic.",
      "Password hashing and secure authentication controls.",
      "Role-based and engagement-based access permissions.",
      "Server-side session validation and session expiry.",
      "Restricted document and storage access.",
      "Request validation and protection against automated abuse.",
      "Logging and review of relevant security and audit events.",
      "Backup, restoration, and continuity procedures.",
      "Staff and service-provider confidentiality controls.",
      "Periodic review of permissions, risks, and security practices.",
    ],
  },
  {
    id: "your-security-responsibilities",
    title: "Your security responsibilities",
    body: [
      "Users also have an important role in protecting client information and portal access.",
      "You are responsible for keeping your account credentials, devices, browsers, and authenticated sessions secure.",
    ],
    bullets: [
      "Use a strong and unique password.",
      "Do not share passwords or verification codes.",
      "Do not allow another person to use your account.",
      "Sign out after using a shared or public device.",
      "Keep your device, browser, and operating system updated.",
      "Use protected portal workflows for sensitive documents.",
      "Review unexpected activity and communications carefully.",
      "Report suspected unauthorised access promptly.",
    ],
  },
  {
    id: "data-incidents",
    title: "Personal-data incidents",
    body: [
      "If we identify a personal-data incident, we will assess the nature of the information involved, the likely consequences, the affected systems or individuals, and the measures required to contain and address the incident.",
      "We may preserve relevant logs, restrict access, revoke sessions, reset credentials, restore information, notify service providers, and take other appropriate response measures.",
      "Where notification to an affected person or the relevant authority is required, we will make the notification according to the applicable requirements and the information reasonably available at the time.",
    ],
  },
  {
    id: "retention",
    title: "How long we retain personal data",
    body: [
      "We retain personal data only for as long as it is reasonably necessary for the purpose for which it was collected or for another applicable operational, contractual, professional, security, tax, audit, record-management, or compliance purpose.",
      "Retention periods vary according to the type of record, the engagement, the client relationship, applicable obligations, dispute requirements, and the need to establish or respond to claims.",
      "When information is no longer required, it may be securely deleted, anonymised, restricted, or otherwise handled according to the relevant retention process.",
    ],
  },
  {
    id: "engagement-archives",
    title: "Completed engagements and archives",
    body: [
      "When an engagement is completed, relevant records may be transferred to a restricted or read-only archive.",
      "Archived records may include the engagement letter, KYC records, client documents, deliverables, messages, tasks, approvals, invoices, receipts, payment records, timelines, and audit events.",
      "Archiving supports record integrity, continuity, auditability, professional administration, and the handling of later questions or disputes.",
      "Access to archived records remains subject to appropriate roles, permissions, retention controls, and security requirements.",
    ],
  },
  {
    id: "backups",
    title: "Backups and residual copies",
    body: [
      "Deleted or updated information may remain temporarily in encrypted backups, system logs, or disaster-recovery copies until those copies are rotated or expire.",
      "Backup information is maintained for continuity, security, and restoration purposes and is not intended for ordinary operational use.",
      "Where information must be preserved because of a dispute, investigation, legal hold, or applicable obligation, deletion may be delayed until the preservation requirement ends.",
    ],
  },
  {
    id: "your-rights",
    title: "Your personal-data rights",
    body: [
      "Subject to applicable conditions and limitations, you may request information about how your personal data is used and exercise rights relating to personal data held by us.",
      "A request may be limited or declined where disclosure would affect another person’s rights, reveal confidential information, interfere with an investigation, conflict with an applicable obligation, or where another permitted limitation applies.",
    ],
    bullets: [
      "To be informed about the use of your personal data.",
      "To request access to personal data held about you.",
      "To request correction of inaccurate or misleading information.",
      "To object to or request restriction of particular processing.",
      "To request deletion where continued retention is not justified.",
      "To withdraw consent where processing depends on consent.",
      "To raise concerns about direct marketing where applicable.",
      "To request human review where a significant decision is made solely through automated processing.",
      "To lodge a complaint with the appropriate data-protection authority.",
    ],
  },
  {
    id: "exercising-your-rights",
    title: "How to exercise your rights",
    body: [
      "Privacy requests may be submitted through the public Contact page or another official privacy-contact channel provided by IFTA Consulting.",
      "Your request should describe the information or processing activity concerned and the action you are requesting.",
      "We may request information needed to verify your identity, confirm your authority, locate the relevant records, and protect information from unauthorised disclosure.",
      "Where a representative submits a request, we may require evidence that the representative is authorised to act for the relevant individual.",
    ],
  },
  {
    id: "complaints",
    title: "Privacy questions and complaints",
    body: [
      "You may contact us if you believe personal data has been handled inaccurately, unfairly, insecurely, without an appropriate purpose, or inconsistently with this policy.",
      "Please provide enough information for us to identify the relevant account, engagement, communication, record, or processing activity.",
      "You may also have the right to lodge a complaint with Kenya’s Office of the Data Protection Commissioner.",
      "Do not include passwords, verification codes, session tokens, or other secret credentials in a privacy complaint.",
    ],
  },
  {
    id: "marketing-communications",
    title: "Marketing communications",
    body: [
      "We may send service information, professional updates, event notices, or promotional communications where there is an appropriate basis to do so.",
      "Marketing communications should include a reasonable way to unsubscribe or change preferences where required.",
      "Administrative, security, engagement, invoice, payment, and account communications are not marketing and may still be sent where necessary to provide or protect the service.",
    ],
  },
  {
    id: "cookies",
    title: "Cookies and similar technologies",
    body: [
      "The website and client portal use cookies and similar technologies to maintain authenticated sessions, protect account access, remember preferences, and support reliable platform operation.",
      "Optional analytics, marketing, or personalisation technologies should be subject to appropriate notice and consent controls before they are activated where required.",
      "Further information is provided in our Cookie Policy.",
    ],
  },
  {
    id: "external-links",
    title: "External websites and services",
    body: [
      "The website or portal may contain links to external websites, payment providers, regulators, tax authorities, professional resources, or other third-party services.",
      "This Privacy Policy does not govern a third party’s independent processing activities.",
      "You should review the privacy information provided by an external service before submitting personal data to it.",
    ],
  },
  {
    id: "children",
    title: "Children’s personal data",
    body: [
      "Our website and financial consulting portal are intended primarily for adult business users and authorised organisational representatives.",
      "We do not intentionally invite children to create portal accounts or submit service requests independently.",
      "If information about a child is relevant to an engagement, it should be provided only where there is appropriate authority and a legitimate reason for processing it.",
    ],
  },
  {
    id: "changes-to-this-policy",
    title: "Changes to this Privacy Policy",
    body: [
      "We may update this Privacy Policy to reflect changes in our services, technology, security practices, service providers, business operations, or applicable requirements.",
      "The revised policy will be published on this page with an updated effective date or last-updated date.",
      "Where a change materially affects how personal data is processed, we may provide an additional notice through the website, client portal, email, or another appropriate channel.",
    ],
  },
  {
    id: "contact-us",
    title: "Contact us",
    body: [
      "Questions, requests, or complaints about this Privacy Policy or our handling of personal data may be submitted through the public Contact page or another official privacy-contact channel provided by IFTA Consulting.",
      "When contacting us about an existing client record, include the relevant account or engagement reference where available, but do not send passwords, verification codes, session tokens, or other secret credentials.",
    ],
  },
] as const;

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      eyebrow="Privacy and data protection"
      description="Learn how IFTA Consulting collects, uses, shares, protects, retains, and manages personal data across its public website, secure client portal, and financial consulting services."
      effectiveDate="2026-07-25"
      lastUpdated="2026-07-25"
      aside="This policy explains how personal data is handled across client onboarding, KYC, financial consulting engagements, document exchange, billing, communications, security, and archived records."
      sections={sections}
    />
  );
}