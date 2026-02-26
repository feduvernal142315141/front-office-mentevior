"use client"

import { useMemo } from "react"
import { Upload, Edit2, Download, Eye, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDateDisplay } from "@/lib/utils/date"
import type { CustomTableColumn } from "@/components/custom/CustomTable"
import type { ClientDocumentRow, ClientDocumentStatus } from "@/lib/types/client-document.types"

const STATUS_CONFIG: Record<
  ClientDocumentStatus,
  { label: string; className: string; dotClassName: string }
> = {
  PENDING: {
    label: "Pending",
    className:
      "bg-slate-100 text-slate-600 border-slate-200",
    dotClassName: "bg-slate-400",
  },
  DELIVERED: {
    label: "Delivered",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotClassName: "bg-emerald-500",
  },
  NEAR_EXPIRATION: {
    label: "Near Expiration",
    className:
      "bg-amber-50 text-amber-700 border-amber-200",
    dotClassName: "bg-amber-500",
  },
  EXPIRED: {
    label: "Expired",
    className:
      "bg-red-50 text-red-700 border-red-200",
    dotClassName: "bg-red-500",
  },
}

function StatusBadge({ status }: { status: ClientDocumentStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
        config.className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", config.dotClassName)} />
      {config.label}
    </span>
  )
}

interface UseRequiredDocumentsTableOptions {
  onEdit: (row: ClientDocumentRow) => void
  onDownload?: (row: ClientDocumentRow) => void
  onView?: (row: ClientDocumentRow) => void
  loadingDocumentId?: string | null
}

export function useRequiredDocumentsTable({
  onEdit,
  onDownload,
  onView,
  loadingDocumentId,
}: UseRequiredDocumentsTableOptions) {
  const columns: CustomTableColumn<ClientDocumentRow>[] = useMemo(
    () => [
      {
        key: "documentConfigName",
        header: "Name",
        render: (row) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-gray-900">{row.documentConfigName}</span>
            {row.status === "NEAR_EXPIRATION" && (
              <span className="text-xs text-amber-600 font-medium">
                Expires soon — please update
              </span>
            )}
          </div>
        ),
      },
      {
        key: "issuedDate",
        header: "Issued Date",
        align: "center",
        render: (row) => {
          if (!row.allowIssuedDate) {
            return <span className="text-sm text-slate-400">—</span>
          }
          return (
            <span className="text-sm text-slate-700">
              {row.issuedDate ? formatDateDisplay(row.issuedDate) : <span className="text-slate-400">—</span>}
            </span>
          )
        },
      },
      {
        key: "expirationDate",
        header: "Expiration Date",
        align: "center",
        render: (row) => {
          if (!row.allowExpirationDate) {
            return <span className="text-sm text-slate-400">—</span>
          }
          if (!row.expirationDate) {
            return <span className="text-sm text-slate-400">—</span>
          }
          return (
            <span
              className={cn(
                "text-sm",
                row.status === "EXPIRED"
                  ? "text-red-600 font-semibold"
                  : row.status === "NEAR_EXPIRATION"
                  ? "text-amber-600 font-semibold"
                  : "text-slate-700"
              )}
            >
              {formatDateDisplay(row.expirationDate)}
            </span>
          )
        },
      },
      {
        key: "status",
        header: "Status",
        align: "center",
        render: (row) => (
          <div className="flex justify-center">
            {row.allowStatus ? (
              <StatusBadge status={row.status} />
            ) : (
              <span className="text-sm text-slate-400">—</span>
            )}
          </div>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        render: (row) => {
          const isLoadingThis = loadingDocumentId === row.clientDocumentId
          return (
            <div className="flex justify-end gap-2">
              {row.clientDocumentId && onView && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!isLoadingThis) {
                      onView(row)
                    }
                  }}
                  disabled={isLoadingThis}
                  className={cn(
                    "group/view",
                    "relative h-9 w-9",
                    "flex items-center justify-center",
                    "rounded-xl",
                    "bg-gradient-to-b from-[#037ECC]/10 to-[#079CFB]/10",
                    "ring-1 ring-[#037ECC]/20",
                    "hover:ring-[#037ECC]/40",
                    "hover:from-[#037ECC]/15 hover:to-[#079CFB]/15",
                    "hover:shadow-[0_4px_12px_rgba(3,126,204,0.15)]",
                    "transition-all duration-200",
                    "active:scale-95",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "focus:outline-none focus:ring-2 focus:ring-[#037ECC]/30 focus:ring-offset-2"
                  )}
                  title="View document"
                  aria-label="View document"
                >
                  {isLoadingThis ? (
                    <Loader2 className="w-[18px] h-[18px] text-[#037ECC] animate-spin" />
                  ) : (
                    <Eye className="w-[18px] h-[18px] text-[#037ECC] group-hover/view:text-[#079CFB] transition-colors duration-200" />
                  )}
                </button>
              )}

              <button
                onClick={() => onEdit(row)}
                className={cn(
                  "group/edit",
                  "relative h-9 w-9",
                  "flex items-center justify-center",
                  "rounded-xl",
                  "bg-gradient-to-b from-blue-50 to-blue-100/80",
                  "border border-blue-200/60",
                  "shadow-sm shadow-blue-900/5",
                  "hover:from-blue-100 hover:to-blue-200/90",
                  "hover:border-blue-300/80",
                  "hover:shadow-md hover:shadow-blue-900/10",
                  "hover:-translate-y-0.5",
                  "active:translate-y-0 active:shadow-sm",
                  "transition-all duration-200 ease-out",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2"
                )}
                title={row.clientDocumentId ? "Edit document" : "Upload document"}
                aria-label={row.clientDocumentId ? "Edit document" : "Upload document"}
              >
                {row.clientDocumentId ? (
                  <Edit2 className="w-4 h-4 text-blue-600 group-hover/edit:text-blue-700 transition-colors duration-200" />
                ) : (
                  <Upload className="w-4 h-4 text-blue-600 group-hover/edit:text-blue-700 transition-colors duration-200" />
                )}
              </button>
            </div>
          )
        },
      },
    ],
    [onEdit, onDownload, onView, loadingDocumentId]
  )

  return { columns }
}
