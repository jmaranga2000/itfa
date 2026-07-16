export type ClientKycQuestion = {
  id: string;
  section: string;
  label: string;
  helpText: string;
  kind: "text" | "textarea" | "select";
  required: boolean;
  options?: readonly string[];
};

// Seeded questions are the temporary questionnaire template until the admin editor is introduced.
export const CLIENT_KYC_QUESTIONS: readonly ClientKycQuestion[] = [
  {
    id: "legal_name",
    section: "Identity",
    label: "Full legal name",
    helpText: "Enter your name exactly as it appears on your identification document.",
    kind: "text",
    required: true,
  },
  {
    id: "nationality",
    section: "Identity",
    label: "Nationality",
    helpText: "Select the nationality shown on your identification document.",
    kind: "select",
    required: true,
    options: ["Kenyan", "Other East African", "Other"],
  },
  {
    id: "residential_address",
    section: "Address",
    label: "Residential address",
    helpText: "Include building, street, town or city, and country.",
    kind: "textarea",
    required: true,
  },
  {
    id: "tax_identifier",
    section: "Tax information",
    label: "Tax identification number",
    helpText: "Enter your KRA PIN or the tax number used in your country of residence.",
    kind: "text",
    required: true,
  },
  {
    id: "source_of_funds",
    section: "Source of funds",
    label: "Primary source of funds",
    helpText: "Choose the source that best explains the funds connected to this engagement.",
    kind: "select",
    required: true,
    options: ["Employment income", "Business income", "Investments", "Inheritance", "Other"],
  },
  {
    id: "engagement_purpose",
    section: "Engagement",
    label: "Purpose of this engagement",
    helpText: "Briefly describe the services you are seeking and the expected outcome.",
    kind: "textarea",
    required: true,
  },
  {
    id: "politically_exposed",
    section: "Declarations",
    label: "Are you a politically exposed person, or closely related to one?",
    helpText: "Select the answer that applies to you.",
    kind: "select",
    required: true,
    options: ["No", "Yes"],
  },
];

export function getQuestionnaireProgress(answers: Record<string, string>) {
  const requiredQuestions = CLIENT_KYC_QUESTIONS.filter((question) => question.required);
  const answered = requiredQuestions.filter((question) => answers[question.id]?.trim()).length;

  return {
    answered,
    total: requiredQuestions.length,
    complete: answered === requiredQuestions.length,
  };
}
