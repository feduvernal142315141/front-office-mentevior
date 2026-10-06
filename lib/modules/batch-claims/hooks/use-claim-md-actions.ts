"use client"

import { useCallback, useRef, useState } from "react"
import { toast } from "@/lib/compat/sonner"
import type {
  ClaimMdResolveUnknownResult,
  ClaimMdResubmitResult,
  ClaimMdRetryResult,
  ClaimMdSubmitResult,
} from "@/lib/types/claim-md.types"
import {
  resolveUnknownByServiceLog,
  resolveUnknownBySubmissionId,
  retryBatchClaimSubmission,
  submitBatchClaim,
  resubmitClaims,
} from "../services/claim-md.service"

interface UseClaimMdActionsReturn {
  resubmit: (batchClaimId: string, submissionIds: string[]) => Promise<ClaimMdResubmitResult | null>
  isResubmitting: boolean
  submit: (batchClaimId: string) => Promise<ClaimMdSubmitResult | null>
  retry: (batchClaimId: string) => Promise<ClaimMdRetryResult | null>
  /**
   * Consulta el uploadlist de Claim.MD. Prefiere `submissionId` para consultar el intento actual después de un reenvío.
   */
  resolveUnknown: (params: {
    batchClaimId: string
    batchClaimServiceLogId?: string | null
    submissionId?: string | null
  }) => Promise<ClaimMdResolveUnknownResult | null>
  isSubmitting: boolean
  isRetrying: boolean
  isResolving: boolean
  /** Cualquiera de las acciones en vuelo: sirve para bloquear los botones de una vez. */
  isBusy: boolean
}

export function useClaimMdActions(): UseClaimMdActionsReturn {
  const [isResubmitting, setIsResubmitting] = useState(false)
  const resubmitInFlight = useRef(false)
  const resubmit = useCallback(async (batchClaimId: string, submissionIds: string[]) => {
    if (resubmitInFlight.current) return null
    resubmitInFlight.current = true
    setIsResubmitting(true)
    try {
      const result = await resubmitClaims(batchClaimId, submissionIds)
      toast.success("Selected claims queued for resend", {
        description: `${submissionIds.length} claim${submissionIds.length === 1 ? "" : "s"} will be sent with the updated information.`,
      })
      return result
    } catch (err) {
      toast.error("Could not resend the selected claims", {
        description: err instanceof Error ? err.message : undefined,
      })
      return null
    } finally {
      resubmitInFlight.current = false
      setIsResubmitting(false)
    }
  }, [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const [isResolving, setIsResolving] = useState(false)

  const submit = useCallback(async (batchClaimId: string) => {
    setIsSubmitting(true)
    try {
      const result = await submitBatchClaim(batchClaimId)
      toast.success("Batch sent to Claim.MD", {
        description: `${result.claimCount} claim${result.claimCount === 1 ? "" : "s"} queued for upload.`,
      })
      return result
    } catch (err) {
      toast.error("Could not submit to Claim.MD", {
        description: err instanceof Error ? err.message : undefined,
      })
      return null
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const retry = useCallback(async (batchClaimId: string) => {
    setIsRetrying(true)
    try {
      const result = await retryBatchClaimSubmission(batchClaimId)
      toast.success("Upload retried", {
        description: `Attempt ${result.attemptCount}. The stored 837P file was reused.`,
      })
      return result
    } catch (err) {
      toast.error("Could not retry the upload", {
        description: err instanceof Error ? err.message : undefined,
      })
      return null
    } finally {
      setIsRetrying(false)
    }
  }, [])

  const resolveUnknown = useCallback(
    async (params: {
      batchClaimId: string
      batchClaimServiceLogId?: string | null
      submissionId?: string | null
    }) => {
      setIsResolving(true)
      try {
        const result = params.submissionId
          ? await resolveUnknownBySubmissionId(params.submissionId)
          : params.batchClaimServiceLogId
            ? await resolveUnknownByServiceLog(params.batchClaimId, params.batchClaimServiceLogId)
            : null

        if (!result) {
          toast.error("Could not verify the upload", {
            description: "This submission has no service log or submission id to check against.",
          })
          return null
        }

        if (result.foundInUploadList) {
          toast.success("Claim.MD already has this file", {
            description: "Do not resend it. The claim status will refresh below.",
          })
        } else {
          toast.warning("Claim.MD never received the file", {
            description: "Retrying the upload is now safe.",
          })
        }
        return result
      } catch (err) {
        toast.error("Could not verify the upload", {
          description: err instanceof Error ? err.message : undefined,
        })
        return null
      } finally {
        setIsResolving(false)
      }
    },
    [],
  )

  return {
    submit,
    retry,
    resubmit,
    isResubmitting,
    resolveUnknown,
    isSubmitting,
    isRetrying,
    isResolving,
    isBusy: isSubmitting || isRetrying || isResolving || isResubmitting,
  }
}
