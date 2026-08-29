"use client"

import { useState } from "react"
import { format } from "date-fns"
import { AlertTriangle, Check, Copy, ExternalLink, Loader2, ShieldCheck } from "lucide-react"

import { Button } from "@/components/custom/Button"
import { Card } from "@/components/custom/Card"
import { CustomModal } from "@/components/custom/CustomModal"
import { useAlert } from "@/lib/contexts/alert-context"
import { useClaimMdEnrollment } from "@/lib/modules/payers/hooks/use-claim-md-enrollment"
import type {
  ClaimMdEnrollment,
  ClaimMdEnrollmentStartResult,
  ClaimMdEnrollmentStatus,
} from "@/lib/types/payer.types"
import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<ClaimMdEnrollmentStatus, { label: string; className: string }> = {
  REQUESTED: { label: "Requested", className: "border-slate-200 bg-slate-100 text-slate-600" },
  ENROLLED: { label: "Enrolled", className: "border-blue-200 bg-blue-50 text-[#037ECC]" },
  RECEIVED: { label: "Received", className: "border-blue-200 bg-blue-50 text-[#037ECC]" },
  COMPLETED: { label: "Completed", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  REJECTED: { label: "Rejected", className: "border-red-200 bg-red-50 text-red-700" },
  UNKNOWN: { label: "Unknown", className: "border-amber-200 bg-amber-50 text-amber-700" },
}

function formatTimestamp(value: string | null): string {
  if (!value) return "—"
  try {
    return format(new Date(value), "MMM dd, yyyy · HH:mm")
  } catch {
    return value
  }
}

interface ClaimMdEnrollmentSectionProps {
  payerId: string
  payerName: string
  /** Nombre del clearing house del payer; la sección sólo aplica a Claim.MD. */
  clearingHouseName: string | null | undefined
  /** Sin `externalId` el backend rechaza el enrollment. */
  externalId: string | null | undefined
  enrollments: ClaimMdEnrollment[]
  canStart: boolean
  onStarted: () => void
}

export function ClaimMdEnrollmentSection({
  payerId,
  payerName,
  clearingHouseName,
  externalId,
  enrollments,
  canStart,
  onStarted,
}: ClaimMdEnrollmentSectionProps) {
  const alert = useAlert()
  const { start, isStarting } = useClaimMdEnrollment()
  const [result, setResult] = useState<ClaimMdEnrollmentStartResult | null>(null)
  const [copied, setCopied] = useState(false)

  // Sólo Claim.MD ofrece este alta.
  const isClaimMd = (clearingHouseName ?? "").replace(/[\s.]/g, "").toLowerCase() === "claimmd"
  if (!isClaimMd) return null

  const hasExternalId = Boolean(externalId?.trim())

  const runStart = async () => {
    const started = await start(payerId)
    if (!started) return
    setCopied(false)
    setResult(started)
    onStarted()
  }

  const confirmStart = () => {
    alert.confirm({
      title: "Start the Claim.MD enrollment?",
      description: `Claim.MD will create an enrollment for ${payerName} using your company's NPI and EIN, and return a one-time link to finish the process on their site.`,
      confirmText: "Start enrollment",
      cancelText: "Cancel",
      onConfirm: () => void runStart(),
    })
  }

  const copyUrl = async () => {
    if (!result?.enrollmentUrl) return
    try {
      await navigator.clipboard.writeText(result.enrollmentUrl)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <>
      <Card variant="elevated" padding="lg" className="mt-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <ShieldCheck className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Claim.MD Enrollment</h3>
              <p className="text-sm text-gray-500">
                Enroll your provider with this payer so Claim.MD can accept its claims.
              </p>
            </div>
          </div>

          {canStart && (
            <Button
              type="button"
              className="gap-2"
              onClick={confirmStart}
              disabled={isStarting || !hasExternalId}
              title={hasExternalId ? undefined : "Set the payer's External ID first"}
            >
              {isStarting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              Start enrollment
            </Button>
          )}
        </div>

        {!hasExternalId && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800">
              This payer has no External ID yet. Claim.MD needs it to identify the payer, so set it
              above and save before starting the enrollment.
            </p>
          </div>
        )}

        <div className="mt-5">
          {enrollments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-6">
              <p className="text-sm text-slate-600">No enrollments started for this payer yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                    {["Status", "Claim.MD id", "Provider NPI", "Requested", "Last event", "Detail"].map(
                      (header) => (
                        <th
                          key={header}
                          className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400"
                        >
                          {header}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {enrollments.map((enrollment) => {
                    const style = enrollment.status ? STATUS_STYLES[enrollment.status] : null
                    return (
                      <tr key={enrollment.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          {style ? (
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                                style.className,
                              )}
                              title={enrollment.externalStatus ?? undefined}
                            >
                              {style.label}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400">—</span>
                          )}
                        </td>
                        {/* `enrollId` llega por webhook: en cuanto se inicia todavía es null. */}
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">
                          {enrollment.enrollId ?? "Pending"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">
                          {enrollment.providerNpi ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-xs text-slate-500">
                          {formatTimestamp(enrollment.requestedAt)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-xs text-slate-500">
                          {formatTimestamp(enrollment.lastEventAt)}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {enrollment.eventDetail ?? "—"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/*
        La URL es de un solo uso y no vuelve en `GET /payers/{id}`. No se abre sola a
        propósito: si un bloqueador de ventanas se la comiera, se perdería sin manera de
        recuperarla. El usuario la abre o la copia.
      */}
      <CustomModal
        open={result !== null}
        onOpenChange={(next) => {
          if (!next) setResult(null)
        }}
        title="Finish the enrollment in Claim.MD"
        description="Claim.MD created the enrollment and returned a single-use link"
        maxWidthClassName="sm:max-w-[620px]"
        constrainHeight
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-6">
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-800">
                This link works once and is not shown again. Open or copy it now — if you lose it
                you will have to start another enrollment.
              </p>
            </div>

            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Enrollment link
              </span>
              <p className="mt-1 break-all rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 font-mono text-xs text-slate-700">
                {result?.enrollmentUrl}
              </p>
            </div>

            <p className="text-sm text-slate-600">
              The status below updates on its own once Claim.MD sends its confirmation. Reload this
              page to check it.
            </p>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
            <Button type="button" variant="secondary" className="gap-2" onClick={() => void copyUrl()}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy link"}
            </Button>
            <a
              href={result?.enrollmentUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-[42px] items-center gap-2 rounded-xl bg-[#037ECC] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#026fb8]"
            >
              <ExternalLink className="h-4 w-4" />
              Open in Claim.MD
            </a>
          </div>
        </div>
      </CustomModal>
    </>
  )
}
