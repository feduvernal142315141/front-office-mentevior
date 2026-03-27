import type { ReactNode } from "react"
import { Shield } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { InsurancePlanDetailDto } from "@/lib/types/insurance-plan-rate.types"
import { cn } from "@/lib/utils"

interface InsurancePlanOverviewProps {
  /** Plan from GET /insurance-plans/{payerId} */
  planFromList?: InsurancePlanDetailDto | null
  isLoadingPlans?: boolean
  plansError?: Error | null
}

const FALLBACK = "—"

function display(v?: string | null): string {
  const t = v?.trim()
  return t && t.length > 0 ? t : FALLBACK
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
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">{label}</p>
      <p className={cn("mt-1.5 break-words text-sm font-medium leading-snug text-slate-800", valueClassName)}>
        {children}
      </p>
    </div>
  )
}

function PlanSectionSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-28 rounded-full" />
      <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-4 w-full max-w-xs" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-full max-w-xs" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  )
}

export function InsurancePlanOverview({
  planFromList,
  isLoadingPlans = false,
  plansError,
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
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200/90 bg-slate-50/40 px-4 py-6 text-center sm:flex-row sm:justify-start sm:gap-4 sm:text-left">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 ring-1 ring-[#037ECC]/15">
            <Shield className="h-5 w-5 text-[#037ECC]/75" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 max-w-md space-y-0.5">
            <p className="text-sm font-semibold text-slate-800">No insurance plan yet</p>
            <p className="text-xs leading-relaxed text-slate-500">
              Use <span className="font-medium text-slate-600">Edit plan</span> to configure plan details and rates.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const payerName = planFromList.payerName
  const planName = planFromList.planName
  const planTypeName = planFromList.planTypeName
  const comments = planFromList.comments

  return (
    <div className="space-y-4">
      {plansError ? (
        <p className="text-xs text-amber-700">
          Could not refresh plan from server ({plansError.message}). Showing last loaded data.
        </p>
      ) : null}

      <div className="inline-flex items-center gap-1.5 rounded-full border border-[#037ECC]/20 bg-[#037ECC]/[0.06] px-2.5 py-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-[#037ECC]" aria-hidden />
        <span className="text-[11px] font-semibold text-[#025fa0]">Plan linked</span>
      </div>

      <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
        <Field label="Plan name" className="md:col-span-2">
          {display(planName)}
        </Field>
        <Field label="Clearing house">{display(payerName)}</Field>
        <Field label="Plan type">{display(planTypeName)}</Field>
        <Field label="Comments" className="md:col-span-2">
          <span className="whitespace-pre-wrap">{display(comments)}</span>
        </Field>
      </div>
    </div>
  )
}
