"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronRight,
  FileText,
  Pencil,
  Share2,
  Shield,
  Sliders,
  Users,
} from "lucide-react"
import { Button } from "@/components/custom/Button"
import { Card } from "@/components/custom/Card"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { usePayerById } from "@/lib/modules/payers/hooks/use-payer-by-id"
import { useCountries } from "@/lib/modules/addresses/hooks/use-countries"
import { useStates } from "@/lib/modules/addresses/hooks/use-states"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { parseLocalDate } from "@/lib/date"
import { useAuth } from "@/lib/hooks/use-auth"
import { usePayersPermissionFallback } from "../../hooks/usePayersPermissionFallback"
import { GeneralInfoOverview } from "./GeneralInfoOverview"

interface PayerManagePageProps {
  payerId: string
}

const noopBlur = () => {}

export function PayerManagePage({ payerId }: PayerManagePageProps) {
  const router = useRouter()
  const { hydrated } = useAuth()
  const { canManagePayers } = usePayersPermissionFallback()
  const { payer, isLoading, error } = usePayerById(payerId)
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
      <div className="min-h-screen bg-gradient-to-b from-slate-50/90 to-white p-6 pb-24">
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

  const planTitle = payer.clearingHouseName || payer.planTypeName || "Insurance plan"
  const planIdLabel = payer.externalId || payer.id.slice(0, 8).toUpperCase()
  const updatedLabel =
    payer.updatedAt || payer.createdAt
      ? format(parseLocalDate(payer.updatedAt ?? payer.createdAt ?? ""), "MMM dd, yyyy")
      : "—"

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/90 via-white to-slate-50/40">
      <div className="border-b border-slate-200/70 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-slate-500">
            <Link href="/my-company/billing/payers" className="hover:text-[#037ECC] transition-colors">
              Payers
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="font-medium text-slate-700">Manage payer</span>
          </nav>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4 min-w-0">
              <div className="rounded-2xl border border-[#037ECC]/25 bg-gradient-to-br from-[#037ECC]/12 to-[#079CFB]/10 p-3.5 shadow-sm shadow-[#037ECC]/10">
                <Sliders className="h-8 w-8 text-[#037ECC]" />
              </div>
              <div className="min-w-0">
                <h1 className="bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
                  Manage payer: {payer.name}
                </h1>
                <p className="mt-1.5 max-w-2xl text-sm text-slate-600">
                  Review payer profile, clearing house association, and operational context. Use Edit for full form
                  changes.
                </p>
              </div>
            </div>

            <div className="flex flex-shrink-0 flex-wrap gap-3">
              <Button variant="secondary" onClick={() => router.push("/my-company/billing/payers")}>
                Back to payers
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-10 px-6 py-10">
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="h-8 w-1 rounded-full bg-gradient-to-b from-[#037ECC] to-[#079CFB]" />
              <h2 className="text-lg font-bold text-slate-900">General information</h2>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/my-company/billing/payers/${payer.id}/edit`)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition-colors hover:text-[#037ECC]"
            >
              <Pencil className="h-4 w-4" />
              Edit details
            </button>
          </div>
          <Card variant="elevated" padding="lg" className="border-slate-200/70 shadow-sm">
            <GeneralInfoOverview payer={payer} countryName={countryName} stateName={stateName} />
          </Card>
        </section>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="h-8 w-1 rounded-full bg-gradient-to-b from-amber-500 to-orange-400" />
              <h2 className="text-lg font-bold text-slate-900">Insurance plan</h2>
            </div>
            <span className="text-sm font-medium text-slate-500">Clearing house &amp; notes</span>
          </div>

          <Card variant="elevated" padding="none" className="overflow-hidden border-slate-200/70 shadow-sm">
            <div className="border-b border-slate-100 bg-white px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-900">{planTitle}</h3>
                    <span className="rounded-lg border border-[#037ECC]/25 bg-[#037ECC]/8 px-2 py-0.5 text-xs font-semibold text-[#037ECC]">
                      Clearing house
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">ID: {planIdLabel}</p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
                    payer.active !== false
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-50 text-slate-600",
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {payer.active !== false ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FloatingInput
                  label="Source"
                  value={payer.source}
                  onChange={() => {}}
                  onBlur={noopBlur}
                  disabled
                />
                <FloatingInput
                  label="ZIP"
                  value={payer.zipCode || "—"}
                  onChange={() => {}}
                  onBlur={noopBlur}
                  disabled
                />
                <FloatingInput
                  label="Last updated"
                  value={updatedLabel}
                  onChange={() => {}}
                  onBlur={noopBlur}
                  disabled
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/40 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="primary"
                className="w-full sm:w-auto"
                onClick={() => router.push(`/my-company/billing/payers/${payer.id}/edit`)}
              >
                <span className="inline-flex items-center gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit plan
                </span>
              </Button>
              <p className="text-xs text-slate-500">Adjust clearing house, address, and billing notes on the edit form.</p>
            </div>

            <div className="bg-gradient-to-r from-[#037ECC] to-[#079CFB] px-6 py-8">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white">
                    <Shield className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold tracking-tight text-white">—</p>
                    <p className="text-sm font-medium text-white/85">Profile completeness</p>
                  </div>
                </div>
                <p className="max-w-sm text-sm text-white/80">
                  {payer.description
                    ? payer.description.slice(0, 160) + (payer.description.length > 160 ? "…" : "")
                    : "Add a description in edit to capture billing caveats and coverage notes."}
                </p>
              </div>
            </div>
          </Card>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card variant="elevated" padding="md" className="border-slate-200/70">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#037ECC]/10 text-[#037ECC]">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Documentation</p>
                <p className="text-xs text-slate-500">Linked files coming soon</p>
              </div>
            </div>
          </Card>
          <Card variant="elevated" padding="md" className="border-slate-200/70">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
                <Share2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Integration</p>
                <p className="text-xs font-medium text-emerald-700">Ready for configuration</p>
              </div>
            </div>
          </Card>
          <Card variant="elevated" padding="md" className="border-slate-200/70">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Assigned agents</p>
                <p className="text-xs text-slate-500">Manage in operations tools</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
