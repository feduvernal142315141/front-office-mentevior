"use client"

import { format } from "date-fns"
import { Loader2 } from "lucide-react"

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
  onOpenDetail: (submission: ClaimMdSubmissionSummary, clientName: string) => void
}

export function ClaimMdSubmissionsPanel({
  submissions,
  isLoading,
  error,
  clientGroups,
  onOpenDetail,
}: ClaimMdSubmissionsPanelProps) {
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
                    <td className="px-5 py-3 font-medium text-slate-800">{clientName}</td>
                    <td className="px-5 py-3">
                      <ClaimMdStatusBadge badge={getEffectiveBadge(submission.effectiveStatus)} />
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
