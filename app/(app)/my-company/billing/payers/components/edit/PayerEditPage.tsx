"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ShieldCheck } from "lucide-react"
import { Card } from "@/components/custom/Card"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import { usePayerById } from "@/lib/modules/payers/hooks/use-payer-by-id"
import { useUpdatePayer } from "@/lib/modules/payers/hooks/use-update-payer"
import { useCountries } from "@/lib/modules/addresses/hooks/use-countries"
import { useStates } from "@/lib/modules/addresses/hooks/use-states"
import { usePayerCatalogs } from "@/lib/modules/payers/hooks/use-payer-catalogs"
import { payerBaseFormSchema, getPayerBaseFormDefaults, type PayerBaseFormValues } from "@/lib/schemas/payer-form.schema"
import { normalizePhone } from "@/lib/utils/phone-format"
import { PayerBaseForm } from "../shared/PayerBaseForm"

interface PayerEditPageProps {
  payerId: string
}

export function PayerEditPage({ payerId }: PayerEditPageProps) {
  const router = useRouter()
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
        planNotes: payer.planNotes ?? "",
        logo: "",
      })
      if (countryId) setSelectedCountryId(countryId)
    }
  }, [payer, form])

  const handleSave = form.handleSubmit(async (data) => {
    if (!payer) return

    const saved = await update({
      id: payer.id,
      source: payer.source,
      sourceReferenceId: payer.sourceReferenceId ?? "",
      logo: data.logo || payer.logoUrl || "",
      clearingHouseId: data.planTypeId ?? payer.clearingHouseId ?? payer.planTypeId ?? "",
      planNotes: data.planNotes ?? payer.planNotes,
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
      router.push("/my-company/billing/payers")
    }
  })

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

          <FormBottomBar
            isSubmitting={isSaving}
            onCancel={() => router.push("/my-company/billing/payers")}
            cancelText="Back"
            submitText="Save changes"
          />
        </form>
      </div>
    </div>
  )
}
