"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronDown, History, RefreshCcw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/custom/Button"
import { CustomModal } from "@/components/custom/CustomModal"
import { useAuditLogs } from "@/lib/modules/audit/hooks/use-audit-logs"
import { getAuditLogActionLabel } from "@/lib/modules/audit/services/audit-logs.service"
import { getAuditFieldLabel } from "@/lib/modules/audit/utils/audit-field-labels"
import { cn } from "@/lib/utils"
import type { AuditLogAction, AuditLogListItem } from "@/lib/types/audit-log.types"

const LONG_TEXT_FIELD_NAMES = new Set([
  "summary",
  "comment",
  "comments",
  "description",
  "narrative",
  "note",
  "notes",
  "protocol",
])
const LONG_TEXT_PREVIEW_LIMIT = 140
const LONG_TEXT_AUTO_TRUNCATE_LIMIT = 240

interface AuditLogsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityId?: string | null
  title?: string
  entityName?: string
  pageSize?: number
}

function formatAuditDate(value: string | null): string {
  if (!value) return "No date"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return formatDateInUserTimeZone(date, { includeTime: true })
}

function formatAuditDateValue(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) return null

  const looksLikeDate =
    /\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/i.test(trimmed) ||
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i.test(trimmed) ||
    /^\d{4}-\d{2}-\d{2}/.test(trimmed) ||
    /^\d{1,2}\/\d{1,2}\/\d{4}/.test(trimmed)

  return looksLikeDate ? formatDateInUserTimeZone(date) : null
}

function getUserTimeZone(): string | undefined {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

function formatDateInUserTimeZone(
  date: Date,
  options: { includeTime?: boolean } = {}
): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: getUserTimeZone(),
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    ...(options.includeTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          hourCycle: "h23",
        }
      : {}),
  })

  const parts = formatter.formatToParts(date)
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ""

  const formattedDate = `${getPart("month")}/${getPart("day")}/${getPart("year")}`
  if (!options.includeTime) return formattedDate

  return `${formattedDate} ${getPart("hour")}:${getPart("minute")}:${getPart("second")}`
}

function formatAuditValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "No value"
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (normalized === "true") return "Yes"
    if (normalized === "false") return "No"
    const formattedDate = formatAuditDateValue(value)
    if (formattedDate) return formattedDate
    return value
  }
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (typeof value === "number") return String(value)

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function isLongTextField(fieldName: string): boolean {
  const normalized = fieldName.trim().toLowerCase()
  return Array.from(LONG_TEXT_FIELD_NAMES).some((field) => normalized.includes(field))
}

function truncateAuditValue(value: string, shouldTruncate: boolean): string {
  if (!shouldTruncate || value.length <= LONG_TEXT_PREVIEW_LIMIT) return value
  return `${value.slice(0, LONG_TEXT_PREVIEW_LIMIT).trimEnd()}...`
}

function getActionBadgeClassName(action: AuditLogAction | null): string {
  switch (action) {
    case "Create":
      return "border-emerald-300 bg-emerald-50 text-emerald-700"
    case "Update":
      return "border-amber-300 bg-amber-100 text-amber-800"
    case "Delete":
      return "border-red-300 bg-red-50 text-red-700"
    default:
      return "border-slate-300 bg-slate-50 text-slate-700"
  }
}

function AuditLogDetails({ log }: { log: AuditLogListItem }) {
  return (
    <div className="mx-4 mb-4 overflow-hidden rounded-lg border border-blue-100 bg-blue-50/20">
      <div className="grid gap-2 bg-[#037ECC] px-4 py-3 text-white md:grid-cols-[1fr_auto] md:items-center">
        <h4 className="text-sm font-semibold">Change Details</h4>
        <p className="text-sm font-semibold">
          User: {log.createBy || "No user"} | Date: {formatAuditDate(log.createAt)}
        </p>
      </div>

      {log.changes.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-slate-500">
          This audit entry does not include changed field details.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="w-[34%] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Field
                </th>
                <th className="w-[33%] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Previous Value
                </th>
                <th className="w-[33%] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Current Value
                </th>
              </tr>
            </thead>
            <tbody>
              {log.changes.map((change, index) => {
                const fieldLabel = getAuditFieldLabel(log.entityClass, change.fieldName)
                const previousValue = formatAuditValue(change.oldValue)
                const currentValue = formatAuditValue(change.newValue)
                const shouldTruncate =
                  isLongTextField(change.fieldName) ||
                  isLongTextField(fieldLabel) ||
                  previousValue.length > LONG_TEXT_AUTO_TRUNCATE_LIMIT ||
                  currentValue.length > LONG_TEXT_AUTO_TRUNCATE_LIMIT

                return (
                  <tr key={`${log.id}-${change.fieldName}-${index}`} className="align-top">
                    <td
                      className="px-4 py-3 text-sm font-medium text-slate-800"
                      title={change.fieldName}
                    >
                      {fieldLabel}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      <span className="whitespace-pre-wrap break-words" title={shouldTruncate ? previousValue : undefined}>
                        {truncateAuditValue(previousValue, shouldTruncate)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      <span className="whitespace-pre-wrap break-words" title={shouldTruncate ? currentValue : undefined}>
                        {truncateAuditValue(currentValue, shouldTruncate)}
                      </span>
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

export function AuditLogsModal({
  open,
  onOpenChange,
  entityId,
  title = "Audit Logs",
  entityName,
  pageSize = 25,
}: AuditLogsModalProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { logs, hasNext, isLoading, isLoadingMore, error, refresh, loadMore } = useAuditLogs({
    entityId,
    enabled: open,
    pageSize,
  })

  const modalTitle = useMemo(() => {
    if (!entityName) return title
    return `${title} - ${entityName}`
  }, [entityName, title])

  useEffect(() => {
    if (!open) {
      setExpandedId(null)
    }
  }, [entityId, open])

  const toggleExpanded = (logId: string) => {
    setExpandedId((current) => (current === logId ? null : logId))
  }

  return (
    <CustomModal
      open={open}
      onOpenChange={onOpenChange}
      title={modalTitle}
      description="Change history associated with the selected record."
      maxWidthClassName="sm:max-w-[980px]"
      constrainHeight
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
          {isLoading ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-slate-500">
              <Spinner className="h-6 w-6 text-[#037ECC]" />
              <p className="text-sm font-medium">Loading audit logs...</p>
            </div>
          ) : error ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-xl border border-amber-200 bg-amber-50 px-6 text-center">
              <div>
                <p className="text-sm font-semibold text-amber-800">Unable to load audit logs</p>
                <p className="mt-1 text-sm text-amber-700">{error.message}</p>
              </div>
              <Button variant="secondary" onClick={refresh}>
                <RefreshCcw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                <History className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">No audit logs found</p>
                <p className="mt-1 text-sm text-slate-500">This record does not have associated events yet.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <div className="min-w-[620px]">
                <div className="grid grid-cols-[44px_minmax(220px,1fr)_220px_160px] items-center border-b border-slate-200 bg-slate-50 px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <div />
                  <div>Entity</div>
                  <div>Created At</div>
                  <div className="text-center">Actions</div>
                </div>

                <div>
                  {logs.map((log) => {
                    const isExpanded = expandedId === log.id

                    return (
                      <div key={log.id} className="border-b border-slate-100 last:border-b-0">
                        <div
                          className={cn(
                            "grid grid-cols-[44px_minmax(220px,1fr)_220px_160px] items-center px-3 py-3 text-sm transition-colors",
                            isExpanded ? "bg-slate-50" : "bg-white hover:bg-slate-50/70"
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => toggleExpanded(log.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-200"
                            aria-label={isExpanded ? "Collapse audit log" : "Expand audit log"}
                          >
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 transition-transform",
                                isExpanded ? "rotate-0" : "-rotate-90"
                              )}
                            />
                          </button>

                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-800" title={log.entityClass || undefined}>
                              {log.entityClass || "Entity"}
                            </p>
                            {log.actionType && (
                              <p className="truncate text-xs text-slate-500" title={log.actionType}>
                                {log.actionType}
                              </p>
                            )}
                          </div>

                          <div className="font-medium text-slate-700">{formatAuditDate(log.createAt)}</div>

                          <div className="text-center">
                            <Badge
                              variant="outline"
                              className={cn("min-w-[92px] rounded-full px-4 py-1 font-bold", getActionBadgeClassName(log.action))}
                            >
                              {getAuditLogActionLabel(log.action)}
                            </Badge>
                          </div>
                        </div>

                        {isExpanded && <AuditLogDetails log={log} />}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {!isLoading && !error && hasNext && (
            <div className="flex justify-center pt-4">
              <Button variant="secondary" onClick={loadMore} loading={isLoadingMore}>
                Load more
              </Button>
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-end border-t border-slate-200 bg-white px-6 py-4">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </div>
    </CustomModal>
  )
}
