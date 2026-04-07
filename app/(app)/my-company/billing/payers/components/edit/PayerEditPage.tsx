"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, type FieldErrors } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building2, ChevronDown, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/custom/Card"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import { usePayerById } from "@/lib/modules/payers/hooks/use-payer-by-id"
import { useUpdatePayer } from "@/lib/modules/payers/hooks/use-update-payer"
import { useCountries } from "@/lib/modules/addresses/hooks/use-countries"
import { useStates } from "@/lib/modules/addresses/hooks/use-states"
import { usePayerCatalogs } from "@/lib/modules/payers/hooks/use-payer-catalogs"
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
import { deleteInsurancePlanRate } from "@/lib/modules/payers/services/insurance-plan.service"
import type { LocalInsurancePlanRate } from "@/lib/types/payer.types"
import type { BillingCodeListItem } from "@/lib/types/billing-code.types"
import { cn } from "@/lib/utils"

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

  // Plan + Rates state
  const [rates, setRates] = useState<LocalInsurancePlanRate[]>([])
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

  const form = useForm<PayerFullFormValues>({
    resolver: zodResolver(payerFullFormSchema),
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

  // Populate form with existing payer data
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
        planName: "",
        insurancePlanTypeId: "",
        planComments: "",
      })
      if (countryId) setSelectedCountryId(countryId)
    }
  }, [payer, form])

  // Load existing plan + rates from embedded fields (no extra fetch needed)
  useEffect(() => {
    if (!payer) return

    // Map embedded plan
    const plan = payer.payerPlan
    if (plan) {
      form.reset({
        ...form.getValues(),
        planName: plan.planName || "",
        insurancePlanTypeId: plan.planTypeId || "",
        planComments: plan.comments || "",
      })
    }

    // Map embedded rates
    const embeddedRates = payer.payerRates ?? []
    setRates(embeddedRates.map((r) => ({
      _tempId: crypto.randomUUID(),
      id: r.id,
      billingCodeId: r.billingCodeId,
      billingCodeLabel: r.billingCode ?? r.billingCodeId,
      amount: r.amount,
      submitAmount: r.submitAmount ?? undefined,
      intervalType: r.intervalType,
      currencyId: r.currencyId,
      currencyLabel: r.currencyCode || r.currencyId,
      alias: r.alias,
      startDate: r.startDate ?? undefined,
      endDate: r.endDate ?? undefined,
    })))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payer])

  // Rate handlers
  const usedBillingCodeIds = rates.map((r) => r.billingCodeId)

  const handleAddRate = () => { setEditingRate(null); setIsRateModalOpen(true) }
  const handleEditRate = (entry: LocalInsurancePlanRate) => { setEditingRate(entry); setIsRateModalOpen(true) }
  const handleDeleteRate = async (entry: LocalInsurancePlanRate) => {
    if (entry.id) {
      try {
        await deleteInsurancePlanRate(entry.id)
      } catch {
        toast.error("Failed to delete rate")
        return
      }
    }
    setRates((prev) => prev.filter((r) => r._tempId !== entry._tempId))
  }
  const handleRateConfirm = (values: RateFormValues, billingCodeLabel: string, currencyLabel: string) => {
    if (editingRate) {
      setRates((prev) => prev.map((r) =>
        r._tempId === editingRate._tempId
          ? { ...r, ...values, billingCodeLabel, currencyLabel } as LocalInsurancePlanRate
          : r
      ))
    } else {
      setRates((prev) => [...prev, {
        _tempId: crypto.randomUUID(),
        ...values,
        billingCodeLabel,
        currencyLabel,
      } as LocalInsurancePlanRate])
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

  const handleSave = form.handleSubmit(
    async (data) => {
      if (!payer) return

      const hasPlanData = Boolean(data.planName?.trim())

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
        ...(hasPlanData && {
          payerPlan: {
            id: payer.payerPlan?.id,
            planName: data.planName!.trim(),
            planTypeId: data.insurancePlanTypeId || "",
            comments: data.planComments || "",
          },
          payerRates: rates.map((r) => ({
            id: r.id,
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

      if (!saved) return

      router.push(backPath)
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
          {/* General Information */}
          <Card variant="elevated" padding="lg">
            <div>
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
                  isLoadingClearingHouses={isLoadingClearingHouses}
                  existingLogoUrl={payer?.logoUrl}
                  isCountryDisabled={Boolean(payer?.countryId)}
                />
              )}
            </div>
          </Card>

          {/* Insurance Plan */}
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
            />
          </Card>

          <FormBottomBar
            isSubmitting={isSaving}
            onCancel={() => router.push(backPath)}
            cancelText="Back"
            submitText="Save changes"
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
