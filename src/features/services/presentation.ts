import type { ServiceCatalogRecord } from "@/repositories/service-catalog-repository";

const fallbackServiceImages = [
  "/images/tax-advisory-review.jpg",
  "/images/financial-reporting-review.jpg",
  "/images/business-financial-analysis.jpg",
] as const;

export function serviceImageSource(service: Pick<ServiceCatalogRecord, "imageUrl">, index = 0) {
  return service.imageUrl ?? fallbackServiceImages[index % fallbackServiceImages.length];
}
