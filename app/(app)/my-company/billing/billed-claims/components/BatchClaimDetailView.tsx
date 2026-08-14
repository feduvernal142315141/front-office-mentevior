"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { AlertTriangle, FileDown, FileText, Loader2, User } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { DocumentViewer } from "@/components/custom/DocumentViewer"
import { parseLocalDate } from "@/lib/date"
import {
  getBatchClaimClientPdfPreviewUrl,
  getBatchClaimPdfPreviewUrl,
} from "@/lib/modules/batch-claims/services/batch-claims.service"
import { useDownload837P } from "@/lib/modules/batch-claims/hooks/use-download-837p"
import type { BatchClaim, BatchClaimClientGroup } from "@/lib/types/batch-claim.types"
import { cn } from "@/lib/utils"

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

function formatDate(dateStr: string): string {
  if (!dateStr) return "—"
  try {
    return format(parseLocalDate(dateStr.slice(0, 10)), "MMM dd, yyyy")
  } catch {
    return dateStr
  }
}

function groupTotals(group: BatchClaimClientGroup) {
  let units = 0
  let amount = 0
  let missingRate = false
  for (const d of group.appointmentDetails) {
    units += d.units
    if (d.submitAmount == null) missingRate = true
    else amount += d.submitAmount
  }
  return { units, amount, missingRate }
}

interface BatchClaimDetailViewProps {
  batchClaim: BatchClaim
}

export function BatchClaimDetailView({ batchClaim }: BatchClaimDetailViewProps) {
  const [pdfPreview, setPdfPreview] = useState<{ url: string; fileName: string } | null>(null)
  const { download, isDownloading } = useDownload837P()

  const totals = useMemo(() => {
    let appointments = 0
    let units = 0
    let amount = 0
    let missingRate = false
    for (const group of batchClaim.appointments) {
      const t = groupTotals(group)
      appointments += group.appointmentDetails.length
      units += t.units
      amount += t.amount
      if (t.missingRate) missingRate = true
    }
    return { appointments, units, amount, missingRate, clients: batchClaim.appointments.length }
  }, [batchClaim])

  return (
    <div className="space-y-5">
      {/* ─── Header card ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-start gap-x-10 gap-y-3">
          <div>
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Reference</span>
            <span className="text-sm font-semibold text-slate-800">{batchClaim.reference || "—"}</span>
          </div>
          <div>
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Payer</span>
            <span className="text-sm font-medium text-slate-800">{batchClaim.payerName || "—"}</span>
          </div>
          <div>
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Plan</span>
            <span className="text-sm font-medium text-slate-800">{batchClaim.payerPlanName || "—"}</span>
          </div>
          <div>
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Created</span>
            <span className="text-sm font-medium text-slate-800">{formatDate(batchClaim.createAt)}</span>
          </div>
          <div>
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</span>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                batchClaim.active
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-100 text-slate-500",
              )}
            >
              {batchClaim.active ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="gap-2"
              onClick={() =>
                setPdfPreview({
                  url: getBatchClaimPdfPreviewUrl(batchClaim.id),
                  fileName: "Batch Claim CMS-1500.pdf",
                })
              }
            >
              <FileText className="h-4 w-4" />
              Preview CMS-1500
            </Button>
            <Button
              type="button"
              className="gap-2"
              onClick={() => void download(batchClaim.id)}
              disabled={isDownloading}
            >
              {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              Download 837P
            </Button>
          </div>
        </div>
        {batchClaim.comments && (
          <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">{batchClaim.comments}</p>
        )}
      </div>

      {/* ─── Totals strip ─── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Service Logs", value: String(batchClaim.serviceLogIds.length) },
          { label: "Clients", value: String(totals.clients) },
          { label: "Appointments", value: String(totals.appointments) },
          { label: "Units", value: String(totals.units) },
          { label: "Total Amount", value: currency.format(totals.amount) },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">{item.label}</span>
            <span className="mt-1 block text-xl font-bold tabular-nums text-slate-900">{item.value}</span>
          </div>
        ))}
      </div>

      {totals.missingRate && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            Some services have no applicable payer rate for their date of service. Their amounts are excluded from the
            total; configure the missing rates on the payer plan before generating the claim.
          </p>
        </div>
      )}

      {/* ─── Client groups ─── */}
      {batchClaim.appointments.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-14 text-center shadow-sm">
          <p className="text-sm text-slate-500">This batch has no selected appointments.</p>
        </div>
      ) : (
        batchClaim.appointments.map((group, index) => {
          const t = groupTotals(group)
          return (
            <div
              key={`${group.clientId}-${group.priorAuthorizationNumber}-${group.memberNumber}-${index}`}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              {/* Group header */}
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2 border-b border-slate-100 bg-slate-50/70 px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#037ECC]/10 text-[#037ECC]">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{group.clientName}</span>
                </div>
                <span className="text-xs text-slate-500">
                  Auth: <span className="font-medium text-slate-700">{group.priorAuthorizationNumber || "—"}</span>
                </span>
                <span className="text-xs text-slate-500">
                  Member: <span className="font-medium text-slate-700">{group.memberNumber || "—"}</span>
                </span>
                <div className="ml-auto">
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-8 gap-1.5 px-3 text-xs"
                    onClick={() =>
                      setPdfPreview({
                        url: getBatchClaimClientPdfPreviewUrl(batchClaim.id, group.clientId, group.clientName),
                        fileName: `CMS-1500 ${group.clientName}.pdf`,
                      })
                    }
                  >
                    <FileText className="h-3.5 w-3.5" />
                    CMS-1500
                  </Button>
                </div>
              </div>

              {/* Services table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left">
                      {["Date", "Place of Service", "Billing Code", "Diagnosis", "Units", "Rate", "Amount"].map((h) => (
                        <th
                          key={h}
                          className={cn(
                            "px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400",
                            (h === "Units" || h === "Rate" || h === "Amount") && "text-right",
                          )}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {group.appointmentDetails.map((detail) => (
                      <tr key={detail.appointmentId} className="hover:bg-slate-50/60">
                        <td className="whitespace-nowrap px-5 py-2.5 font-medium tabular-nums text-slate-700">
                          {formatDate(detail.date)}
                        </td>
                        <td className="px-5 py-2.5 text-slate-600">{detail.placeOfService || "—"}</td>
                        <td className="whitespace-nowrap px-5 py-2.5 text-slate-600">{detail.billingCode || "—"}</td>
                        <td className="px-5 py-2.5 text-slate-600">{detail.primaryDiagnosis || "—"}</td>
                        <td className="px-5 py-2.5 text-right tabular-nums text-slate-700">{detail.units}</td>
                        <td className="px-5 py-2.5 text-right tabular-nums text-slate-700">
                          {detail.rate != null ? currency.format(detail.rate) : (
                            <span className="inline-flex items-center gap-1 text-amber-600">
                              <AlertTriangle className="h-3 w-3" /> —
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-2.5 text-right font-semibold tabular-nums text-slate-800">
                          {detail.submitAmount != null ? currency.format(detail.submitAmount) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-100 bg-slate-50/50">
                      <td colSpan={4} className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Subtotal
                      </td>
                      <td className="px-5 py-2.5 text-right font-semibold tabular-nums text-slate-800">{t.units}</td>
                      <td />
                      <td className="px-5 py-2.5 text-right font-bold tabular-nums text-slate-900">
                        {currency.format(t.amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )
        })
      )}

      {/* PDF viewer */}
      {pdfPreview && (
        <DocumentViewer
          open
          onClose={() => setPdfPreview(null)}
          documentUrl={pdfPreview.url}
          fileName={pdfPreview.fileName}
        />
      )}
    </div>
  )
}
