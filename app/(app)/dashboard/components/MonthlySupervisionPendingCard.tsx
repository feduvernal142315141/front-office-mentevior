import { FileSignature, Inbox } from "lucide-react"
import { SectionCard } from "@/components/custom/SectionCard"
import type { MonthlySupervisionPendingSignature } from "@/lib/types/dashboard.types"
import { formatReportMonthLong, parseReportMonth } from "@/lib/utils/report-month"
import { RowChevron, RowLink } from "./RowLink"
import { WidgetEmptyState, WidgetPendingBackend, WidgetSkeleton } from "./WidgetStates"

interface MonthlySupervisionPendingCardProps {
  items?: MonthlySupervisionPendingSignature[]
  isLoading?: boolean
}

function formatPendingMonth(value?: string): string {
  const parsed = parseReportMonth(value)
  if (parsed) return formatReportMonthLong(parsed)

  // Compatibilidad con registros antiguos almacenados como `MMyyyy`.
  const legacy = /^(0[1-9]|1[0-2])(\d{4})$/.exec(value?.trim() ?? "")
  return legacy ? formatReportMonthLong(`${legacy[2]}${legacy[1]}`) : "Month unavailable"
}

export function MonthlySupervisionPendingCard({ items, isLoading }: MonthlySupervisionPendingCardProps) {
  return (
    <SectionCard
      icon={<FileSignature className="h-4 w-4" />}
      title="Monthly Supervision to sign"
      subtitle={items && items.length > 0 ? `${items.length} pending` : undefined}
      className="h-full"
    >
      {isLoading && <WidgetSkeleton rows={2} />}

      {!isLoading && !items && <WidgetPendingBackend label="Monthly Supervision signatures" />}

      {!isLoading && items && items.length === 0 && (
        <WidgetEmptyState
          icon={<Inbox className="h-5 w-5" />}
          title="No Monthly Supervision to sign"
          description="You're all caught up."
          tone="positive"
        />
      )}

      {!isLoading && items && items.length > 0 && (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <RowLink
                href={`/monthly-supervisions/${item.id}/edit`}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-slate-50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-800">{item.clientName}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {formatPendingMonth(item.requestedReportDate)}
                  </span>
                </span>
                <RowChevron />
              </RowLink>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}
