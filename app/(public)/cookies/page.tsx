import { LegalDocument } from "@/components/public/legal-document";

const sections = [
  {
    title: "Essential cookies",
    body: [
      "The portal uses essential cookies to keep authenticated sessions active, protect account access and preserve security-related preferences.",
      "These cookies support core functionality and cannot be disabled through a preference tool without affecting portal access.",
    ],
  },
  {
    title: "Session security",
    body: [
      "Session cookies should not be shared or copied between users. Signing out ends the current authenticated session according to the account provider's session controls.",
      "Users should sign out on shared devices and report suspected account access promptly.",
    ],
  },
  {
    title: "Preferences",
    body: [
      "The website may store limited preferences, such as the selected light or dark appearance, to provide a consistent experience on return visits.",
      "Preference storage does not replace the account and session controls used for protected portal access.",
    ],
  },
  {
    title: "Future analytics",
    body: [
      "Any future analytics, marketing or non-essential cookie use should be documented and accompanied by the appropriate consent control before production use.",
      "Questions about cookies or stored preferences can be submitted through the public contact page.",
    ],
  },
] as const;

export default function CookiesPage() {
  return (
    <LegalDocument
      description="How essential session and preference cookies support secure access and a consistent website experience."
      eyebrow="Website preferences"
      sections={sections}
      title="Cookie policy"
    />
  );
}
