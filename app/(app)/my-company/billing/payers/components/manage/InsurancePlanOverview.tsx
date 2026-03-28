"use client"

import type { ReactNode } from "react"
import { format } from "date-fns"
import { Shield } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { InsurancePlanDetailDto, InsurancePlanRateRow } from "@/lib/types/insurance-plan-rate.types"
import { cn } from "@/lib/utils"

interface InsurancePlanOverviewProps {
  /** Plan from GET /insurance-plans/{payerId} */
  planFromList?: InsurancePlanDetailDto | null
  isLoadingPlans?: boolean
  plansError?: Error | null
  /** Rates from GET /rates/by-payer-id/{payerId} */
  ratesRows: InsurancePlanRateRow[]
  isLoadingRates?: boolean
  ratesError?: Error | null
}

const FALLBACK = "—"

const INTERVAL_OPTIONS = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Biweekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "YEARLY", label: "Yearly" },
] as const

function display(v?: string | null): string {
  const t = v?.trim()
  return t && t.length > 0 ? t : FALLBACK
}

function formatDisplayDate(iso: string) {
  if (!iso?.trim()) return FALLBACK
  const [y, m, d] = iso.split("-").map(Number)
  if (!y || !m || !d) return iso
  try {
    return format(new Date(y, m - 1, d), "MM/dd/yyyy")
  } catch {
    return iso
  }
}

function formatMoney(amount: number) {
  const text = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return text
}

function Field({
  label,
  children,
  className,
  valueClassName,
}: {
  label: string
  children: ReactNode
  className?: string
  valueClassName?: string
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">{label}</p>
      <p className={cn("mt-1.5 break-words text-sm font-medium leading-snug text-gray-900", valueClassName)}>
        {children}
      </p>
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-semibold tracking-tight text-gray-900">{children}</h3>
}

/** Same breakpoints as GeneralInfoOverview */
const OVERVIEW_GRID = "grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4"

function RatesSubsectionSkeleton() {
  return (
    <div className={OVERVIEW_GRID}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-20 bg-gray-200" />
          <Skeleton className="h-4 w-full bg-gray-100" />
        </div>
      ))}
    </div>
  )
}

function PlanSectionSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-5 w-24 bg-gray-200" />
        <div className={OVERVIEW_GRID}>
          <div className="space-y-2 sm:col-span-2 lg:col-span-2">
            <Skeleton className="h-3 w-24 bg-gray-200" />
            <Skeleton className="h-4 w-full max-w-md bg-gray-100" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 bg-gray-200" />
            <Skeleton className="h-4 w-full bg-gray-100" />
          </div>
          <div className="space-y-2 sm:col-span-2 lg:col-span-4">
            <Skeleton className="h-3 w-24 bg-gray-200" />
            <Skeleton className="h-16 w-full bg-gray-100" />
          </div>
        </div>
      </div>
      <div className="space-y-4 border-t border-gray-100 pt-8">
        <Skeleton className="h-5 w-20 bg-gray-200" />
        <RatesSubsectionSkeleton />
      </div>
    </div>
  )
}

function RateFieldsGridAllDashes() {
  return (
    <div className={OVERVIEW_GRID}>
      <Field label="Alias">{FALLBACK}</Field>
      <Field label="Amount">{FALLBACK}</Field>
      <Field label="Submit amount">{FALLBACK}</Field>
      <Field label="Interval type">{FALLBACK}</Field>
      <Field label="Start date">{FALLBACK}</Field>
      <Field label="End date">{FALLBACK}</Field>
    </div>
  )
}

function RateFieldsGrid({
  row,
  intervalLabel,
}: {
  row: InsurancePlanRateRow
  intervalLabel: string
}) {
  return (
    <div className={OVERVIEW_GRID}>
      <Field label="Alias">{display(row.alias)}</Field>
      <Field label="Amount">{formatMoney(row.amount)}</Field>
      <Field label="Submit amount">{formatMoney(row.submitAmount)}</Field>
      <Field label="Interval type">{display(intervalLabel)}</Field>
      <Field label="Start date">{formatDisplayDate(row.startDate)}</Field>
      <Field label="End date">{formatDisplayDate(row.endDate)}</Field>
    </div>
  )
}

export function InsurancePlanOverview({
  planFromList,
  isLoadingPlans = false,
  plansError,
  ratesRows,
  isLoadingRates = false,
  ratesError,
}: InsurancePlanOverviewProps) {
  if (isLoadingPlans) {
    return <PlanSectionSkeleton />
  }

  if (!planFromList) {
    return (
      <div className="space-y-4">
        {plansError ? (
          <p className="text-xs text-amber-700">
            Could not load insurance plan ({plansError.message}).
          </p>
        ) : null}
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-8 text-center sm:flex-row sm:justify-start sm:gap-4 sm:text-left">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50">
            <Shield className="h-5 w-5 text-[#037ECC]" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 max-w-md space-y-0.5">
            <p className="text-sm font-semibold text-gray-900">No insurance plan yet</p>
            <p className="text-sm text-gray-600">
              Use <span className="font-medium text-gray-800">Edit plan</span> to configure plan details and rates.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const planName = planFromList.planName
  const planTypeName = planFromList.planTypeName
  const comments = planFromList.comments

  return (
    <div className="space-y-8">
      {plansError ? (
        <p className="text-xs text-amber-700">
          Could not refresh plan from server ({plansError.message}). Showing last loaded data.
        </p>
      ) : null}

      <div className="space-y-4">
        <SectionTitle>General</SectionTitle>
        <div className={OVERVIEW_GRID}>
          <Field label="Plan name" className="sm:col-span-2 lg:col-span-2">
            {display(planName)}
          </Field>
          <Field label="Plan type">{display(planTypeName)}</Field>
          <Field label="Comments" className="sm:col-span-2 lg:col-span-4">
            <span className="whitespace-pre-wrap">{display(comments)}</span>
          </Field>
        </div>
      </div>

      <div className="space-y-6 border-t border-gray-100 pt-8">
        <SectionTitle>Rates</SectionTitle>
        {ratesError ? (
          <p className="text-xs text-amber-700">
            Could not load rates ({ratesError.message}). Showing placeholders.
          </p>
        ) : null}
        {isLoadingRates ? (
          <RatesSubsectionSkeleton />
        ) : ratesRows.length === 0 ? (
          <RateFieldsGridAllDashes />
        ) : (
          <div className="space-y-8">
            {ratesRows.map((row, index) => {
              const intervalLabel =
                INTERVAL_OPTIONS.find((o) => o.value === row.intervalType)?.label ?? row.intervalType

              return (
                <div key={row.id ?? `rate-${index}`} className="space-y-4">
                  {ratesRows.length > 1 ? (
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Rate {index + 1}
                      {row.alias?.trim() ? ` — ${row.alias.trim()}` : ""}
                    </p>
                  ) : null}
                  <RateFieldsGrid
                    row={row}
                    intervalLabel={intervalLabel}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
