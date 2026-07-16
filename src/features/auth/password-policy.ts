export type PasswordRequirement = {
  key: string;
  label: string;
  test: (password: string) => boolean;
};

export const PASSWORD_MIN_LENGTH = 12;

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    key: "length",
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (password) => password.length >= PASSWORD_MIN_LENGTH,
  },
  {
    key: "uppercase",
    label: "One uppercase letter",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    key: "lowercase",
    label: "One lowercase letter",
    test: (password) => /[a-z]/.test(password),
  },
  {
    key: "number",
    label: "One number",
    test: (password) => /\d/.test(password),
  },
  {
    key: "symbol",
    label: "One symbol",
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
];

export function getPasswordChecklist(password: string) {
  return PASSWORD_REQUIREMENTS.map((requirement) => ({
    key: requirement.key,
    label: requirement.label,
    met: requirement.test(password),
  }));
}

export function isPasswordPolicySatisfied(password: string) {
  return getPasswordChecklist(password).every((item) => item.met);
}

export function getPasswordPolicyMessage() {
  return PASSWORD_REQUIREMENTS.map((requirement) => requirement.label.toLowerCase()).join(", ");
}
