import type { ClaimMdSubmissionSummary } from "@/lib/types/claim-md.types"

export const MAX_CLAIM_RESUBMISSIONS = 100

export function canResubmitClaim(claim: ClaimMdSubmissionSummary): boolean {
  return !!claim.submissionId && claim.effectiveStatus === "REJECTED" && !claim.supersededBySubmissionId
}

/** Selection must come from the current batch's submissions, never from another screen. */
export function isValidResubmissionSelection(ids: string[], submissions: ClaimMdSubmissionSummary[]): boolean {
  const eligible = new Set(submissions.filter(canResubmitClaim).map(claim => claim.submissionId))
  return ids.length > 0 && ids.length <= MAX_CLAIM_RESUBMISSIONS &&
    new Set(ids).size === ids.length && ids.every(id => eligible.has(id))
}
