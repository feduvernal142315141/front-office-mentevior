"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"

import { CustomModal } from "@/components/custom/CustomModal"
import {
  getAdjudicationBadge,
  getSubmissionBadge,
} from "@/lib/modules/batch-claims/claim-md-status"
import {
  getSubmissionById,
  getSubmissionByServiceLog,
} from "@/lib/modules/batch-claims/services/claim-md.service"
import type { ClaimMdSubmissionDetail } from "@/lib/types/claim-md.types"
import { parseLocalDate } from "@/lib/date"
import { cn } from "@/lib/utils"

import { ClaimMdStatusBadge } from "./ClaimMdStatusBadge"

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

function formatServiceDate(value: string): string {
  if (!value) return "—"
  try {
    return format(parseLocalDate(value.slice(0, 10)), "MMM dd, yyyy")
  } catch {
    return value
  }
}

function formatTimestamp(value: string | null): string {
  if (!value) return "—"
  try {
    return format(new Date(value), "MMM dd, yyyy · HH:mm")
  } catch {
    return value
  }
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <span className="mt-0.5 block truncate text-sm font-medium text-slate-800">{value || "—"}</span>
    </div>
  )
}

interface ClaimMdSubmissionDetailModalProps {
  open: boolean
  onClose: () => void
  batchClaimId: string
  /** Preferido: la ruta por service log es la que el contrato recomienda. */
  batchClaimServiceLogId: string | null
  submissionId: string | null
  clientName?: string
}

export function ClaimMdSubmissionDetailModal({
  open,
  onClose,
  batchClaimId,
  batchClaimServiceLogId,
  submissionId,
  clientName,
}: ClaimMdSubmissionDetailModalProps) {
  const [detail, setDetail] = useState<ClaimMdSubmissionDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setDetail(null)
      setError(null)
      return
    }

    let isActive = true

    void (async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = batchClaimServiceLogId
          ? await getSubmissionByServiceLog(batchClaimId, batchClaimServiceLogId)
          : submissionId
            ? await getSubmissionById(submissionId)
            : null
        if (!isActive) return
        setDetail(data)
      } catch (err) {
        if (!isActive) return
        setError(err instanceof Error ? err.message : "Failed to fetch the submission")
      } finally {
        if (isActive) setIsLoading(false)
      }
    })()

    return () => {
      isActive = false
    }
  }, [open, batchClaimId, batchClaimServiceLogId, submissionId])

  return (
    <CustomModal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      title={clientName ? `Claim detail — ${clientName}` : "Claim detail"}
      description="Everything Claim.MD received and answered for this claim"
      maxWidthClassName="sm:max-w-[900px]"
      constrainHeight
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        {isLoading && (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#037ECC]" />
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!isLoading && !error && !detail && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-6 text-center">
            <p className="text-sm text-slate-600">No Claim.MD submission exists for this claim yet.</p>
          </div>
        )}

        {!isLoading && !error && detail && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <ClaimMdStatusBadge badge={getSubmissionBadge(detail.submissionStatus)} />
              <ClaimMdStatusBadge badge={getAdjudicationBadge(detail.adjudicationStatus)} />
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-3">
              <Field label="Claim.MD claim id" value={detail.claimMdClaimId ?? ""} />
              <Field label="Claim.MD file id" value={detail.claimMdFileId ?? ""} />
              <Field label="Patient control no." value={detail.patientControlNumber ?? ""} />
              <Field label="Total charge" value={detail.totalCharge != null ? currency.format(detail.totalCharge) : ""} />
              <Field label="Submitted" value={formatTimestamp(detail.submittedAt)} />
              <Field label="Last response" value={formatTimestamp(detail.lastResponseAt)} />
              <Field label="Payer external id" value={detail.payerExternalIdSnapshot ?? ""} />
              <Field label="Billing NPI" value={detail.billingNpiSnapshot ?? ""} />
              <Field label="Billing tax id" value={detail.billingTaxIdSnapshot ?? ""} />
            </div>

            {/* Los mensajes son lo que el usuario necesita para corregir un rechazo:
                van antes que las líneas de servicio. */}
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Claim.MD responses
              </h3>
              {detail.responses.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No responses received yet.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {detail.responses.map((response) => (
                    <li
                      key={response.id}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        {response.externalStatus && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-600">
                            {response.externalStatus}
                          </span>
                        )}
                        {response.messageId && (
                          <span className="font-mono text-[11px] text-slate-400">{response.messageId}</span>
                        )}
                        <span className="ml-auto text-xs tabular-nums text-slate-400">
                          {formatTimestamp(response.responseAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-700">{response.message || "—"}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Service lines
              </h3>
              {detail.lines.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">This submission has no service lines.</p>
              ) : (
                <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                        {["#", "Date", "Code", "Mod.", "POS", "Units", "Charge"].map((header) => (
                          <th
                            key={header}
                            className={cn(
                              "px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400",
                              (header === "Units" || header === "Charge") && "text-right",
                            )}
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {detail.lines.map((line) => (
                        <tr key={line.id || `${line.lineNumber}-${line.appointmentId}`}>
                          <td className="px-4 py-2.5 tabular-nums text-slate-500">{line.lineNumber}</td>
                          <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-slate-700">
                            {formatServiceDate(line.serviceDate)}
                          </td>
                          <td className="px-4 py-2.5 font-medium text-slate-700">{line.procedureCode || "—"}</td>
                          <td className="px-4 py-2.5 text-slate-600">{line.modifiers || "—"}</td>
                          <td className="px-4 py-2.5 text-slate-600">{line.placeOfService || "—"}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                            {line.units ?? "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-slate-800">
                            {line.chargeAmount != null ? currency.format(line.chargeAmount) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </CustomModal>
  )
}
