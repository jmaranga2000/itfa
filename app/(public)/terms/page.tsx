
import { LegalDocument } from "@/components/public/legal-document";

const sections = [
  {
  id: "about-these-terms",
  title: "About these Terms",
  body: [
    "These Terms and Conditions govern access to and use of the public website, secure client portal, and related online services operated by IFTA Consulting (K) Ltd, referred to in these Terms as “IFTA Consulting”, “we”, “us”, or “our”.",
    "They apply to website visitors, prospective clients, registered clients, authorised representatives, and other persons who access or use the platform.",
    "Additional terms may apply to a specific financial consulting engagement. Those additional terms may be contained in an engagement letter, quotation, proposal, statement of work, invoice, or other written agreement accepted by the client.",
  ],
},
  {
    id: "acceptance-of-terms",
    title: "Acceptance of these Terms",
    body: [
      "By accessing the website, creating an account, submitting a service request, accepting an engagement letter, or using the client portal, you confirm that you have read and understood these Terms and agree to comply with them.",
      "If you access the platform on behalf of a company, partnership, trust, organisation, or another person, you confirm that you are authorised to act for that person or entity.",
      "If you do not agree with these Terms, you should not create an account, submit information, or use the secure client portal.",
    ],
  },
  {
    id: "scope-of-platform",
    title: "Scope of the platform",
    body: [
      "The platform supports the requesting, onboarding, administration, delivery, monitoring, and completion of financial consulting engagements.",
      "Platform functions may include account registration, service selection, KYC submission, document exchange, engagement-letter acceptance, electronic signatures, task tracking, messaging, deliverable review, invoicing, payment recording, reporting, completion, and archiving.",
      "The availability of a function does not guarantee that it will apply to every engagement. Features may vary depending on the selected service, engagement scope, client type, account permissions, and platform configuration.",
    ],
  },
  {
    id: "financial-consulting-services",
    title: "Financial consulting services",
    body: [
      "IFTA Consulting provides financial consulting and related professional services according to the scope accepted for each engagement.",
      "Services may include tax advisory, accounting support, financial reporting, financial analysis, finance-process improvement, compliance support, business advisory, and other agreed finance-related services.",
      "The precise services, deliverables, assumptions, responsibilities, fees, and timelines for an engagement are defined in the relevant engagement letter, quotation, proposal, or statement of work.",
    ],
  },
  {
    id: "general-information",
    title: "General website information",
    body: [
      "Information published on the public website is provided for general informational purposes and to describe the types of services that may be available.",
      "Public website content is not a personalised assessment of your financial, tax, accounting, operational, or business circumstances.",
      "You should not make a material financial or business decision solely on the basis of general website content. Advice or recommendations should be considered within the scope, facts, assumptions, limitations, and date stated in the relevant engagement deliverable.",
    ],
  },
  {
    id: "eligibility-and-authority",
    title: "Eligibility and authority",
    body: [
      "You may use the platform only if you have the capacity and authority required to enter into the relevant transaction or act on behalf of the relevant client.",
      "Where an organisation creates or uses an account, the person acting for that organisation must have appropriate authority to submit information, accept documents, approve work, and receive communications.",
      "We may request evidence of identity, authority, ownership, directorship, employment, agency, or other representative capacity before granting or continuing access.",
    ],
  },
  {
    id: "account-registration",
    title: "Account registration",
    body: [
      "Some services require a registered account. You must provide accurate, complete, current, and non-misleading registration information.",
      "You must not create an account using another person's identity, provide an email address you are not authorised to use, or misrepresent your connection to a client or organisation.",
      "We may decline, delay, suspend, or cancel registration where information is incomplete, cannot be verified, appears misleading, or creates a security or compliance concern.",
    ],
  },
  {
    id: "account-security",
    title: "Account security",
    body: [
      "You are responsible for protecting your password, verification codes, authenticated sessions, devices, and other account credentials.",
      "You must not share account credentials or allow another person to use your account. Each user should access the platform through an individually authorised account where separate access is required.",
      "You must notify IFTA Consulting promptly if you suspect that an account, password, verification code, or authenticated session has been accessed or used without authority.",
    ],
    bullets: [
      "Use a strong and unique password.",
      "Keep verification codes and authentication details confidential.",
      "Sign out after using a shared or public device.",
      "Keep browsers, devices, and operating systems updated.",
      "Review unexpected account or engagement activity promptly.",
      "Report suspected unauthorised access without delay.",
    ],
  },
  {
    id: "authorised-users",
    title: "Authorised users and permissions",
    body: [
      "A client may authorise employees, directors, advisers, accountants, finance personnel, or other representatives to access parts of an engagement.",
      "Access may be limited according to assigned roles, engagement responsibilities, document permissions, and administrative controls.",
      "The client is responsible for informing us when an authorised user's role changes or access should be removed.",
      "We may restrict access where a user no longer appears authorised, where an engagement has ended, or where continued access creates a security, confidentiality, or compliance concern.",
    ],
  },
  {
    id: "service-requests",
    title: "Service requests",
    body: [
      "Submitting a service request, adding a service to an engagement cart, completing an enquiry form, or providing preliminary information does not by itself confirm that IFTA Consulting has accepted an engagement.",
      "A request may require administrative review, conflict or suitability checks, KYC completion, clarification of scope, quotation approval, engagement-letter acceptance, invoicing, an advance payment, or other onboarding steps.",
      "We may accept, decline, pause, or request changes to a service request after considering capacity, scope, timing, information availability, professional requirements, and suitability.",
    ],
  },
  {
    id: "kyc-and-verification",
    title: "KYC and verification",
    body: [
      "Before beginning or continuing an engagement, we may require identity, ownership, authority, business-registration, tax-registration, address, source-of-funds, or other verification information.",
      "You must provide complete, accurate, current, and authentic KYC information and documents.",
      "We may request updated or additional information where existing records are incomplete, expired, inconsistent, or no longer sufficient.",
      "An engagement may be delayed, restricted, suspended, or declined if required verification is not completed satisfactorily.",
    ],
  },
  {
    id: "formation-of-engagement",
    title: "Formation of an engagement",
    body: [
      "A professional engagement begins only when IFTA Consulting has accepted the request and any required engagement documents, approvals, verification steps, and payment conditions have been completed.",
      "Electronic acceptance, an approved quotation, an electronically signed engagement letter, written confirmation, or another agreed acceptance method may be used to record formation of the engagement.",
      "The portal may display a status such as requested, pending review, awaiting KYC, awaiting signature, awaiting payment, active, completed, or archived. The displayed status forms part of the administrative record but does not replace the engagement-specific documents.",
    ],
  },
  {
    id: "engagement-specific-terms",
    title: "Engagement-specific terms",
    body: [
      "Each accepted engagement may be governed by an engagement letter, quotation, proposal, statement of work, invoice, or other engagement-specific document.",
      "The engagement-specific terms define matters such as scope, exclusions, deliverables, fees, payment schedule, client responsibilities, assumptions, review procedures, and target timelines.",
      "If these general Terms conflict with an accepted engagement-specific document, the engagement-specific document applies to the relevant professional services to the extent of that conflict.",
    ],
  },
  {
    id: "scope-and-changes",
    title: "Scope and changes",
    body: [
      "We will perform work according to the scope accepted for the engagement.",
      "Requests outside the accepted scope may require additional information, revised timelines, additional fees, or a separate engagement.",
      "A material change to scope should be documented and accepted before it changes the agreed work, responsibilities, fees, or delivery expectations.",
      "Informal discussions, portal messages, or document comments do not automatically amend the engagement unless the change is clearly confirmed by an authorised person.",
    ],
  },
  {
    id: "client-information",
    title: "Client information and cooperation",
    body: [
      "You are responsible for providing complete, accurate, timely, and relevant information needed for the engagement.",
      "Unless otherwise agreed, we may rely on information and documents supplied by you, your authorised users, or identified third parties without independently verifying every item.",
      "You must promptly disclose material facts, errors, omissions, changes, deadlines, notices, or circumstances that may affect the work.",
      "Delays, inaccuracies, or omissions in client information may affect the analysis, fees, conclusions, deliverables, or completion date.",
    ],
  },
  {
    id: "documents-and-records",
    title: "Documents and records",
    body: [
      "You must upload only documents that you are authorised to provide and that are relevant to the engagement.",
      "Documents should be legible, complete, accurate, and provided in a supported format.",
      "We may reject, quarantine, restrict, or remove files that appear corrupted, malicious, irrelevant, unlawful, misleading, or unsafe.",
      "You should retain your own copies of important records. The portal is an engagement-management facility and should not be treated as your only permanent record-keeping system.",
    ],
  },
  {
    id: "deadlines-and-timelines",
    title: "Deadlines and timelines",
    body: [
      "Any delivery date shown on the website, portal, quotation, or engagement workspace is an estimate unless expressly confirmed as a fixed commitment in the engagement-specific terms.",
      "Timelines may depend on timely KYC completion, document submission, client responses, approvals, third-party information, regulatory systems, payment, and the complexity of the work.",
      "We are not responsible for delays caused by incomplete information, late client responses, third-party systems, regulatory authorities, events outside our reasonable control, or approved changes in scope.",
      "You should notify us clearly of any statutory, filing, board, lender, investor, transaction, or management deadline relevant to the engagement.",
    ],
  },
  {
    id: "fees-and-taxes",
    title: "Fees and applicable taxes",
    body: [
      "Fees are determined according to the accepted quotation, engagement letter, proposal, invoice, pricing arrangement, or other written confirmation.",
      "Unless stated otherwise, quoted fees may exclude applicable taxes, government charges, third-party expenses, disbursements, transaction charges, or work outside the agreed scope.",
      "You are responsible for reviewing fee information before accepting the engagement and for raising any question about the pricing basis before work begins.",
    ],
  },
  {
    id: "invoices-and-payment",
    title: "Invoices and payment",
    body: [
      "Invoices are payable according to the payment terms stated on the invoice or in the engagement-specific terms.",
      "We may require an advance payment, deposit, milestone payment, retainer, or full payment before beginning or continuing particular work.",
      "Payment is treated as completed only when cleared funds have been received and correctly allocated.",
      "The client is responsible for providing accurate payment references and notifying us promptly of any disputed or incorrectly allocated payment.",
    ],
  },
  {
    id: "late-or-missed-payments",
    title: "Late or missed payments",
    body: [
      "Where an amount is overdue, we may send reminders, restrict access to affected deliverables, pause work, postpone delivery, suspend the engagement, or take other reasonable recovery steps.",
      "Suspension for non-payment does not cancel amounts already due for completed work, committed resources, approved expenses, or other properly invoiced charges.",
      "Any interest, collection charge, or additional late-payment consequence applies only where it is stated in the engagement-specific terms or otherwise permitted.",
    ],
  },
  {
    id: "cancellations-and-refunds",
    title: "Cancellations and refunds",
    body: [
      "A request to cancel or postpone an engagement should be submitted through the portal or another official communication channel.",
      "Cancellation does not automatically create a right to a full refund. Any refund or credit will depend on the accepted engagement terms, work already performed, resources committed, third-party costs incurred, and applicable requirements.",
      "Where fees were paid for work that has not started, we will review the circumstances and communicate any applicable refund, deduction, credit, or rescheduling arrangement.",
      "Cancellation of one engagement does not automatically cancel another engagement or an outstanding invoice.",
    ],
  },
  {
    id: "electronic-communications",
    title: "Electronic communications",
    body: [
      "You agree that service requests, notices, approvals, invoices, messages, document requests, engagement updates, and other communications may be provided electronically through the portal, email, or another agreed channel.",
      "You are responsible for maintaining accurate contact information and reviewing communications sent to your registered email address or portal account.",
      "A communication may be treated as received when it is made available through the agreed channel, subject to any engagement-specific requirement.",
      "You should verify unusual requests and must not send passwords, verification codes, or authentication tokens through ordinary messages.",
    ],
  },
  {
    id: "electronic-records-and-signatures",
    title: "Electronic records and signatures",
    body: [
      "The platform may allow documents, approvals, acknowledgements, and engagement letters to be accepted or signed electronically.",
      "By using an electronic acceptance or signature function, you confirm that you are authorised to complete the action and intend the action to be associated with the relevant record.",
      "The platform may retain timestamps, account identifiers, document versions, technical records, and audit events relating to electronic acceptance.",
      "You must not apply another person's electronic signature, approval, or account credentials without proper authority.",
    ],
  },
  {
    id: "professional-judgement",
    title: "Professional judgement and assumptions",
    body: [
      "Financial consulting work may require professional judgement based on the information available, the accepted scope, stated assumptions, and conditions existing at the relevant time.",
      "Conclusions may change if the supplied information is incomplete, inaccurate, revised, or affected by later events.",
      "Unless the engagement specifically requires ongoing monitoring, a completed deliverable is not automatically updated after its stated date.",
      "You should inform us when circumstances materially change or when an updated assessment is required.",
    ],
  },
  {
    id: "no-guaranteed-outcome",
    title: "No guaranteed outcome",
    body: [
      "We will perform accepted engagements with reasonable professional care according to the agreed scope.",
      "However, we do not guarantee a particular financial, tax, regulatory, commercial, financing, investment, operational, or business outcome.",
      "Decisions by tax authorities, regulators, banks, investors, auditors, counterparties, government bodies, and other third parties remain outside our control.",
      "Forecasts, budgets, projections, scenarios, and estimates involve assumptions and uncertainty. Actual results may differ materially.",
    ],
  },
  {
    id: "client-decisions",
    title: "Client decisions and implementation",
    body: [
      "The client remains responsible for management decisions, approval of transactions, implementation of recommendations, maintenance of accounting records, internal controls, statutory obligations, and operation of its business.",
      "Our services do not transfer management responsibility to IFTA Consulting unless a particular responsibility is expressly accepted in the engagement-specific terms.",
      "You should consider the relevant assumptions, limitations, risks, and dependencies before implementing a recommendation or relying on a deliverable.",
    ],
  },
  {
    id: "deliverables",
    title: "Deliverables",
    body: [
      "Deliverables may include reports, analyses, financial models, schedules, templates, reconciliations, presentations, memoranda, dashboards, calculations, process recommendations, or other agreed outputs.",
      "A draft deliverable is provided for review and may not be treated as final unless it is clearly marked or released as final.",
      "Client comments and approvals should be provided within the requested review period. Delay in review may affect completion or release.",
      "Only deliverables formally released through the engagement workflow or another approved channel should be treated as final engagement outputs.",
    ],
  },
  {
    id: "use-of-deliverables",
    title: "Use of deliverables",
    body: [
      "Deliverables are prepared for the client, purpose, period, and scope identified in the engagement.",
      "Unless otherwise agreed, a deliverable should not be distributed to or relied upon by an unrelated third party.",
      "A third party does not acquire a duty of care or other entitlement merely because it receives or becomes aware of a deliverable.",
      "You must not alter a final deliverable in a way that misrepresents its source, conclusions, assumptions, date, or scope.",
    ],
  },
  {
    id: "intellectual-property",
    title: "Intellectual property",
    body: [
      "IFTA Consulting retains ownership of its pre-existing methodologies, systems, templates, models, processes, know-how, training materials, software, designs, and general working materials.",
      "Subject to payment of applicable fees, the client may use final engagement deliverables for the internal business purpose for which they were prepared, unless the engagement-specific terms provide otherwise.",
      "Client-provided records, trademarks, information, and original materials remain the property of the client or their respective owner.",
      "Nothing in these Terms transfers ownership of platform software, source code, system designs, or reusable consulting methods.",
    ],
  },
  {
    id: "confidentiality",
    title: "Confidentiality",
    body: [
      "Each party should protect confidential information received in connection with an engagement and use it only for the relevant professional, administrative, security, or compliance purpose.",
      "Confidential information may be disclosed to authorised personnel, professional advisers, service providers, regulators, authorities, or other persons where reasonably necessary, contractually permitted, or required.",
      "Confidentiality obligations do not apply to information that is lawfully public, independently developed, already lawfully known, or properly received from another source without a confidentiality restriction.",
    ],
  },
  {
    id: "privacy-and-personal-data",
    title: "Privacy and personal data",
    body: [
      "Personal data submitted through the website or portal is handled according to our Privacy Policy and applicable data-protection requirements.",
      "You must have an appropriate basis and authority to provide personal data relating to employees, directors, beneficial owners, customers, suppliers, representatives, or other individuals.",
      "You should provide only the personal data reasonably necessary for the requested service and use secure platform channels where available.",
      "Questions about access, correction, objection, deletion, or other personal-data matters should be submitted through the designated contact channel.",
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: [
      "You must use the website and portal lawfully, responsibly, and only for authorised purposes.",
      "You must not interfere with the platform, test its security without permission, misrepresent information, impersonate another person, or use the platform to distribute harmful content.",
    ],
    bullets: [
      "Do not attempt unauthorised access to an account, document, engagement, or system.",
      "Do not introduce malware, malicious scripts, corrupted files, or harmful code.",
      "Do not scrape, probe, scan, overload, or disrupt the platform.",
      "Do not bypass authentication, permissions, rate limits, or security controls.",
      "Do not upload content that you are not authorised to possess or disclose.",
      "Do not use the platform for fraud, deception, harassment, or unlawful activity.",
      "Do not use another person's identity, credentials, signature, or approval without authority.",
    ],
  },
  {
    id: "monitoring-and-audit-records",
    title: "Monitoring and audit records",
    body: [
      "We may record relevant account, authentication, document, communication, approval, payment, workflow, and administrative events for security, operational, compliance, dispute-resolution, and record-management purposes.",
      "Audit information may include user identifiers, timestamps, actions performed, document versions, session information, and related technical records.",
      "Monitoring does not mean that every user action or communication is continuously reviewed.",
    ],
  },
  {
    id: "third-party-services",
    title: "Third-party services",
    body: [
      "The platform may use third-party providers for infrastructure, hosting, file storage, email delivery, payment processing, electronic signatures, monitoring, communications, document rendering, or other operational functions.",
      "Your use of a separately provided third-party service may also be subject to that provider's terms and privacy practices.",
      "We are not responsible for a third-party service outside our reasonable control, but we may take reasonable steps to select, configure, and manage providers according to the function they perform.",
    ],
  },
  {
    id: "external-links",
    title: "External links",
    body: [
      "The public website or portal may contain links to third-party websites, regulators, tax authorities, payment providers, professional resources, or other external services.",
      "A link does not necessarily constitute endorsement, control, or responsibility for the external website's content, availability, security, or practices.",
      "You should review the applicable terms and privacy information before submitting information to an external service.",
    ],
  },
  {
    id: "platform-availability",
    title: "Platform availability",
    body: [
      "We aim to maintain reliable access to the website and client portal, but uninterrupted or error-free availability is not guaranteed.",
      "Access may be affected by maintenance, upgrades, security events, internet failures, hosting incidents, third-party outages, device compatibility, or circumstances outside our reasonable control.",
      "We may temporarily restrict a feature or the entire platform where reasonably necessary for maintenance, security, data protection, compliance, or system integrity.",
    ],
  },
  {
    id: "suspension-and-restriction",
    title: "Suspension and restriction",
    body: [
      "We may suspend, restrict, or revoke account or engagement access where reasonably necessary to protect the platform, client information, other users, or IFTA Consulting.",
      "Reasons may include suspected unauthorised access, credential sharing, incomplete verification, non-payment, prohibited use, false information, expired authority, security threats, or material breach of these Terms.",
      "Where appropriate, we may request corrective action or additional verification before restoring access.",
    ],
  },
  {
    id: "termination",
    title: "Termination of an engagement",
    body: [
      "Either party may end an engagement according to the termination provisions in the engagement-specific terms.",
      "We may end or withdraw from an engagement where continued work would be inappropriate, unsafe, impracticable, unauthorised, unpaid, outside the agreed scope, or inconsistent with applicable professional or compliance requirements.",
      "Termination does not remove obligations relating to accrued fees, completed work, confidentiality, intellectual property, records, data protection, or other provisions intended to continue after termination.",
    ],
  },
  {
    id: "completion-and-archiving",
    title: "Completion and archiving",
    body: [
      "An engagement may be marked completed after the agreed work and required completion steps have been finalised.",
      "Completed engagement records may be moved to a read-only archive and retained according to applicable operational, contractual, professional, security, and record-management requirements.",
      "Archived access may be limited, and some records may remain unavailable through the active workspace.",
      "Archiving does not cancel outstanding fees, confidentiality obligations, agreed usage restrictions, or record-retention requirements.",
    ],
  },
  {
    id: "disclaimers",
    title: "Platform disclaimers",
    body: [
      "The website and portal are provided on an available basis, subject to these Terms and the engagement-specific terms.",
      "To the extent permitted, we do not warrant that every platform function will always be uninterrupted, compatible with every device, or free from technical error.",
      "This disclaimer does not reduce an obligation expressly accepted in an engagement-specific document or exclude a responsibility that cannot properly be excluded.",
    ],
  },
  {
    id: "limitation-of-liability",
    title: "Limitation of liability",
    body: [
      "Any responsibility arising from professional services is subject to the scope, assumptions, exclusions, reliance provisions, and liability terms stated in the relevant engagement-specific document.",
      "To the extent permitted and subject to any engagement-specific terms, IFTA Consulting is not responsible for indirect, incidental, special, or consequential loss arising solely from use of the public website or unauthorised use of an account.",
      "Nothing in these Terms excludes or limits liability where exclusion or limitation is not permitted.",
      "Any specific liability cap, claim period, third-party reliance restriction, or remedy should be stated in the relevant engagement letter and reviewed before acceptance.",
    ],
  },
  {
    id: "events-outside-control",
    title: "Events outside reasonable control",
    body: [
      "Neither party is responsible for delay or failure caused by an event outside its reasonable control, provided reasonable steps are taken to reduce the effect where possible.",
      "Such events may include widespread infrastructure failure, interruption of government or regulatory systems, natural events, civil disruption, cyber incidents, major telecommunications failure, or third-party service outages.",
      "Payment obligations for work already properly completed are not automatically cancelled by such an event.",
    ],
  },
  {
    id: "complaints",
    title: "Questions and complaints",
    body: [
      "Questions or complaints about the website, portal, invoice, engagement administration, or professional services should be submitted through the designated contact channel.",
      "Please provide the engagement reference, relevant date, description of the issue, and the outcome requested.",
      "You must not include passwords, authentication tokens, verification codes, or other secret credentials in a complaint.",
      "We will review the issue and may request further information before responding.",
    ],
  },
  {
    id: "dispute-resolution",
    title: "Dispute resolution",
    body: [
      "The parties should first attempt to resolve a concern through good-faith discussion and the applicable engagement-management or complaint process.",
      "If the matter cannot be resolved informally, any further procedure will be governed by the dispute-resolution provisions in the engagement-specific terms and applicable requirements.",
      "Nothing in these Terms prevents either party from seeking urgent protective relief where reasonably necessary.",
    ],
  },
  {
    id: "governing-law",
    title: "Governing law",
    body: [
      "Unless an engagement-specific document states otherwise, these Terms are governed by the laws of Kenya.",
      "Any forum, jurisdiction, mediation, arbitration, or dispute-resolution arrangement relating to a professional engagement should be determined by the applicable engagement-specific terms.",
    ],
  },
  {
    id: "changes-to-these-terms",
    title: "Changes to these Terms",
    body: [
      "We may update these Terms to reflect changes in our services, platform, security controls, business operations, or applicable requirements.",
      "The updated version will be published on this page with a revised effective date or last-updated date.",
      "Material changes affecting an existing professional engagement will not automatically replace an accepted engagement-specific agreement unless the change is properly incorporated into that engagement.",
    ],
  },
  {
    id: "severability-and-waiver",
    title: "Severability and waiver",
    body: [
      "If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will continue to apply to the extent possible.",
      "A delay or failure to enforce a provision does not automatically waive the right to enforce that provision or another provision later.",
    ],
  },
  {
    id: "entire-agreement",
    title: "Relationship with other documents",
    body: [
      "These Terms, together with the Privacy Policy, Cookie Policy, accepted engagement-specific documents, and any other expressly incorporated terms, form the applicable agreement for use of the website, portal, and related services.",
      "The engagement letter, quotation, proposal, or statement of work remains the primary document for the scope and delivery of a specific professional engagement.",
    ],
  },
  {
    id: "contact-us",
    title: "Contact us",
    body: [
      "Questions about these Terms, account access, service requests, invoices, engagement administration, or platform use may be submitted through the public Contact page or another official communication channel provided by IFTA Consulting.",
      "When contacting us about an existing engagement, include the engagement reference where available, but do not send passwords, verification codes, session tokens, or other secret credentials.",
    ],
  },
] as const;

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms and Conditions"
      eyebrow="Service and platform terms"
      description="The conditions governing access to IFTA Consulting’s website and secure client portal, service requests, financial consulting engagements, payments, communications, and deliverables."
      effectiveDate="2026-07-25"
      lastUpdated="2026-07-25"
      aside="These Terms explain the general conditions for using our digital services. Each accepted financial consulting engagement may also be governed by an engagement letter, quotation, proposal, or statement of work."
      sections={sections}
    />
  );
}





