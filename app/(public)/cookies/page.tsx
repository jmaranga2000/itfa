import { LegalDocument } from "@/components/public/legal-document";

const sections = [
  {
    id: "about-this-cookie-policy",
    title: "About this Cookie Policy",
    body: [
      "This Cookie Policy explains how IFTA Consulting (K) Ltd uses cookies and similar browser technologies when you visit our public website, create an account, sign in to the client portal, or use our online financial consulting services.",
      "Cookies help us provide secure account access, maintain authenticated sessions, remember selected preferences, protect the platform from misuse, and improve the reliability of the website.",
      "This policy should be read together with our Privacy Policy and Terms of Service.",
    ],
  },
  {
    id: "what-cookies-are",
    title: "What cookies are",
    body: [
      "Cookies are small text files stored by your web browser on your computer, mobile phone, tablet, or other device when you visit a website.",
      "Cookies may contain a randomly generated identifier, preference value, session reference, expiry date, or other limited information required to operate the website.",
      "Cookies cannot independently install software, execute programs, or access unrelated files stored on your device.",
    ],
  },
  {
    id: "why-we-use-cookies",
    title: "Why we use cookies",
    body: [
      "We use cookies and similar technologies to provide essential website functionality, maintain secure authenticated sessions, protect client accounts, preserve selected preferences, and support reliable navigation across the platform.",
      "Because the client portal may contain confidential tax, accounting, financial reporting, engagement, invoice, payment, and client-document information, some cookies are necessary to protect access to restricted areas.",
      "We do not use cookies to sell personal information.",
    ],
    bullets: [
      "Maintain secure authenticated sessions.",
      "Protect client accounts and restricted portal areas.",
      "Verify legitimate website requests.",
      "Remember selected appearance and accessibility preferences.",
      "Support reliable navigation and platform operation.",
      "Detect suspicious, unauthorised, or automated activity.",
    ],
  },
  {
    id: "essential-cookies",
    title: "Essential cookies",
    body: [
      "Essential cookies are required for the website and client portal to operate correctly. They support core functionality and cannot be disabled through a preference tool without affecting website or portal access.",
      "Blocking or deleting essential cookies may cause you to be signed out, interrupt active workflows, or prevent you from accessing protected portal features.",
    ],
    bullets: [
      "Maintain authenticated sessions.",
      "Protect restricted pages and client workspaces.",
      "Verify security-sensitive requests.",
      "Prevent session misuse and unauthorised activity.",
      "Support secure navigation between protected pages.",
      "Maintain the technical operation of the platform.",
    ],
  },
  {
    id: "authentication-cookies",
    title: "Authentication cookies",
    body: [
      "Authentication cookies are used after a successful sign-in to associate your browser with an authenticated account session.",
      "They allow the platform to recognise that you have signed in and determine whether you may access a requested client workspace, engagement, document, invoice, payment record, report, or administrative area.",
      "Authentication cookies do not replace server-side permission checks. Access to protected information remains subject to account status, assigned roles, engagement assignments, and other authorisation controls.",
    ],
  },
  {
    id: "session-security",
    title: "Session security",
    body: [
      "Session cookies support secure communication between your browser and the client portal. Where appropriate, session cookies are configured with protections such as Secure, HttpOnly, and SameSite attributes.",
      "Users must not copy, disclose, transfer, or share session cookies, authentication tokens, account credentials, or active browser sessions with another person.",
      "You should sign out after using the portal on a shared or public device and close the browser when your session is complete.",
      "If you suspect unauthorised account access, you should change your password and report the incident to IFTA Consulting promptly.",
    ],
  },
  {
    id: "security-and-request-protection",
    title: "Security and request protection",
    body: [
      "The platform may use cookies, temporary security values, or request tokens to verify that actions originate from legitimate website sessions and to reduce the risk of unauthorised activity.",
      "Security-related cookie information may be considered together with technical information such as timestamps, browser details, account identifiers, device information, and network information when investigating suspicious activity.",
    ],
    bullets: [
      "Cross-site request forgery.",
      "Session fixation or session replay.",
      "Automated login attempts.",
      "Credential-stuffing activity.",
      "Suspicious account access.",
      "Abusive or unusually frequent requests.",
    ],
  },
  {
    id: "preference-cookies",
    title: "Preference cookies",
    body: [
      "The website may store limited preferences to provide a more consistent experience when you return.",
      "Preference cookies do not grant access to protected information and do not replace authentication or server-side authorisation controls.",
    ],
    bullets: [
      "Light or dark appearance.",
      "Interface display choices.",
      "Accessibility preferences.",
      "Language selections where available.",
      "Other non-sensitive usability settings.",
    ],
  },
  {
    id: "session-and-persistent-cookies",
    title: "Session and persistent cookies",
    body: [
      "Session cookies normally remain available only while your browser session is active. They may expire when you sign out, close your browser, remain inactive for a defined period, or reach the maximum permitted session duration.",
      "Persistent cookies remain on your device for a defined period or until you remove them. They may be used to preserve preferences or other limited settings between visits.",
      "The duration of a cookie depends on its purpose, security requirements, and the configuration of the related website feature.",
    ],
  },
  {
    id: "similar-technologies",
    title: "Similar technologies",
    body: [
      "In addition to browser cookies, the website may use local storage, session storage, security tokens, request identifiers, or similar technologies to support website functionality.",
      "These technologies may be used to remember interface preferences, maintain temporary application state, protect requests, or support authenticated workflows.",
      "Where this policy refers to cookies, it may also refer to similar technologies that serve substantially the same purpose.",
    ],
  },
  {
    id: "third-party-services",
    title: "Third-party services",
    body: [
      "Some website functionality may be supported by trusted third-party service providers, including hosting, infrastructure, email delivery, file storage, payment processing, monitoring, security, mapping, or communication providers.",
      "A third-party provider may set or process cookies when its service is embedded in, connected to, or used through the website.",
      "Third-party cookies are controlled by the relevant provider and may be subject to that provider's own privacy and cookie documentation.",
      "We aim to use third-party services only where they are reasonably necessary for platform operation, security, communications, payment processing, or service delivery.",
    ],
  },
  {
    id: "analytics-cookies",
    title: "Analytics cookies",
    body: [
      "The website may use analytics technologies to understand how visitors use public pages, identify technical problems, improve navigation, and evaluate website performance.",
      "Where analytics cookies are not strictly necessary, they should not be activated until the required notice and consent controls have been implemented.",
      "Analytics information should be configured to collect only the information reasonably required for website improvement and operational monitoring.",
    ],
  },
  {
    id: "marketing-and-advertising-cookies",
    title: "Marketing and advertising cookies",
    body: [
      "The website does not currently rely on marketing or behavioural advertising cookies as an essential part of client portal access.",
      "If marketing or advertising cookies are introduced in the future, their purpose, provider, retention period, and consent requirements will be disclosed before they are activated.",
      "Non-essential advertising or marketing cookies should not be placed unless the user has been given an appropriate choice where required.",
    ],
  },
  {
    id: "cookie-consent",
    title: "Cookie consent",
    body: [
      "Essential cookies may be used because they are necessary to provide the website, maintain secure sessions, protect restricted client information, and support requested portal functionality.",
      "Where optional analytics, marketing, personalisation, or third-party cookies are introduced, the website should provide an appropriate consent banner or preference centre before those cookies are activated.",
      "Withdrawing consent for optional cookies should not prevent access to core public website content, although some optional functionality may become unavailable.",
    ],
  },
  {
    id: "managing-cookie-preferences",
    title: "Managing cookie preferences",
    body: [
      "Where a cookie preference centre is available, you may use it to review or change your choices for optional cookies.",
      "Essential cookies cannot be disabled through the preference centre because they are necessary for account security and portal operation.",
      "Changes to optional cookie preferences may take effect immediately or on your next page visit, depending on the technology involved.",
    ],
  },
  {
    id: "managing-cookies-in-your-browser",
    title: "Managing cookies in your browser",
    body: [
      "Most browsers allow you to review, delete, restrict, or block cookies through their privacy and security settings.",
      "You may also configure your browser to notify you before accepting certain cookies.",
      "Browser controls differ between providers and devices. You should refer to your browser's privacy or security documentation for specific instructions.",
      "Deleting cookies may remove saved preferences and may require you to sign in again.",
    ],
  },
  {
    id: "effects-of-disabling-cookies",
    title: "Effects of disabling cookies",
    body: [
      "Disabling or blocking essential cookies may prevent the client portal from maintaining your authenticated session or verifying protected requests.",
      "Blocking preference cookies may reset your selected appearance, accessibility settings, or other saved interface choices.",
    ],
    bullets: [
      "You may be unable to sign in or remain signed in.",
      "Protected engagement workspaces may become unavailable.",
      "Document uploads and downloads may not function correctly.",
      "Messages, reports, invoices, and payment information may be inaccessible.",
      "Administrative and account-management features may stop working.",
    ],
  },
  {
    id: "cookie-retention",
    title: "Cookie retention",
    body: [
      "Cookies are retained only for the period reasonably required to perform their intended purpose, meet security requirements, preserve selected preferences, or support the reliable operation of the platform.",
      "Authentication and security cookies may expire when you sign out, when the session becomes inactive, when the maximum session duration is reached, when your account security changes, or when the session is revoked.",
      "Preference cookies may remain for a longer defined period so that the website can remember your selections between visits.",
    ],
  },
  {
    id: "protection-of-cookie-information",
    title: "Protection of cookie information",
    body: [
      "We use technical and organisational safeguards intended to protect session and cookie-related information against unauthorised access, disclosure, alteration, loss, or misuse.",
      "No internet-based system can guarantee absolute security. Users are also responsible for protecting their devices, browsers, account credentials, and active sessions.",
    ],
    bullets: [
      "Encrypted HTTPS connections.",
      "Secure cookie attributes.",
      "Server-side session validation.",
      "Session expiry and revocation controls.",
      "Role-based access controls.",
      "Request validation.",
      "Activity monitoring and audit logging.",
      "Rate limiting and automated abuse prevention.",
    ],
  },
  {
    id: "financial-and-client-information",
    title: "Financial and client information",
    body: [
      "Cookies are not intended to store complete tax records, financial statements, invoices, payment details, engagement documents, KYC records, reports, or other substantive client files.",
      "Sensitive client information remains within protected application storage and is accessed only after successful authentication and authorisation.",
      "A session cookie may contain or provide a reference that enables the server to locate an authenticated session, but it should not contain confidential engagement content.",
    ],
  },
  {
    id: "account-and-device-responsibility",
    title: "Account and device responsibility",
    body: [
      "Users are responsible for maintaining the security of the devices and browsers used to access the client portal.",
      "You should not allow a browser to save account credentials on a shared device unless the device and browser profile are controlled exclusively by you.",
    ],
    bullets: [
      "Use a supported and updated browser.",
      "Install current device and operating-system security updates.",
      "Avoid accessing the portal through public or untrusted devices.",
      "Do not leave an authenticated session unattended.",
      "Sign out after completing work on a shared device.",
      "Report suspected account access promptly.",
    ],
  },
  {
    id: "changes-to-this-policy",
    title: "Changes to this policy",
    body: [
      "We may update this Cookie Policy when our website functionality, security controls, service providers, technologies, or regulatory obligations change.",
      "The revised policy will be published on this page and will display an updated effective date or last-updated date.",
      "Where a material change affects optional cookie consent, we may ask users to review or update their cookie preferences.",
    ],
  },
  {
    id: "contact-us",
    title: "Contact us",
    body: [
      "Questions about cookies, browser storage, privacy, account security, or stored preferences may be submitted through the public contact page.",
      "When reporting a suspected account-security issue, provide enough information for us to investigate, but do not send your password, session cookie, authentication token, verification code, or other secret credentials.",
    ],
  },
] as const;

export default function CookiesPage() {
  return (
    <LegalDocument
      title="Cookie Policy"
      eyebrow="Privacy and website security"
      description="Learn how IFTA Consulting uses essential cookies and similar technologies to secure portal access, protect client information, remember preferences, and support reliable website operation."
      effectiveDate="2026-07-25"
      lastUpdated="2026-07-25"
      aside="This policy explains how cookies and similar technologies are used across IFTA Consulting’s public website and secure financial consulting portal."
      sections={sections}
    />
  );
}