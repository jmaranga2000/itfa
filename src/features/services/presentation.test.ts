import { describe, expect, it } from "vitest";
import { serviceImageSource } from "@/features/services/presentation";

describe("serviceImageSource", () => {
  it("uses the stored service image when one exists", () => {
    expect(serviceImageSource({ imageUrl: "/api/services/service-1/image" }, 0)).toBe("/api/services/service-1/image");
  });

  it("uses a stable local fallback for existing services without images", () => {
    expect(serviceImageSource({ imageUrl: null }, 1)).toBe("/images/financial-reporting-review.jpg");
  });
});
