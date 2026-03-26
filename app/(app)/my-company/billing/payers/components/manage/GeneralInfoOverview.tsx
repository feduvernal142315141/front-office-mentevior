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
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1.5 break-words text-sm font-semibold text-slate-900">{children}</p>
    </div>
  )
}

export function GeneralInfoOverview({ payer, countryName, stateName }: GeneralInfoOverviewProps) {
  const mailing = [payer.addressLine1, payer.addressLine2]
    .filter((line) => line && String(line).trim())
    .join(", ")

  const stateZipCountry = [
    stateName ?? payer.stateName ?? payer.stateId,
    payer.zipCode,
    countryName ?? payer.countryId,
  ]
    .filter((part) => part && String(part).trim())
    .join(", ")

  const payerIdDisplay = payer.sourceReferenceId?.trim() || payer.id

  const clearingDisplay = [payer.planTypeName, payer.clearingHouseName]
    .filter((x) => x && String(x).trim())
    .join(" | ")

  const website = payer.website?.trim()

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2 xl:grid-cols-4">
      <Field label="Name">{display(payer.name)}</Field>
    
      <Field label="External ID">{display(payer.externalId)}</Field>
      <Field label="Group number">{display(payer.groupNumber)}</Field>

      <Field label="Contact email">{display(payer.email)}</Field>
      <Field label="Phone number">{display(payer.phone)}</Field>
      <Field label="Website">{display(website)}</Field>
      <div className="hidden xl:block" aria-hidden />

      <Field label="Mailing address" className="sm:col-span-2">
        {display(mailing)}
      </Field>
      <Field label="City">{display(payer.city)}</Field>
      <Field label="State / ZIP / Country">{display(stateZipCountry)}</Field>

      <Field label="Allow clearing houses" className="sm:col-span-2 xl:col-span-2">
        {display(clearingDisplay)}
      </Field>
      <Field label="Description" className="sm:col-span-2 xl:col-span-2">
        {display(payer.description)}
      </Field>
    </div>
  )
}
