"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, type FieldErrors } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, ShieldCheck, Sliders } from "lucide-react"
import Link from "next/link"
import { Card } from "@/components/custom/Card"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import { usePayerById } from "@/lib/modules/payers/hooks/use-payer-by-id"
import { useUpdatePayer } from "@/lib/modules/payers/hooks/use-update-payer"
import { useCountries } from "@/lib/modules/addresses/hooks/use-countries"
import { useStates } from "@/lib/modules/addresses/hooks/use-states"
import { usePayerCatalogs } from "@/lib/modules/payers/hooks/use-payer-catalogs"
import { payerBaseFormSchema, getPayerBaseFormDefaults, type PayerBaseFormValues } from "@/lib/schemas/payer-form.schema"
import { normalizePhone } from "@/lib/utils/phone-format"
import { useAuth } from "@/lib/hooks/use-auth"
import { usePayersPermissionFallback } from "../../hooks/usePayersPermissionFallback"
import { PayerBaseForm } from "../shared/PayerBaseForm"

interface PayerEditPageProps {
  payerId: string
  returnTo?: string
}

const PAYERS_LIST = "/my-company/billing/payers"

export function PayerEditPage({ payerId, returnTo }: PayerEditPageProps) {
  const router = useRouter()
  const backPath = returnTo ?? PAYERS_LIST
  const { hydrated } = useAuth()
  const { canEditPayers } = usePayersPermissionFallback()
  const { payer, isLoading: isLoadingPayer } = usePayerById(payerId)
  const { update, isLoading: isSaving } = useUpdatePayer()
  const { countries, isLoading: isLoadingCountries } = useCountries()
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null)
  const { states, isLoading: isLoadingStates } = useStates(selectedCountryId)
  const { clearingHouses, isLoading: isLoadingClearingHouses } = usePayerCatalogs()
  const form = useForm<PayerBaseFormValues>({
    resolver: zodResolver(payerBaseFormSchema),
    defaultValues: getPayerBaseFormDefaults(),
    mode: "onBlur",
  })

  const watchCountryId = form.watch("countryId")
  useEffect(() => {
    if (hydrated && !canEditPayers) {
      router.replace("/dashboard")
    }
  }, [canEditPayers, hydrated, router])

  useEffect(() => {
    setSelectedCountryId(watchCountryId || null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchCountryId])

  useEffect(() => {
    if (payer) {
      const countryId = payer.countryId ?? ""
      form.reset({
        name: payer.name,
        phone: payer.phone ?? "",
        email: payer.email ?? "",
        externalId: payer.externalId ?? "",
        groupNumber: payer.groupNumber ?? "",
        addressLine1: payer.addressLine1 ?? "",
        addressLine2: payer.addressLine2 ?? "",
        city: payer.city ?? "",
        countryId,
        stateId: payer.stateId ?? "",
        zipCode: payer.zipCode ?? "",
        planTypeId: payer.clearingHouseId ?? payer.planTypeId ?? "",
        description: payer.description ?? "",
        logo: payer.logoUrl ?? "",
      })
      if (countryId) setSelectedCountryId(countryId)
    }
  }, [payer, form])

  const scrollToFirstError = (errors: FieldErrors<PayerBaseFormValues>) => {
    const firstErrorKey = Object.keys(errors)[0] as keyof PayerBaseFormValues | undefined
    if (!firstErrorKey) return

    const fieldContainer = document.querySelector(`[data-form-field="${firstErrorKey}"]`) as HTMLElement | null
    if (!fieldContainer) return

    fieldContainer.scrollIntoView({ behavior: "smooth", block: "center" })

    const focusable = fieldContainer.querySelector(
      "input, button, textarea, select, [tabindex]:not([tabindex='-1'])",
    ) as HTMLElement | null

    window.setTimeout(() => {
      focusable?.focus()
    }, 120)
  }

  const handleSave = form.handleSubmit(
    async (data) => {
      if (!payer) return

      const saved = await update({
        id: payer.id,
        source: payer.source,
        sourceReferenceId: payer.sourceReferenceId ?? "",
        logo: data.logo || payer.logoUrl || "",
        clearingHouseId: data.planTypeId ?? payer.clearingHouseId ?? payer.planTypeId ?? "",
        description: data.description ?? payer.description,
        name: data.name.trim(),
        phone: normalizePhone(data.phone),
        email: data.email,
        externalId: data.externalId ?? "",
        groupNumber: data.groupNumber ?? "",
        addressLine1: data.addressLine1 ?? "",
        addressLine2: data.addressLine2 ?? "",
        city: data.city ?? "",
        stateId: data.stateId ?? "",
        zipCode: data.zipCode,
      })

      if (saved) {
        router.push(backPath)
      }
    },
    (errors) => {
      scrollToFirstError(errors)
    },
  )

  if (!hydrated || !canEditPayers) {
    return null
  }

  if (isLoadingPayer) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-6 pb-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center gap-4">
            <div className="rounded-xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 p-3 animate-pulse w-[56px] h-[56px]" />
            <div className="space-y-2">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-72 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
          <Card variant="elevated" padding="lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-[52px] rounded-[16px] bg-gray-100 animate-pulse ${i === 0 ? "md:col-span-2" : ""}`}
                />
              ))}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 pb-28">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center gap-4">
          <div className="rounded-xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 p-3">
            <ShieldCheck className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-3xl font-bold text-transparent">
              Edit Payer
            </h1>
            <p className="mt-1 text-slate-600">{payer?.name}</p>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <Card variant="elevated" padding="lg">
            <PayerBaseForm
              form={form}
              countries={countries}
              states={states}
              isLoadingCountries={isLoadingCountries}
              isLoadingStates={isLoadingStates}
              clearingHouses={clearingHouses}
              isLoadingClearingHouses={isLoadingClearingHouses}
              existingLogoUrl={payer?.logoUrl}
              isCountryDisabled={Boolean(payer?.countryId)}
            />
          </Card>

          <Link href={`/my-company/billing/payers/${payerId}/manage`} className="block mt-4">
            <div className="group relative overflow-hidden cursor-pointer rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm hover:border-[#037ECC]/40 hover:shadow-lg hover:shadow-[#037ECC]/10 transition-all duration-300 min-h-[80px] flex items-center">
              <div className="absolute inset-0 bg-gradient-to-br from-[#037ECC]/0 via-[#079CFB]/0 to-[#037ECC]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative px-5 py-4 w-full">
                <div className="flex items-start gap-3.5">
                  <div className="flex-shrink-0 p-2.5 rounded-xl bg-[#037ECC]/10 text-[#037ECC] ring-1 ring-inset ring-[#037ECC]/20 group-hover:bg-[#037ECC]/15 transition-colors">
                    <Sliders className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="text-sm font-semibold text-slate-900 group-hover:text-[#037ECC] transition-colors leading-tight">
                        Payer Management
                      </h4>
                      <ArrowRight className="w-4 h-4 text-[#037ECC] group-hover:text-[#079CFB] group-hover:translate-x-0.5 transition-all duration-300 flex-shrink-0 mt-0.5" />
                    </div>
                    <p className="text-xs text-slate-600 leading-snug">
                      Advanced configuration for this payer
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
            </div>
          </Link>

          <FormBottomBar
            isSubmitting={isSaving}
            onCancel={() => router.push(backPath)}
            cancelText="Back"
            submitText="Save changes"
          />
        </form>
      </div>
    </div>
  )
}
