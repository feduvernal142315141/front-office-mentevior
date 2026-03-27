import type { ReactNode } from "react"
import { Shield } from "lucide-react"
import type { Payer } from "@/lib/types/payer.types"
import { cn } from "@/lib/utils"

interface InsurancePlanOverviewProps {
  payer: Payer
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

export function InsurancePlanOverview({ payer }: InsurancePlanOverviewProps) {
  const hasLinkedPlan = Boolean(payer.insurancePlanId?.trim())
  const hasPlanSpecific =
    hasLinkedPlan ||
    Boolean(payer.clearingHouseName?.trim()) ||
    Boolean(payer.planTypeName?.trim())

  if (!hasPlanSpecific) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200/90 bg-slate-50/40 py-6 px-4 text-center sm:flex-row sm:justify-start sm:text-left sm:gap-4">
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
    )
  }

  return (
    <div className="space-y-4">
      {hasLinkedPlan && (
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#037ECC]/20 bg-[#037ECC]/[0.06] px-2.5 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#037ECC]" aria-hidden />
          <span className="text-[11px] font-semibold text-[#025fa0]">Plan linked</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
        <Field label="Clearing house">{display(payer.clearingHouseName)}</Field>
        <Field label="Plan type">{display(payer.planTypeName)}</Field>
      </div>

      {payer.description?.trim() ? (
        <Field label="Comments">
          <span className="whitespace-pre-wrap">{display(payer.description)}</span>
        </Field>
      ) : null}
    </div>
  )
}
