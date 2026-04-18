"use client"

import { useRouter } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import { Building2, ChevronDown, Landmark, ShieldCheck } from "lucide-react"
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { useForm, type FieldErrors } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card } from "@/components/custom/Card"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import { useCreatePayer } from "@/lib/modules/payers/hooks/use-create-payer"
import { Skeleton } from "@/components/ui/skeleton"
import { usePayerCatalogs } from "@/lib/modules/payers/hooks/use-payer-catalogs"
import { useCountries } from "@/lib/modules/addresses/hooks/use-countries"
import { useStates } from "@/lib/modules/addresses/hooks/use-states"
import { PAYER_SOURCE, type PayerSource, type LocalInsurancePlanRate } from "@/lib/types/payer.types"
import { payerFullFormSchema, getPayerBaseFormDefaults, type PayerFullFormValues } from "@/lib/schemas/payer-form.schema"
import { normalizePhone } from "@/lib/utils/phone-format"
import { useAuth } from "@/lib/hooks/use-auth"
import { usePayersPermissionFallback } from "../../hooks/usePayersPermissionFallback"
import { PayerBaseForm } from "../shared/PayerBaseForm"
import { PlanSection } from "../shared/PlanSection"
import { RateModal, type RateFormValues } from "../shared/RateModal"
import { usePlanTypeCatalog } from "@/lib/modules/payers/hooks/use-plan-type-catalog"
import { useCurrencyCatalog } from "@/lib/modules/currencies/hooks/use-currency-catalog"
import { getBillingCodes } from "@/lib/modules/billing-codes/services/billing-codes.service"
import type { BillingCodeListItem } from "@/lib/types/billing-code.types"
import { cn } from "@/lib/utils"

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
  const { hydrated } = useAuth()
  const { canCreatePayers } = usePayersPermissionFallback()
  const { create, isLoading } = useCreatePayer()
  const {
    privateInsurances,
    flMedicaidInsurances,
    clearingHouses,
    isLoading: isLoadingCatalogs,
  } = usePayerCatalogs()
  const [selectedCatalogId, setSelectedCatalogId] = useState(initialCatalogId ?? "")
  /** User removed catalog logo preview — avoid re-showing from existingLogoUrl */
  const [catalogLogoDismissed, setCatalogLogoDismissed] = useState(false)
  const { countries, isLoading: isLoadingCountries } = useCountries()
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null)
  const { states, isLoading: isLoadingStates } = useStates(selectedCountryId)

  // Plan + Rates state
  const [rates, setRates] = useState<LocalInsurancePlanRate[]>([])
  const [ratesError, setRatesError] = useState(false)
  const ratesSectionRef = useRef<HTMLDivElement>(null)
  const [isRateModalOpen, setIsRateModalOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<LocalInsurancePlanRate | null>(null)
  const [generalExpanded, setGeneralExpanded] = useState(true)

  // Plan & Rate catalogs
  const { planTypes, isLoading: isLoadingPlanTypes } = usePlanTypeCatalog()
  const { currencies, isLoading: isLoadingCurrencies } = useCurrencyCatalog()
  const [catalogBillingCodes, setCatalogBillingCodes] = useState<BillingCodeListItem[]>([])
  const [isLoadingBillingCodes, setIsLoadingBillingCodes] = useState(false)

  useEffect(() => {
    let active = true
    setIsLoadingBillingCodes(true)
    getBillingCodes({ page: 0, pageSize: 100 })
      .then((result) => { if (active) setCatalogBillingCodes(result.billingCodes ?? []) })
      .catch(() => {})
      .finally(() => { if (active) setIsLoadingBillingCodes(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (rates.length > 0) setRatesError(false)
  }, [rates.length])

  const form = useForm<PayerFullFormValues>({
    resolver: zodResolver(payerFullFormSchema),
    defaultValues: {
      ...getPayerBaseFormDefaults(),
      name: initialName ?? "",
    },
    mode: "onBlur",
  })

  const watchCountryId = form.watch("countryId")
  useEffect(() => {
    if (hydrated && !canCreatePayers) {
      router.replace("/dashboard")
    }
  }, [canCreatePayers, hydrated, router])

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

  const selectedCatalogItem = useMemo(
    () => catalogOptions.find((item) => item.id === selectedCatalogId),
    [catalogOptions, selectedCatalogId],
  )

  const catalogPreviewLogoUrl =
    isCatalogSource &&
    !catalogLogoDismissed &&
    selectedCatalogItem?.logoUrl?.trim()
      ? selectedCatalogItem.logoUrl.trim()
      : undefined

  const handleCatalogChange = (catalogId: string) => {
    const catalogItem = catalogOptions.find((item) => item.id === catalogId)
    setSelectedCatalogId(catalogId)
    setCatalogLogoDismissed(false)
    if (catalogItem) {
      form.setValue("name", catalogItem.name, { shouldValidate: true })
      form.setValue("logo", catalogItem.logoUrl?.trim() ?? "", { shouldValidate: true })
      form.clearErrors("logo")
    }
  }

  useEffect(() => {
    if (!isCatalogSource || catalogLogoDismissed) return
    const catalogLogo = selectedCatalogItem?.logoUrl?.trim() ?? ""
    if (!catalogLogo) return
    form.setValue("logo", catalogLogo, { shouldValidate: true })
    form.clearErrors("logo")
  }, [catalogLogoDismissed, form, isCatalogSource, selectedCatalogItem])

  // Rate handlers
  const usedBillingCodeIds = rates.map((r) => r.billingCodeId)

  const handleAddRate = () => { setEditingRate(null); setIsRateModalOpen(true) }
  const handleEditRate = (entry: LocalInsurancePlanRate) => { setEditingRate(entry); setIsRateModalOpen(true) }
  const handleDeleteRate = (entry: LocalInsurancePlanRate) => {
    setRates((prev) => prev.filter((r) => r._tempId !== entry._tempId))
  }
  const handleRateConfirm = (values: RateFormValues, billingCodeLabel: string, currencyLabel: string, billingModifier?: string) => {
    if (editingRate) {
      setRates((prev) => prev.map((r) =>
        r._tempId === editingRate._tempId
          ? { ...r, ...values, billingCodeLabel, currencyLabel, billingModifier } as LocalInsurancePlanRate
          : r
      ))
    } else {
      setRates((prev) => [...prev, {
        _tempId: crypto.randomUUID(),
        ...values,
        billingCodeLabel,
        currencyLabel,
        billingModifier,
      } as LocalInsurancePlanRate])
      setRatesError(false)
    }
    setIsRateModalOpen(false)
    setEditingRate(null)
  }

  const scrollToFirstError = (errors: FieldErrors<PayerFullFormValues>) => {
    const firstErrorKey = Object.keys(errors)[0] as keyof PayerFullFormValues | undefined
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

  const savePayer = form.handleSubmit(
    async (data) => {
      if (rates.length === 0) {
        window.setTimeout(() => {
          ratesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
          const focusable = ratesSectionRef.current?.querySelector(
            "input, button, textarea, select, [tabindex]:not([tabindex='-1'])",
          ) as HTMLElement | null
          window.setTimeout(() => {
            focusable?.focus()
          }, 120)
        }, 100)
        return
      }

      if (isCatalogSource && !selectedCatalogId) return

      const hasPlanData = Boolean(data.planName?.trim())

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
        description: data.description ?? "",
        ...(hasPlanData && {
          payerPlan: {
            planName: data.planName!.trim(),
            planTypeId: data.insurancePlanTypeId || "",
            comments: data.planComments || "",
          },
          payerRates: rates.map((r) => ({
            billingCodeId: r.billingCodeId,
            amount: r.amount,
            submitAmount: r.submitAmount,
            intervalType: r.intervalType,
            currencyId: r.currencyId,
            alias: r.alias || undefined,
            startDate: r.startDate || undefined,
            endDate: r.endDate || undefined,
          })),
        }),
      })

      if (!created) return

      router.push("/my-company/billing/payers")
    },
    (errors) => {
      scrollToFirstError(errors)
    },
  )

  const handleSubmitForm = (e: FormEvent) => {
    if (rates.length === 0) setRatesError(true)
    else setRatesError(false)
    savePayer(e)
  }

  const nameValue = form.watch("name")
  const isCatalogDataPending = isCatalogSource && isLoadingCatalogs

  if (!hydrated || !canCreatePayers) {
    return null
  }

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

        <form onSubmit={handleSubmitForm}>
          <Card variant="elevated" padding="lg">
            {isCatalogDataPending ? (
              <div className="space-y-6">
                {!isCatalogPreselected && (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-[52px] w-full rounded-2xl" />
                  </div>
                )}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-10" />
                  <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                    <Skeleton className="h-14 w-14 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-52" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Skeleton className="h-[52px] w-full rounded-2xl md:col-span-2" />
                  <Skeleton className="h-[52px] w-full rounded-2xl" />
                  <Skeleton className="h-[52px] w-full rounded-2xl" />
                  <Skeleton className="h-[52px] w-full rounded-2xl" />
                  <Skeleton className="h-[52px] w-full rounded-2xl" />
                  <Skeleton className="h-[52px] w-full rounded-2xl" />
                  <Skeleton className="h-[52px] w-full rounded-2xl" />
                  <Skeleton className="h-[52px] w-full rounded-2xl" />
                  <Skeleton className="h-[52px] w-full rounded-2xl md:col-span-2" />
                  <Skeleton className="h-24 w-full rounded-2xl md:col-span-2" />
                </div>
              </div>
            ) : (
              <div>
                {isCatalogSource && content.catalogLabel && !isCatalogPreselected && (
                  <div className="mb-6">
                    <FloatingSelect
                      label={content.catalogLabel}
                      value={selectedCatalogId}
                      onChange={handleCatalogChange}
                      options={selectOptions}
                      onBlur={() => undefined}
                      required
                      searchable
                    />
                  </div>
                )}

                {/* General Information — collapsible */}
                <button
                  type="button"
                  onClick={() => setGeneralExpanded(!generalExpanded)}
                  className="w-full flex items-center justify-between mb-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Building2 className="w-5 h-5 text-blue-700" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-base font-semibold text-gray-900">General Information</h3>
                      <p className="text-sm text-gray-500">Payer contact and address details</p>
                    </div>
                  </div>
                  <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", generalExpanded && "rotate-180")} />
                </button>
                {generalExpanded && (
                  <PayerBaseForm
                    form={form}
                    countries={countries}
                    states={states}
                    isLoadingCountries={isLoadingCountries}
                    isLoadingStates={isLoadingStates}
                    clearingHouses={clearingHouses}
                    isLoadingClearingHouses={isLoadingCatalogs}
                    existingLogoUrl={catalogPreviewLogoUrl}
                    existingLogoTitle={catalogPreviewLogoUrl ? "Catalog logo" : undefined}
                    existingLogoHint={
                      catalogPreviewLogoUrl
                        ? "From catalog — replace with your own file or remove below"
                        : undefined
                    }
                    onLogoClear={() => setCatalogLogoDismissed(true)}
                  />
                )}
              </div>
            )}
          </Card>

          {/* Insurance Plan — separate card */}
          <Card variant="elevated" padding="lg" className="mt-4">
            <PlanSection
              form={form}
              rates={rates}
              onAddRate={handleAddRate}
              onEditRate={handleEditRate}
              onDeleteRate={handleDeleteRate}
              planTypes={planTypes}
              isLoadingPlanTypes={isLoadingPlanTypes}
              defaultExpanded
              ratesSectionRef={ratesSectionRef}
              ratesError={ratesError}
            />
          </Card>

          <FormBottomBar
            isSubmitting={isLoading}
            onCancel={() => router.push("/my-company/billing/payers")}
            cancelText="Back"
            submitText="Create payer"
            disabled={
              isCatalogDataPending ||
              !nameValue?.trim() ||
              (isCatalogSource && !selectedCatalogId)
            }
          />
        </form>

        <RateModal
          open={isRateModalOpen}
          onClose={() => { setIsRateModalOpen(false); setEditingRate(null) }}
          onConfirm={handleRateConfirm}
          editingRate={editingRate}
          billingCodes={catalogBillingCodes}
          usedBillingCodeIds={usedBillingCodeIds}
          currencies={currencies}
          isLoadingBillingCodes={isLoadingBillingCodes}
          isLoadingCurrencies={isLoadingCurrencies}
        />
      </div>
    </div>
  )
}
