import { describe, expect, it } from "vitest";
import { resolveR2Endpoint } from "@/lib/r2";

describe("resolveR2Endpoint", () => {
  const accountId = "1234567890abcdef";
  const accountEndpoint = `https://${accountId}.r2.cloudflarestorage.com`;

  it("uses the account endpoint when no override is configured", () => {
    expect(resolveR2Endpoint(accountId)).toBe(accountEndpoint);
  });

  it("does not use a public r2.dev delivery URL for S3 operations", () => {
    expect(resolveR2Endpoint(accountId, "https://pub-example.r2.dev")).toBe(accountEndpoint);
  });

  it("keeps a valid custom S3 endpoint and removes its trailing slash", () => {
    expect(resolveR2Endpoint(accountId, "https://storage.example.com/"))
      .toBe("https://storage.example.com");
  });
});
