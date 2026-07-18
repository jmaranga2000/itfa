import type { Principal } from "@/features/authorization/access-control";
import {
  assignKycReviewer as assignKycReviewerRecord,
  getExpiringKycDocuments as listExpiringKycDocuments,
  getKycClientTypeLabel as resolveKycClientTypeLabel,
  getKycDashboardData as loadKycDashboardData,
  getKycProgress as calculateKycProgress,
  getKycReports as loadKycReports,
  getKycRequirementStatusLabel as resolveKycRequirementStatusLabel,
  getKycReviewerWorkload as loadKycReviewerWorkload,
  getKycRiskLabel as resolveKycRiskLabel,
  getKycRiskRules as loadKycRiskRules,
  getKycStatusLabel as resolveKycStatusLabel,
  getKycSubmissionDetail as loadKycSubmissionDetail,
  getKycTemplates as loadKycTemplates,
  reviewKycRequirement as reviewKycRequirementRecord,
} from "@/repositories/kyc-repository";

export type {
  KycDashboardData,
  KycDocumentVersion,
  KycRequirement,
  KycReviewerWorkloadRecord,
  KycSubmission,
  KycTimelineEvent,
} from "@/repositories/kyc-repository";

export async function getKycDashboardData() {
  return loadKycDashboardData();
}

export async function getKycSubmissionDetail(submissionId: string) {
  return loadKycSubmissionDetail(submissionId);
}

export async function getExpiringKycDocuments() {
  return listExpiringKycDocuments();
}

export async function getKycTemplates() {
  return loadKycTemplates();
}

export async function getKycRiskRules() {
  return loadKycRiskRules();
}

export async function getKycReviewerWorkload(submissionId?: string) {
  return loadKycReviewerWorkload(submissionId);
}

export async function getKycReports() {
  return loadKycReports();
}

export async function assignKycReviewer(submissionId: string, reviewerUserId: string, actor: Principal) {
  return assignKycReviewerRecord(submissionId, reviewerUserId, actor);
}

export async function reviewKycRequirement(input: {
  submissionId: string;
  requirementId: string;
  decision: "approved" | "replacement_requested" | "escalated" | "rejected";
  note: string;
  actor: Principal;
}) {
  return reviewKycRequirementRecord(input);
}

export const getKycProgress = calculateKycProgress;
export const getKycStatusLabel = resolveKycStatusLabel;
export const getKycRequirementStatusLabel = resolveKycRequirementStatusLabel;
export const getKycRiskLabel = resolveKycRiskLabel;
export const getKycClientTypeLabel = resolveKycClientTypeLabel;
