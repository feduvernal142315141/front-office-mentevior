import type { ReactNode } from "react"
import type { Payer } from "@/lib/types/payer.types"
import { cn } from "@/lib/utils"

interface GeneralInfoOverviewProps {
  payer: Payer
  countryName?: string
  stateName?: string
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
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">{label}</p>
      <p className="mt-1.5 break-words text-sm font-medium leading-snug text-gray-900">{children}</p>
    </div>
  )
}

/**
 * xl: 4 columns per row. Description spans 3 cols; allow clearing houses spans 1 (same row).
 * Address matches create/edit payer: line 1 + line 2 separate fields.
 */
export function GeneralInfoOverview({ payer, countryName, stateName }: GeneralInfoOverviewProps) {
  const stateZipCountry = [
    stateName ?? payer.stateName ?? payer.stateId,
    payer.zipCode,
    countryName ?? payer.countryId,
  ]
    .filter((part) => part && String(part).trim())
    .join(", ")

  const clearingDisplay = [payer.planTypeName, payer.clearingHouseName]
    .filter((x) => x && String(x).trim())
    .join(" | ")

  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Name">{display(payer.name)}</Field>
      <Field label="Phone number">{display(payer.phone)}</Field>
      <Field label="Email">{display(payer.email)}</Field>
      <Field label="External ID">{display(payer.externalId)}</Field>

      <Field label="Address line 1">{display(payer.addressLine1)}</Field>
      <Field label="Address line 2">{display(payer.addressLine2)}</Field>
      <Field label="State / ZIP / Country">{display(stateZipCountry)}</Field>
      <Field label="Group number">{display(payer.groupNumber)}</Field>

      <Field label="Allow clearing houses" className="sm:col-span-1 lg:col-span-1">
        {display(clearingDisplay)}
      </Field>
      <Field label="Description" className="sm:col-span-1 lg:col-span-3">
        <span className="whitespace-pre-wrap">{display(payer.description)}</span>
      </Field>
    </div>
  )
}
