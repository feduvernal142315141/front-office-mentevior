"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, ImageIcon, Pencil } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { Card } from "@/components/custom/Card"
import { usePayerById } from "@/lib/modules/payers/hooks/use-payer-by-id"
import { useCountries } from "@/lib/modules/addresses/hooks/use-countries"
import { useStates } from "@/lib/modules/addresses/hooks/use-states"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/hooks/use-auth"
import { usePayersPermissionFallback } from "../../hooks/usePayersPermissionFallback"
import { EditInsurancePlanModal } from "./EditInsurancePlanModal"
import { GeneralInfoOverview } from "./GeneralInfoOverview"
import { InsurancePlanOverview } from "./InsurancePlanOverview"

interface PayerManagePageProps {
  payerId: string
}

const SECTION_ACCENT =
  "mt-0.5 h-7 w-1 shrink-0 self-start rounded-full bg-gradient-to-b from-[#037ECC] to-[#079CFB] shadow-[0_0_0_1px_rgba(3,126,204,0.12)]"

/** Section edit actions: sin fondo ni subrayado; color marca en texto e icono */
const SECTION_EDIT_BUTTON_CLASS =
  "shrink-0 border-0 bg-transparent shadow-none hover:shadow-none text-[#037ECC] hover:bg-transparent hover:text-[#025fa0] active:bg-transparent"

export function PayerManagePage({ payerId }: PayerManagePageProps) {
  const router = useRouter()
  const { hydrated } = useAuth()
  const { canManagePayers } = usePayersPermissionFallback()
  const { payer, isLoading, error, refetch } = usePayerById(payerId)
  const [editPlanOpen, setEditPlanOpen] = useState(false)
  const { countries } = useCountries()
  const selectedCountryId = payer?.countryId ?? null
  const { states } = useStates(selectedCountryId)

  const countryName = countries.find((country) => country.id === payer?.countryId)?.name
  const stateName = payer?.stateId ? states.find((state) => state.id === payer.stateId)?.name ?? payer.stateName : undefined

  useEffect(() => {
    if (hydrated && !canManagePayers) {
      router.replace("/dashboard")
    }
  }, [canManagePayers, hydrated, router])

  if (!hydrated || !canManagePayers) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50/90 to-white p-6 pb-28">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-10 w-64 rounded-xl bg-slate-200/70 animate-pulse" />
          <div className="h-48 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="h-72 rounded-2xl bg-slate-100 animate-pulse" />
        </div>
      </div>
    )
  }

  if (error || !payer) {
    return (
      <div className="min-h-screen bg-slate-50/80 p-6">
        <div className="mx-auto max-w-6xl rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-medium text-red-700">Could not load payer</p>
          <p className="mt-1 text-sm text-red-600">{error?.message ?? "Unknown error"}</p>
          <Button variant="secondary" className="mt-4" onClick={() => router.push("/my-company/billing/payers")}>
            Back to payers
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/80 via-white to-slate-50/30 pb-28">
      <div className="border-b border-slate-200/60 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
            <Link
              href="/my-company/billing/payers"
              className="transition-colors hover:text-[#037ECC]"
            >
              Payers
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="font-medium text-slate-600">Manage payer</span>
          </nav>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5 min-w-0">
            <div
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] sm:h-[72px] sm:w-[72px]",
              )}
            >
              {payer.logoUrl ? (
                <img src={payer.logoUrl} alt="" className="h-full w-full object-contain p-2" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/8">
                  <ImageIcon className="h-8 w-8 text-[#037ECC]/65 sm:h-9 sm:w-9" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
                Manage payer: {payer.name}
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-snug text-slate-600">
                Review payer profile, clearing house association, and operational context.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-7">
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2.5">
              <span className={SECTION_ACCENT} aria-hidden />
              <div>
                <h2 className="text-base font-semibold tracking-tight text-slate-900">General information</h2>
                <p className="mt-0.5 text-xs text-slate-500">Contact, address, and identifiers.</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              className={SECTION_EDIT_BUTTON_CLASS}
              onClick={() => router.push(`/my-company/billing/payers/${payer.id}/edit`)}
            >
              <Pencil className="h-4 w-4 shrink-0 text-current" />
              Edit details
            </Button>
          </div>
          <Card
            variant="outlined"
            padding="lg"
            className="rounded-2xl border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          >
            <GeneralInfoOverview payer={payer} countryName={countryName} stateName={stateName} />
          </Card>
        </section>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2.5">
              <span className={SECTION_ACCENT} aria-hidden />
              <div>
                <h2 className="text-base font-semibold tracking-tight text-slate-900">Insurance plan</h2>
                <p className="mt-0.5 text-xs text-slate-500">Clearing house, plan type, and notes.</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              className={SECTION_EDIT_BUTTON_CLASS}
              onClick={() => setEditPlanOpen(true)}
            >
              <Pencil className="h-4 w-4 shrink-0 text-current" />
              Edit plan
            </Button>
          </div>
          <Card
            variant="outlined"
            padding="lg"
            className="rounded-2xl border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          >
            <InsurancePlanOverview payer={payer} />
          </Card>
        </section>
      </div>

      <EditInsurancePlanModal
        payer={payer}
        open={editPlanOpen}
        onOpenChange={setEditPlanOpen}
        onSaved={() => void refetch()}
      />
    </div>
  )
}
