"use client"

import { useEffect, useRef, useState } from "react"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"

import { Checkbox } from "@/components/custom/Checkbox"
import { useAlert } from "@/lib/contexts/alert-context"
import { toast } from "@/lib/compat/sonner"
import { canResubmitClaim, isValidResubmissionSelection, MAX_CLAIM_RESUBMISSIONS } from "@/lib/modules/batch-claims/claim-md-resubmission"
import { Button } from "@/components/custom/Button"
import { getEffectiveBadge } from "@/lib/modules/batch-claims/claim-md-status"
import type { BatchClaimClientGroup } from "@/lib/types/batch-claim.types"
import type { ClaimMdSubmissionSummary } from "@/lib/types/claim-md.types"

import { ClaimMdStatusBadge } from "./ClaimMdStatusBadge"

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

function formatTimestamp(value: string | null): string {
  if (!value) return "—"
  try {
    return format(new Date(value), "MMM dd · HH:mm")
  } catch {
    return value
  }
}

interface ClaimMdSubmissionsPanelProps {
  submissions: ClaimMdSubmissionSummary[]
  isLoading: boolean
  error: Error | null
  clientGroups: BatchClaimClientGroup[]
  canResubmit: boolean
  isBusy: boolean
  isResubmitting: boolean
  onResubmit: (ids: string[]) => Promise<boolean>
  onOpenDetail: (submission: ClaimMdSubmissionSummary, clientName: string) => void
}

export function ClaimMdSubmissionsPanel({
  submissions,
  isLoading,
  error,
  clientGroups,
  onOpenDetail,
  canResubmit,
  isBusy,
  isResubmitting,
  onResubmit,
}: ClaimMdSubmissionsPanelProps) {
  const alert = useAlert()
  const [selection, setSelection] = useState<Set<string>>(new Set())
  const [queued, setQueued] = useState<Set<string>>(new Set())
  const inFlight = useRef(false)
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])
  const eligible = submissions.filter(claim => canResubmitClaim(claim) && !queued.has(claim.submissionId))
  const selectedIds = eligible.filter(claim => selection.has(claim.submissionId)).map(claim => claim.submissionId)
  const selectionLimit = Math.min(eligible.length, MAX_CLAIM_RESUBMISSIONS)
  const disabled = isBusy || isLoading || !!error
  const latest = useRef({ eligible, disabled, canResubmit, onResubmit })
  latest.current = { eligible, disabled, canResubmit, onResubmit }

  const confirmResubmit = () => {
    const ids = [...selectedIds]
    if (disabled || !canResubmit || !isValidResubmissionSelection(ids, eligible)) return
    alert.confirm({
      title: `Resend ${ids.length} rejected claim${ids.length === 1 ? "" : "s"}?`,
      description: "Make sure you have corrected the information reported in the rejection details. A new 837P file will be generated using the updated information for these claims. They will remain in this batch.",
      confirmText: "Regenerate and resend",
      cancelText: "Cancel",
      onConfirm: async () => {
        const current = latest.current
        if (!mounted.current || inFlight.current || current.disabled || !current.canResubmit) return
        if (!isValidResubmissionSelection(ids, current.eligible)) {
          toast.warning("The claim status changed. Select the rejected claims again.")
          return
        }
        inFlight.current = true
        try {
          const sent = await current.onResubmit(ids)
          if (sent && mounted.current) {
            setQueued(previous => new Set([...previous, ...ids]))
            setSelection(new Set())
          }
        } finally {
          inFlight.current = false
        }
      },
    })
  }

  // El backend devuelve `batchClaimServiceLogId`, no el nombre: se cruza con los grupos
  // del batch para no enseñar un UUID al usuario.
  const clientNameByServiceLog = new Map(
    clientGroups
      .filter((group) => group.batchClaimServiceLogId)
      .map((group) => [group.batchClaimServiceLogId, group.clientName]),
  )

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3">
        <h3 className="text-sm font-semibold text-slate-900">Claim status</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          What Claim.MD answered for each claim in this batch.
        </p>
      </div>

      {canResubmit && !isLoading && !error && eligible.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <div>
            <p className="text-sm text-slate-700" aria-live="polite">{selectedIds.length} rejected claims selected</p>
            <p className="mt-1 text-xs text-slate-500">Review the rejection details and correct the information before resending. Select up to {MAX_CLAIM_RESUBMISSIONS} claims.</p>
          </div>
          <Button type="button" disabled={disabled || selectedIds.length === 0} onClick={confirmResubmit}>
            {isResubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isResubmitting ? "Resending…" : "Resend selected"}
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="flex h-24 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-[#037ECC]" />
        </div>
      )}

      {!isLoading && error && (
        <div className="px-5 py-4">
          <p className="text-sm font-medium text-red-700">Could not load the claim status.</p>
          <p className="mt-1 text-sm text-red-600">{error.message}</p>
        </div>
      )}

      {!isLoading && !error && submissions.length === 0 && (
        <div className="px-5 py-6 text-center">
          <p className="text-sm text-slate-500">No Claim.MD submissions for this batch yet.</p>
        </div>
      )}

      {!isLoading && !error && submissions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                {canResubmit && (
                  <th className="pl-5 py-2.5">
                    <Checkbox size="sm" aria-label="Select rejected claims (up to 100)"
                      checked={selectionLimit > 0 && selectedIds.length === selectionLimit}
                      indeterminate={selectedIds.length > 0 && selectedIds.length < selectionLimit}
                      disabled={disabled || eligible.length === 0}
                      onCheckedChange={checked => setSelection(new Set(checked ? eligible.slice(0, MAX_CLAIM_RESUBMISSIONS).map(claim => claim.submissionId) : []))}
                    />
                  </th>
                )}
                {["Client", "Status", "Claim.MD id", "Charge", "Last response", ""].map(
                  (header, index) => (
                    <th
                      key={header || `actions-${index}`}
                      className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400"
                    >
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {submissions.map((submission) => {
                const clientName =
                  clientNameByServiceLog.get(submission.batchClaimServiceLogId) ?? "—"
                return (
                  <tr key={submission.submissionId} className="hover:bg-slate-50/60">
                    {canResubmit && (
                      <td className="pl-5 py-3">
                        {canResubmitClaim(submission) && !queued.has(submission.submissionId) && (
                          <Checkbox size="sm" aria-label={`Select rejected claim for ${clientName}`}
                            checked={selectedIds.includes(submission.submissionId)}
                            disabled={disabled || (!selectedIds.includes(submission.submissionId) && selectedIds.length >= MAX_CLAIM_RESUBMISSIONS)}
                            onCheckedChange={checked => setSelection(previous => {
                              const next = new Set(previous)
                              if (checked) next.add(submission.submissionId)
                              else next.delete(submission.submissionId)
                              return next
                            })}
                          />
                        )}
                      </td>
                    )}
                    <td className="px-5 py-3 font-medium text-slate-800">{clientName}</td>
                    <td className="px-5 py-3">
                      <ClaimMdStatusBadge badge={getEffectiveBadge(queued.has(submission.submissionId) ? "PROCESSING" : submission.effectiveStatus)} />
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">
                      {submission.claimMdClaimId ?? "—"}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-slate-700">
                      {submission.totalCharge != null ? currency.format(submission.totalCharge) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 tabular-nums text-xs text-slate-500">
                      {formatTimestamp(submission.lastResponseAt)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-8 px-3 text-xs"
                        onClick={() => onOpenDetail(submission, clientName)}
                      >
                        View detail
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
