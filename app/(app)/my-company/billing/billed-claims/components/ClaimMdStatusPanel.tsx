"use client"

import { format } from "date-fns"
import { CloudUpload, Loader2, RefreshCw, RotateCw, SearchCheck } from "lucide-react"

import { Button } from "@/components/custom/Button"
import { useAlert } from "@/lib/contexts/alert-context"
import { getBatchDecision } from "@/lib/modules/batch-claims/claim-md-status"
import type { BatchClaim } from "@/lib/types/batch-claim.types"
import { cn } from "@/lib/utils"

import { ClaimMdStatusBadge } from "./ClaimMdStatusBadge"

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

function formatTimestamp(value: string | null): string {
  if (!value) return "—"
  try {
    return format(new Date(value), "MMM dd, yyyy · HH:mm")
  } catch {
    return value
  }
}

interface ClaimMdStatusPanelProps {
  batchClaim: BatchClaim
  /** Sin permiso de edición el estado se ve igual; lo que desaparece son las acciones. */
  canAct: boolean
  /** Un batch sin appointments generaría un 837P vacío: no hay nada que enviar. */
  hasClaims: boolean
  isPolling: boolean
  pollTimedOut: boolean
  isSubmitting: boolean
  isRetrying: boolean
  isResolving: boolean
  onSubmit: () => void
  onRetry: () => void
  onVerify: () => void
  onRefresh: () => void
}

export function ClaimMdStatusPanel({
  batchClaim,
  canAct,
  hasClaims,
  isPolling,
  pollTimedOut,
  isSubmitting,
  isRetrying,
  isResolving,
  onSubmit,
  onRetry,
  onVerify,
  onRefresh,
}: ClaimMdStatusPanelProps) {
  const alert = useAlert()
  const decision = getBatchDecision(batchClaim.claimMdEffectiveStatus)
  const isBusy = isSubmitting || isRetrying || isResolving || isPolling

  const confirmSubmit = () => {
    alert.confirm({
      title: "Submit this batch to Claim.MD?",
      description:
        "The 837P file will be generated from the whole batch and uploaded to the clearing house. This cannot be undone, and the batch can no longer be edited afterwards.",
      confirmText: "Submit",
      cancelText: "Cancel",
      onConfirm: onSubmit,
    })
  }

  const confirmRetry = () => {
    alert.confirm({
      title: "Retry the upload?",
      description:
        "The stored 837P file will be uploaded again exactly as it was. It is not regenerated, so no claim ids change.",
      confirmText: "Retry",
      cancelText: "Cancel",
      onConfirm: onRetry,
    })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Claim.MD
            </span>
            <ClaimMdStatusBadge badge={{ label: decision.label, tone: decision.tone }} />
            {isPolling && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#037ECC]" />}
          </div>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-600">
            {decision.canSubmit && !hasClaims
              ? "This batch has no appointments selected, so there is nothing to send to Claim.MD yet."
              : decision.description}
          </p>

          {pollTimedOut && (
            <p className="mt-2 text-sm text-amber-700">
              Still processing after 5 minutes. Refresh to check again.
            </p>
          )}

          {(batchClaim.claimMdLastResponseAt || batchClaim.claimMdHasRemittance) && (
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-slate-100 pt-3">
              <span className="text-xs text-slate-500">
                Last response:{" "}
                <span className="font-medium tabular-nums text-slate-700">
                  {formatTimestamp(batchClaim.claimMdLastResponseAt)}
                </span>
              </span>
              {batchClaim.claimMdHasRemittance && (
                <span className="text-xs text-slate-500">
                  Paid:{" "}
                  <span className="font-medium tabular-nums text-slate-700">
                    {batchClaim.claimMdPaidAmount != null
                      ? currency.format(batchClaim.claimMdPaidAmount)
                      : "—"}
                  </span>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {(isPolling || pollTimedOut) && (
            <Button
              type="button"
              variant="secondary"
              className={cn("gap-2", isPolling && "opacity-70")}
              onClick={onRefresh}
              disabled={isSubmitting || isRetrying || isResolving}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          )}

          {canAct && decision.canSubmit && (
            <Button
              type="button"
              className="gap-2"
              onClick={confirmSubmit}
              disabled={isBusy || !hasClaims}
              title={hasClaims ? undefined : "Add at least one service log before submitting"}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CloudUpload className="h-4 w-4" />
              )}
              Submit to Claim.MD
            </Button>
          )}

          {canAct && decision.canRetry && (
            <Button type="button" className="gap-2" onClick={confirmRetry} disabled={isBusy}>
              {isRetrying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCw className="h-4 w-4" />
              )}
              Retry upload
            </Button>
          )}

          {canAct && decision.canResolveUnknown && (
            <Button type="button" className="gap-2" onClick={onVerify} disabled={isBusy}>
              {isResolving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SearchCheck className="h-4 w-4" />
              )}
              Verify in Claim.MD
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
