import { LegalDocument } from "@/components/public/legal-document";

const sections = [
  {
    id: "our-commitment",
    title: "Our commitment",
    body: [
      "IFTA Consulting (K) Ltd is committed to providing a public website and secure client portal that can be used by as many people as reasonably possible, including people with disabilities.",
      "We aim to design, develop, and maintain our digital services in a way that supports clear navigation, readable content, keyboard interaction, assistive technologies, and different device sizes.",
      "Accessibility is treated as an ongoing responsibility. We continue to review the website and client portal as features, content, and workflows change.",
    ],
  },
  {
    id: "scope-of-this-statement",
    title: "Scope of this statement",
    body: [
      "This Accessibility Statement applies to IFTA Consulting's public website and the secure client portal used for financial consulting engagements.",
      "The client portal may include account registration, authentication, KYC submission, document exchange, engagement management, tasks, messages, deliverables, invoices, payments, reports, and archived engagement records.",
      "Some content or functionality provided through third-party services may be governed by the accessibility practices of the relevant provider.",
    ],
  },
  {
    id: "accessibility-objectives",
    title: "Accessibility objectives",
    body: [
      "We aim to make our digital services perceivable, operable, understandable, and robust across supported browsers, devices, and assistive technologies.",
      "Our accessibility work is guided by recognised web-accessibility principles and generally accepted interface-design practices.",
    ],
    bullets: [
      "Provide clear page titles, headings, and content structure.",
      "Maintain sufficient contrast between text and backgrounds.",
      "Support keyboard navigation for interactive controls.",
      "Provide visible focus indicators.",
      "Use meaningful labels for forms and controls.",
      "Provide text alternatives for meaningful images.",
      "Avoid relying only on colour to communicate status.",
      "Support responsive layouts across desktop, tablet, and mobile devices.",
      "Present validation and error messages in a clear and understandable manner.",
      "Use semantic HTML wherever reasonably possible.",
    ],
  },
  {
    id: "keyboard-access",
    title: "Keyboard access",
    body: [
      "We aim to ensure that primary website and portal functions can be accessed without requiring a mouse or touch input.",
      "Users should generally be able to move through links, buttons, form fields, menus, dialogs, and other interactive elements using standard keyboard controls.",
      "Focus indicators should remain visible so users can identify the currently selected element.",
    ],
    bullets: [
      "Use the Tab key to move forward between interactive elements.",
      "Use Shift and Tab to move backward.",
      "Use Enter or Space to activate supported controls.",
      "Use Escape to close supported menus or dialogs.",
      "Use arrow keys where supported by the relevant component.",
    ],
  },
  {
    id: "screen-readers-and-assistive-technologies",
    title: "Screen readers and assistive technologies",
    body: [
      "We aim to structure pages so that screen readers and other assistive technologies can interpret headings, landmarks, navigation areas, form fields, tables, alerts, and controls.",
      "Interactive elements should have meaningful accessible names, and decorative icons should not create unnecessary announcements.",
      "Where a complex workflow cannot be made fully accessible immediately, we will consider reasonable alternative ways of providing the relevant information or service.",
    ],
  },
  {
    id: "text-readability",
    title: "Text and readability",
    body: [
      "We aim to use readable typography, clear spacing, descriptive headings, and plain language where appropriate.",
      "Users may use browser controls or operating-system accessibility settings to enlarge text, zoom the page, adjust contrast, or apply other display preferences.",
      "The layout should remain usable at common zoom levels, although some complex tables, reports, or document previews may require horizontal scrolling on smaller screens.",
    ],
  },
  {
    id: "colour-and-contrast",
    title: "Colour and contrast",
    body: [
      "We aim to maintain appropriate contrast between text, controls, icons, borders, and their backgrounds.",
      "Information such as engagement status, review state, payment status, warnings, and validation errors should not be communicated through colour alone.",
      "Where colour is used, it should be supported by text, icons, labels, or other visible indicators.",
    ],
  },
  {
    id: "forms-and-error-messages",
    title: "Forms and error messages",
    body: [
      "Forms may be used for account registration, authentication, client onboarding, KYC submissions, document uploads, engagement requests, payments, and contact enquiries.",
      "We aim to provide visible labels, relevant instructions, accessible validation, and clear error messages.",
      "When a submission fails, the website should identify the affected field or action and provide enough information for the user to correct the issue where reasonably possible.",
    ],
  },
  {
    id: "documents-and-downloads",
    title: "Documents and downloads",
    body: [
      "The website and client portal may contain downloadable documents such as engagement letters, invoices, receipts, financial reports, deliverables, templates, and archived engagement records.",
      "We aim to make documents generated directly by the platform accessible where reasonably possible.",
      "Some documents supplied by clients, third parties, or external systems may not be fully accessible because their structure and formatting are outside our direct control.",
      "Users who experience difficulty accessing a document may contact us to request the information in another reasonably available format.",
    ],
  },
  {
    id: "document-previews",
    title: "Document previews",
    body: [
      "The client portal may provide browser-based previews for PDF files, images, spreadsheets, and other uploaded documents.",
      "Preview functionality may depend on the document format, browser, device, and third-party rendering technology.",
      "Where a preview is not accessible or does not display correctly, users may download the original document or contact us for assistance.",
    ],
  },
  {
    id: "tables-and-financial-information",
    title: "Tables and financial information",
    body: [
      "Financial consulting workflows may include tables containing invoices, payments, reports, tasks, engagement records, and other structured information.",
      "We aim to use table headings, captions, labels, and logical reading order where tables are used to present data.",
      "On smaller screens, wide tables may be presented using horizontal scrolling, stacked layouts, or simplified mobile views.",
    ],
  },
  {
    id: "authentication-and-security",
    title: "Authentication and security",
    body: [
      "Accessibility improvements must operate alongside the security controls required to protect client accounts and confidential financial information.",
      "Authentication, session expiry, verification codes, role-based access, and document permissions may introduce additional steps that are necessary to maintain platform security.",
      "We aim to implement these controls in a way that remains understandable and operable for users relying on assistive technologies.",
    ],
  },
  {
    id: "time-limited-sessions",
    title: "Time-limited sessions",
    body: [
      "The secure client portal may end or lock an authenticated session after a defined period of inactivity or when the maximum session duration is reached.",
      "Session limits help protect client information, particularly when a device is left unattended.",
      "Where practical, the portal should provide a warning before an active session expires and allow the user to continue the session safely.",
    ],
  },
  {
    id: "responsive-design",
    title: "Responsive design",
    body: [
      "The public website and client portal are designed to support common desktop, tablet, and mobile screen sizes.",
      "Some complex financial reports, data tables, document previews, and administrative dashboards may be easier to use on a larger screen.",
      "We continue to improve mobile layouts so that important information and actions remain available without unnecessary loss of functionality.",
    ],
  },
  {
    id: "supported-browsers",
    title: "Supported browsers",
    body: [
      "For the best experience, users should access the website using a current version of a commonly supported browser.",
      "Older browsers may not support modern accessibility, security, or layout features used by the website and client portal.",
      "Users should also keep their operating system, browser, and assistive technologies updated where reasonably possible.",
    ],
  },
  {
    id: "third-party-services",
    title: "Third-party services",
    body: [
      "Some functions may depend on third-party services used for hosting, cloud storage, email delivery, payments, mapping, document rendering, analytics, monitoring, or communications.",
      "Although we consider accessibility when selecting and configuring service providers, we may not control every aspect of a third-party interface.",
      "Accessibility concerns involving an integrated third-party service may be reported to us so that we can investigate and, where appropriate, raise the issue with the provider.",
    ],
  },
  {
    id: "known-limitations",
    title: "Known limitations",
    body: [
      "Despite our efforts, some parts of the website or client portal may not yet be fully accessible.",
      "Potential limitations may include older uploaded documents, complex financial spreadsheets, externally supplied PDFs, embedded third-party tools, document previews, charts, or newly introduced features that have not completed accessibility review.",
      "The presence of a limitation does not mean that it will remain unresolved. We aim to prioritise issues based on their effect on access to essential services.",
    ],
  },
  {
    id: "alternative-access",
    title: "Alternative access",
    body: [
      "If you cannot access information or complete a portal action because of an accessibility barrier, you may contact IFTA Consulting for assistance.",
      "Where reasonably possible, we may provide information in another format, explain a document, support an alternative submission method, or help complete an affected workflow.",
      "Alternative arrangements remain subject to identity verification, confidentiality, information-security requirements, and the nature of the requested service.",
    ],
  },
  {
    id: "reporting-an-accessibility-problem",
    title: "Reporting an accessibility problem",
    body: [
      "We welcome reports about accessibility barriers affecting the public website or secure client portal.",
      "Reports should include enough information to help us identify and reproduce the issue, but users should not include passwords, authentication tokens, verification codes, or confidential financial information unless specifically requested through a secure channel.",
    ],
    bullets: [
      "The page or portal area where the issue occurred.",
      "A description of the problem.",
      "The action you were trying to complete.",
      "The browser, device, or assistive technology being used.",
      "Any error message that appeared.",
      "The format or accommodation that would help you access the information.",
    ],
  },
  {
    id: "response-and-remediation",
    title: "Response and remediation",
    body: [
      "Accessibility reports will be reviewed based on their severity, effect on the user's ability to access essential services, technical complexity, and available remediation options.",
      "Where an immediate technical correction is not possible, we will consider a reasonable temporary alternative.",
      "Resolution times may vary depending on whether the issue affects our own interface, an uploaded document, a third-party integration, or an external service provider.",
    ],
  },
  {
    id: "ongoing-improvement",
    title: "Ongoing improvement",
    body: [
      "Accessibility is considered throughout the design, development, testing, and maintenance of our digital services.",
      "We may review accessibility when introducing new features, changing navigation, updating design components, adding third-party integrations, or modifying key client workflows.",
      "We also use user feedback, internal testing, automated checks, and manual review to identify areas for improvement.",
    ],
  },
  {
    id: "changes-to-this-statement",
    title: "Changes to this statement",
    body: [
      "We may update this Accessibility Statement to reflect changes in our services, technologies, accessibility practices, or applicable requirements.",
      "The latest version will be published on this page with the relevant effective date and last-updated date.",
    ],
  },
  {
    id: "contact-us",
    title: "Contact us",
    body: [
      "To report an accessibility problem, request information in another format, or ask for assistance using the website or client portal, please contact IFTA Consulting through the public Contact page.",
      "Please explain the affected page or workflow and the type of assistance required so that we can respond appropriately.",
    ],
  },
] as const;

export default function AccessibilityPage() {
  return (
    <LegalDocument
      title="Accessibility Statement"
      eyebrow="Inclusive digital access"
      description="Learn how IFTA Consulting works to make its public website and secure financial consulting portal accessible, understandable, and usable."
      effectiveDate="2026-07-25"
      lastUpdated="2026-07-25"
      aside="This statement explains our approach to accessible digital services, known limitations, alternative access, and reporting accessibility barriers."
      sections={sections}
    />
  );
}