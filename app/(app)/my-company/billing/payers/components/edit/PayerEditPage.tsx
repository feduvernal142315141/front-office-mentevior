"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { useFieldArray, useForm, type FieldErrors } from "react-hook-form"
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
import type { LocalInsurancePlanRate, PayerPlanEmbed } from "@/lib/types/payer.types"
import type { BillingCodeListItem } from "@/lib/types/billing-code.types"
import { cn } from "@/lib/utils"
import { formatBillingCodeDisplay } from "@/lib/utils/billing-code-display"

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

  // Plans + rates state
  const [planRates, setPlanRates] = useState<Record<string, LocalInsurancePlanRate[]>>({})
  const [planBackendIdByFieldId, setPlanBackendIdByFieldId] = useState<Record<string, string | undefined>>({})
  const [ratesErrorByPlan, setRatesErrorByPlan] = useState<Record<string, boolean>>({})
  const ratesSectionRef = useRef<HTMLDivElement>(null)
  const [isRateModalOpen, setIsRateModalOpen] = useState(false)
  const [activeRatePlanId, setActiveRatePlanId] = useState<string | null>(null)
  const [editingRate, setEditingRate] = useState<LocalInsurancePlanRate | null>(null)
  const [generalExpanded, setGeneralExpanded] = useState(true)
  const [apiPlansSnapshot, setApiPlansSnapshot] = useState<PayerPlanEmbed[]>([])
  const [apiRatesSnapshotByIndex, setApiRatesSnapshotByIndex] = useState<LocalInsurancePlanRate[][]>([])
  const hasHydratedRatesFromApiRef = useRef(false)
  const hasUserMutatedRatesRef = useRef(false)
  const planRatesRef = useRef<Record<string, LocalInsurancePlanRate[]>>({})

  // Plan & Rate catalogs
  const { planTypes, isLoading: isLoadingPlanTypes } = usePlanTypeCatalog()
  const { currencies, isLoading: isLoadingCurrencies } = useCurrencyCatalog()
  const [catalogBillingCodes, setCatalogBillingCodes] = useState<BillingCodeListItem[]>([])
  const [isLoadingBillingCodes, setIsLoadingBillingCodes] = useState(false)

  useEffect(() => {
    planRatesRef.current = planRates
  }, [planRates])

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
  const { fields: planFields, replace: replacePlans, prepend: prependPlan, remove: removePlan } = useFieldArray({
    control: form.control,
    name: "payerPlans",
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
        payerPlans: [{ planName: "", insurancePlanTypeId: "" }],
      })
      if (countryId) setSelectedCountryId(countryId)
    }
  }, [payer, form])

  // Load existing plans + rates (supports legacy single plan fallback)
  useEffect(() => {
    if (!payer) return

    const normalizedPlans = payer.payerPlans?.length
      ? payer.payerPlans
      : payer.payerPlan
        ? [{ ...payer.payerPlan, payerRates: payer.payerRates ?? [] }]
        : []

    const formPlans = normalizedPlans.length
      ? normalizedPlans.map((plan) => ({
          planName: plan.planName || "",
          insurancePlanTypeId: plan.planTypeId || "",
        }))
      : [{ planName: "", insurancePlanTypeId: "" }]

    const ratesByIndex = normalizedPlans.map((plan) => {
      const embeddedRates = plan?.payerRates ?? []
      return embeddedRates.map((r) => ({
        _tempId: crypto.randomUUID(),
        id: r.id,
        billingCodeId: r.billingCodeId,
        billingCodeLabel: formatBillingCodeDisplay({
          type: r.billingCodeType || r.billingCodeTypeName || r.billingCodeTypeCode || "",
          code: r.billingCode ?? r.billingCodeId,
        }),
        billingModifier: r.billingModifier?.trim() || undefined,
        amount: r.amount,
        submitAmount: r.submitAmount ?? undefined,
        intervalType: r.intervalType,
        currencyId: r.currencyId,
        currencyLabel: r.currencyCode || r.currencyId,
        alias: r.alias,
        startDate: r.startDate ?? undefined,
        endDate: r.endDate ?? undefined,
      }))
    })

    replacePlans(formPlans)
    setApiPlansSnapshot(normalizedPlans)
    setApiRatesSnapshotByIndex(ratesByIndex)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payer, replacePlans])

  useEffect(() => {
    hasHydratedRatesFromApiRef.current = false
    hasUserMutatedRatesRef.current = false
  }, [payer?.id])

  useEffect(() => {
    if (planFields.length === 0) return

    if (apiPlansSnapshot.length > 0 && planFields.length === apiPlansSnapshot.length) {
      const shouldHydrateFromApi =
        !hasHydratedRatesFromApiRef.current ||
        (!hasUserMutatedRatesRef.current && planFields.every((field) => !(planRatesRef.current[field.id] ?? []).length))

      if (!shouldHydrateFromApi) {
        // continue with reconciliation branch below
      } else {
      const nextRates: Record<string, LocalInsurancePlanRate[]> = {}
      const nextPlanBackendIds: Record<string, string | undefined> = {}
      const nextErrors: Record<string, boolean> = {}

      planFields.forEach((field, idx) => {
        nextRates[field.id] = apiRatesSnapshotByIndex[idx] ?? []
        nextPlanBackendIds[field.id] = apiPlansSnapshot[idx]?.id
        nextErrors[field.id] = false
      })

      setPlanRates(nextRates)
      setPlanBackendIdByFieldId(nextPlanBackendIds)
      setRatesErrorByPlan(nextErrors)
      hasHydratedRatesFromApiRef.current = true
      return
      }
    }

    setPlanRates((prev) => {
      const next = { ...prev }
      const currentIds = new Set(planFields.map((field) => field.id))

      for (const field of planFields) {
        if (!next[field.id]) next[field.id] = []
      }

      for (const key of Object.keys(next)) {
        if (!currentIds.has(key)) delete next[key]
      }

      return next
    })

    setRatesErrorByPlan((prev) => {
      const next = { ...prev }
      const currentIds = new Set(planFields.map((field) => field.id))

      for (const field of planFields) {
        if (next[field.id] === undefined) next[field.id] = false
      }

      for (const key of Object.keys(next)) {
        if (!currentIds.has(key)) delete next[key]
      }

      return next
    })

    setPlanBackendIdByFieldId((prev) => {
      const next = { ...prev }
      const currentIds = new Set(planFields.map((field) => field.id))

      for (const field of planFields) {
        if (!(field.id in next)) next[field.id] = undefined
      }

      for (const key of Object.keys(next)) {
        if (!currentIds.has(key)) delete next[key]
      }

      return next
    })
  }, [apiPlansSnapshot, apiRatesSnapshotByIndex, planFields])

  // Rate handlers
  const activeRates = activeRatePlanId ? (planRates[activeRatePlanId] ?? []) : []
  const usedBillingCodeIds = activeRates.map((r) => r.billingCodeId)

  const handleAddRate = (planId: string) => { setActiveRatePlanId(planId); setEditingRate(null); setIsRateModalOpen(true) }
  const handleEditRate = (planId: string, entry: LocalInsurancePlanRate) => { setActiveRatePlanId(planId); setEditingRate(entry); setIsRateModalOpen(true) }
  const handleDeleteRate = async (planId: string, entry: LocalInsurancePlanRate) => {
    if (entry.id) {
      try {
        await deleteInsurancePlanRate(entry.id)
      } catch {
        toast.error("Failed to delete rate")
        return
      }
    }
    setPlanRates((prev) => ({
      ...prev,
      [planId]: (prev[planId] ?? []).filter((r) => r._tempId !== entry._tempId),
    }))
    hasUserMutatedRatesRef.current = true
  }
  const handleRateConfirm = (values: RateFormValues, billingCodeLabel: string, currencyLabel: string, billingModifier?: string) => {
    if (!activeRatePlanId) return

    if (editingRate) {
      setPlanRates((prev) => ({
        ...prev,
        [activeRatePlanId]: (prev[activeRatePlanId] ?? []).map((r) =>
          r._tempId === editingRate._tempId
            ? { ...r, ...values, billingCodeLabel, currencyLabel, billingModifier } as LocalInsurancePlanRate
            : r
        ),
      }))
    } else {
      setPlanRates((prev) => ({
        ...prev,
        [activeRatePlanId]: [
          ...(prev[activeRatePlanId] ?? []),
          {
            _tempId: crypto.randomUUID(),
            ...values,
            billingCodeLabel,
            currencyLabel,
            billingModifier,
          } as LocalInsurancePlanRate,
        ],
      }))
      setRatesErrorByPlan((prev) => ({ ...prev, [activeRatePlanId]: false }))
    }
    hasUserMutatedRatesRef.current = true
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
      const missingPlans = planFields.filter((field) => (planRates[field.id] ?? []).length === 0)
      if (missingPlans.length > 0) {
        setRatesErrorByPlan((prev) => {
          const next = { ...prev }
          for (const field of planFields) {
            next[field.id] = (planRates[field.id] ?? []).length === 0
          }
          return next
        })
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

      if (!payer) return

      const payerPlans = data.payerPlans
        .map((plan, index) => {
          const planId = planFields[index]?.id
          const ratesForPlan = planId ? (planRates[planId] ?? []) : []
          return {
            id:
              (planId ? planBackendIdByFieldId[planId] : undefined)
              ?? apiPlansSnapshot.find(
                (apiPlan) =>
                  apiPlan.planName?.trim() === plan.planName.trim()
                  && (apiPlan.planTypeId || "") === (plan.insurancePlanTypeId || "")
              )?.id,
            planName: plan.planName.trim(),
            planTypeId: plan.insurancePlanTypeId || "",
            comments: "",
            payerRates: ratesForPlan.map((r) => ({
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
          }
        })
        .filter((plan) => plan.planName)

      const saved = await update({
        id: payer.id,
        source: payer.source ?? "",
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
        ...(payerPlans.length > 0 && { payerPlans }),
      })

      if (!saved) return

      router.push(backPath)
    },
    (errors) => {
      scrollToFirstError(errors)
    },
  )

  const handleSubmitForm = (e: FormEvent) => {
    savePayer(e)
  }

  const handleAddPlan = () => {
    prependPlan({ planName: "", insurancePlanTypeId: "" })
  }

  const handleRemovePlan = (planIndex: number) => {
    if (planFields.length <= 1) return

    const removedPlanId = planFields[planIndex]?.id
    if (removedPlanId && activeRatePlanId === removedPlanId) {
      setIsRateModalOpen(false)
      setEditingRate(null)
      setActiveRatePlanId(null)
    }

    removePlan(planIndex)
    setApiPlansSnapshot((prev) => prev.filter((_, idx) => idx !== planIndex))
  }

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

        <form onSubmit={handleSubmitForm}>
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

          <div className="mt-4 space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddPlan}
                className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
              >
                New Plan
              </button>
            </div>
            {planFields.map((planField, planIndex) => (
              <Card key={planField.id} variant="elevated" padding="lg">
                <PlanSection
                  form={form}
                  planIndex={planIndex}
                  rates={planRates[planField.id] ?? []}
                  onAddRate={() => handleAddRate(planField.id)}
                  onEditRate={(entry) => handleEditRate(planField.id, entry)}
                  onDeleteRate={(entry) => void handleDeleteRate(planField.id, entry)}
                  onRemovePlan={() => handleRemovePlan(planIndex)}
                  canRemovePlan={planFields.length > 1}
                  planTypes={planTypes}
                  isLoadingPlanTypes={isLoadingPlanTypes}
                  defaultExpanded
                  ratesSectionRef={planIndex === 0 ? ratesSectionRef : undefined}
                  ratesError={ratesErrorByPlan[planField.id] ?? false}
                />
              </Card>
            ))}
          </div>

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
          planLabel={activeRatePlanId ? `Plan ${planFields.findIndex((p) => p.id === activeRatePlanId) + 1}` : undefined}
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
