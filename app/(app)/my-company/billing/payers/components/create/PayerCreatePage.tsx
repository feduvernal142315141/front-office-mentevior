"use client"

import { useRouter } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import { Building2, Landmark, ShieldCheck } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card } from "@/components/custom/Card"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import { useCreatePayer } from "@/lib/modules/payers/hooks/use-create-payer"
import { usePayerCatalogs } from "@/lib/modules/payers/hooks/use-payer-catalogs"
import { useCountries } from "@/lib/modules/addresses/hooks/use-countries"
import { useStates } from "@/lib/modules/addresses/hooks/use-states"
import { PAYER_SOURCE, type PayerSource } from "@/lib/types/payer.types"
import { payerBaseFormSchema, getPayerBaseFormDefaults, type PayerBaseFormValues } from "@/lib/schemas/payer-form.schema"
import { normalizePhone } from "@/lib/utils/phone-format"
import { PayerBaseForm } from "../shared/PayerBaseForm"

interface PayerCreatePageProps {
  source: PayerSource
  initialCatalogId?: string
  initialName?: string
}

interface SourcePageContent {
  heading: string
  description: string
  icon: LucideIcon
  catalogLabel?: string
}

const SOURCE_PAGE_CONTENT: Record<PayerSource, SourcePageContent> = {
  [PAYER_SOURCE.MANUAL]: {
    heading: "Create Payer Manually",
    description: "Set up a payer profile from scratch with full control over contact and address information.",
    icon: Building2,
  },
  [PAYER_SOURCE.CATALOG]: {
    heading: "Create Payer from Catalog",
    description: "Pick a private insurance from catalog, review details, and create the payer in one page.",
    icon: ShieldCheck,
    catalogLabel: "Private insurance catalog",
  },
  [PAYER_SOURCE.FL_MEDICAID]: {
    heading: "Create FL Medicaid Payer",
    description: "Choose one of the official FL Medicaid options and confirm payer details before creating.",
    icon: Landmark,
    catalogLabel: "FL Medicaid catalog",
  },
}

export function PayerCreatePage({ source, initialCatalogId, initialName }: PayerCreatePageProps) {
  const router = useRouter()
  const { create, isLoading } = useCreatePayer()
  const { privateInsurances, flMedicaidInsurances, clearingHouses, isLoading: isLoadingClearingHouses } = usePayerCatalogs()
  const [selectedCatalogId, setSelectedCatalogId] = useState(initialCatalogId ?? "")
  const { countries, isLoading: isLoadingCountries } = useCountries()
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null)
  const { states, isLoading: isLoadingStates } = useStates(selectedCountryId)

  const form = useForm<PayerBaseFormValues>({
    resolver: zodResolver(payerBaseFormSchema),
    defaultValues: {
      ...getPayerBaseFormDefaults(),
      name: initialName ?? "",
    },
    mode: "onBlur",
  })

  const watchCountryId = form.watch("countryId")
  useEffect(() => {
    if (watchCountryId) {
      setSelectedCountryId(watchCountryId)
      form.setValue("stateId", "")
    } else {
      setSelectedCountryId(null)
      form.setValue("stateId", "")
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchCountryId])

  const content = SOURCE_PAGE_CONTENT[source]
  const Icon = content.icon
  const isCatalogSource = source !== PAYER_SOURCE.MANUAL
  const isCatalogPreselected = isCatalogSource && Boolean(initialCatalogId)
  const catalogOptions = source === PAYER_SOURCE.CATALOG ? privateInsurances : flMedicaidInsurances
  const selectOptions = catalogOptions.map((item) => ({ value: item.id, label: item.name }))

  const handleCatalogChange = (catalogId: string) => {
    const catalogItem = catalogOptions.find((item) => item.id === catalogId)
    setSelectedCatalogId(catalogId)
    if (catalogItem) {
      form.setValue("name", catalogItem.name, { shouldValidate: true })
    }
  }

  const handleCreate = form.handleSubmit(async (data) => {
    if (isCatalogSource && !selectedCatalogId) return

    const created = await create({
      name: data.name.trim(),
      source,
      logo: data.logo ?? "",
      phone: normalizePhone(data.phone),
      email: data.email,
      externalId: data.externalId ?? "",
      groupNumber: data.groupNumber ?? "",
      addressLine1: data.addressLine1 ?? "",
      addressLine2: data.addressLine2 ?? "",
      city: data.city ?? "",
      stateId: data.stateId ?? "",
      zipCode: data.zipCode,
      clearingHouseId: data.planTypeId ?? "",
      planNotes: data.planNotes ?? "",
    })

    if (created) {
      router.push("/my-company/billing/payers")
    }
  })

  const nameValue = form.watch("name")

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 pb-28">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center gap-4">
          <div className="rounded-xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 p-3">
            <Icon className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-3xl font-bold text-transparent">
              {content.heading}
            </h1>
            <p className="mt-1 text-slate-600">{content.description}</p>
          </div>
        </div>

        <form onSubmit={handleCreate}>
          <Card variant="elevated" padding="lg">
            <div className="space-y-6">
              {isCatalogSource && content.catalogLabel && !isCatalogPreselected && (
                <FloatingSelect
                  label={content.catalogLabel}
                  value={selectedCatalogId}
                  onChange={handleCatalogChange}
                  options={selectOptions}
                  onBlur={() => undefined}
                  required
                  searchable
                />
              )}

              <PayerBaseForm
                form={form}
                countries={countries}
                states={states}
                isLoadingCountries={isLoadingCountries}
                isLoadingStates={isLoadingStates}
                clearingHouses={clearingHouses}
                isLoadingClearingHouses={isLoadingClearingHouses}
              />
            </div>
          </Card>

          <FormBottomBar
            isSubmitting={isLoading}
            onCancel={() => router.push("/my-company/billing/payers")}
            cancelText="Back"
            submitText="Create payer"
            disabled={!nameValue?.trim() || (isCatalogSource && !selectedCatalogId)}
          />
        </form>
      </div>
    </div>
  )
}
