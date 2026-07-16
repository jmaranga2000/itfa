import { describe, expect, it } from "vitest";
import {
  assertTemplateVersionEditable,
  canTransitionTemplateStatus,
  renderTemplateContent,
  validateTemplateForPublish,
} from "@/features/templates/lifecycle";

describe("template lifecycle rules", () => {
  it("allows the controlled publish path and archive path", () => {
    expect(canTransitionTemplateStatus("draft", "pending_review")).toBe(true);
    expect(canTransitionTemplateStatus("pending_review", "published")).toBe(true);
    expect(canTransitionTemplateStatus("published", "superseded")).toBe(true);
    expect(canTransitionTemplateStatus("superseded", "archived")).toBe(true);
    expect(canTransitionTemplateStatus("archived", "draft")).toBe(true);
  });

  it("blocks direct editing of published versions", () => {
    expect(() => assertTemplateVersionEditable("draft")).not.toThrow();
    expect(() => assertTemplateVersionEditable("pending_review")).not.toThrow();
    expect(() => assertTemplateVersionEditable("published")).toThrow(
      "Published, superseded and archived template versions are immutable.",
    );
  });
});

describe("template variable validation", () => {
  it("rejects unknown variables before publishing", () => {
    const report = validateTemplateForPublish({
      content: "Hello {{clientName}}, this uses {{unknownThing}}.",
      variables: [{ key: "clientName", required: true }],
      requiredVariables: ["clientName"],
      requiredSections: [],
    });

    expect(report.publishReady).toBe(false);
    expect(report.unknownVariables).toEqual(["unknownThing"]);
    expect(report.errors).toContain("Unknown variable: unknownThing");
  });

  it("detects missing required variables and sections", () => {
    const report = validateTemplateForPublish({
      content: "## Scope of services\n{{serviceName}}",
      variables: [{ key: "serviceName", required: true }],
      requiredVariables: ["clientName", "serviceName"],
      requiredSections: ["Client details", "Scope of services"],
    });

    expect(report.publishReady).toBe(false);
    expect(report.missingRequiredVariables).toEqual(["clientName"]);
    expect(report.missingRequiredSections).toEqual(["Client details"]);
  });

  it("detects duplicate variable definitions separately from repeated placeholders", () => {
    const report = validateTemplateForPublish({
      content: "Hello {{clientName}}. Dear {{clientName}}.",
      variables: [
        { key: "clientName", required: true },
        { key: "clientName", required: true },
      ],
      requiredVariables: ["clientName"],
      requiredSections: [],
    });

    expect(report.publishReady).toBe(false);
    expect(report.duplicateVariableDefinitions).toEqual(["clientName"]);
    expect(report.duplicatePlaceholders).toEqual(["clientName"]);
  });

  it("renders sample data and exposes unresolved variables", () => {
    const rendered = renderTemplateContent("Invoice {{invoiceNumber}} for {{missingValue}}", {
      invoiceNumber: "INV-001",
    });

    expect(rendered).toContain("INV-001");
    expect(rendered).toContain("[Unresolved: {{missingValue}}]");
  });
});
