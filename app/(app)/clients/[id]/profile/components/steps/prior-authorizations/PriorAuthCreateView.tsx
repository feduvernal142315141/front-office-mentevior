"use client"

import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/custom/Card"
import { PriorAuthBaseForm, type PriorAuthBaseFormRefs } from "./PriorAuthBaseForm"
import { useFocusFirstError } from "@/lib/hooks/use-focus-first-error"
import { BillingCodesSection } from "./BillingCodesSection"
import { BillingCodeModal } from "./BillingCodeModal"
import {
  priorAuthFormSchema,
  priorAuthFormDefaults,
  type PriorAuthFormValues,
  type BillingCodeEntryValues,
} from "@/lib/schemas/prior-authorization-form.schema"
import type {
  LocalBillingCodeEntry,
  CreatePriorAuthorizationDto,
} from "@/lib/types/prior-authorization.types"
import type { BillingCodeListItem } from "@/lib/types/billing-code.types"
import type { ClientInsurance } from "@/lib/types/client-insurance.types"
import { useCreatePriorAuthorization } from "@/lib/modules/prior-authorizations/hooks/use-create-prior-authorization"
import { getBillingCodes } from "@/lib/modules/billing-codes/services/billing-codes.service"

interface PriorAuthCreateViewProps {
  clientId: string
  insurances: ClientInsurance[]
  onBack: () => void
  onSaved: () => Promise<void>
  onProgressUpdate?: (progress: number) => void
  onRegisterSubmit?: (fn: () => void) => void
  onDirtyChange?: (isDirty: boolean) => void
  onPrimaryActionLabelChange?: (label: string | undefined) => void
}

export function PriorAuthCreateView({
  clientId,
  insurances,
  onBack,
  onSaved,
  onProgressUpdate,
  onRegisterSubmit,
  onDirtyChange,
  onPrimaryActionLabelChange,
}: PriorAuthCreateViewProps) {
  const form = useForm<PriorAuthFormValues>({
    resolver: zodResolver(priorAuthFormSchema),
    defaultValues: priorAuthFormDefaults,
    mode: "onChange",
  })

  const { formState: { errors, submitCount } } = form
  const { create, isLoading: isCreating } = useCreatePriorAuthorization()

  const fieldRefs: PriorAuthBaseFormRefs = {
    authNumber:       useRef<HTMLInputElement>(null),
    insuranceId:      useRef<HTMLButtonElement>(null),
    startDate:        useRef<HTMLButtonElement>(null),
    endDate:          useRef<HTMLButtonElement>(null),
    durationInterval: useRef<HTMLButtonElement>(null),
  }

  useFocusFirstError(errors, submitCount, [
    { key: "authNumber",       ref: fieldRefs.authNumber },
    { key: "insuranceId",      ref: fieldRefs.insuranceId },
    { key: "startDate",        ref: fieldRefs.startDate },
    { key: "endDate",          ref: fieldRefs.endDate },
    { key: "durationInterval", ref: fieldRefs.durationInterval },
  ])

  // In-memory billing codes
  const [billingCodes, setBillingCodes] = useState<LocalBillingCodeEntry[]>([])
  const [billingCodesError, setBillingCodesError] = useState(false)

  // BC modal state
  const [isBCModalOpen, setIsBCModalOpen] = useState(false)
  const [editingBC, setEditingBC] = useState<LocalBillingCodeEntry | null>(null)

  // Billing code catalog
  const [catalogBillingCodes, setCatalogBillingCodes] = useState<BillingCodeListItem[]>([])
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false)

  useEffect(() => {
    onPrimaryActionLabelChange?.("Create Authorization")
    onRegisterSubmit?.(() => handleSubmitForm({ preventDefault: () => {} } as React.FormEvent))
    return () => {
      onDirtyChange?.(false)
      onPrimaryActionLabelChange?.(undefined)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { isDirty } = form.formState
  useEffect(() => {
    onDirtyChange?.(isDirty || billingCodes.length > 0)
  }, [isDirty, billingCodes.length, onDirtyChange])

  useEffect(() => {
    let cancelled = false
    setIsLoadingCatalog(true)
    getBillingCodes({ page: 0, pageSize: 100 })
      .then(({ billingCodes: codes }) => {
        if (!cancelled) setCatalogBillingCodes(codes)
      })
      .catch(() => {
        /* catalog fetch failed — modal will show empty state */
      })
      .finally(() => {
        if (!cancelled) setIsLoadingCatalog(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Computed: already-used billing code IDs (to prevent duplicates in the modal)
  const usedBillingCodeIds = billingCodes.map((bc) => bc.billingCodeId)

  // ── BC modal callbacks ──────────────────────────────────────────
  const handleAddBillingCode = () => {
    setEditingBC(null)
    setIsBCModalOpen(true)
  }

  const handleEditBillingCode = (entry: LocalBillingCodeEntry) => {
    setEditingBC(entry)
    setIsBCModalOpen(true)
  }

  const handleDeleteBillingCode = (entry: LocalBillingCodeEntry) => {
    setBillingCodes((prev) => prev.filter((bc) => bc._tempId !== entry._tempId))
  }

  const handleBCModalConfirm = (values: BillingCodeEntryValues, label: string) => {
    if (editingBC) {
      // Update existing entry by _tempId
      setBillingCodes((prev) =>
        prev.map((bc) =>
          bc._tempId === editingBC._tempId
            ? {
                ...bc,
                billingCodeId: values.billingCodeId,
                billingCodeLabel: label,
                approvedUnits: values.approvedUnits,
                usedUnits: values.usedUnits,
                remainingUnits: values.approvedUnits - values.usedUnits,
                unitsInterval: values.unitsInterval,
                maxUnitsPerDay: values.maxUnitsPerDay ?? null,
                maxUnitsPerWeek: values.maxUnitsPerWeek ?? null,
                maxUnitsPerMonth: values.maxUnitsPerMonth ?? null,
                maxCountPerDay: values.maxCountPerDay ?? null,
                maxCountPerWeek: values.maxCountPerWeek ?? null,
                maxCountPerMonth: values.maxCountPerMonth ?? null,
              }
            : bc,
        ),
      )
    } else {
      // Add new entry
      const newEntry: LocalBillingCodeEntry = {
        _tempId: crypto.randomUUID(),
        billingCodeId: values.billingCodeId,
        billingCodeLabel: label,
        approvedUnits: values.approvedUnits,
        usedUnits: values.usedUnits,
        remainingUnits: values.approvedUnits - values.usedUnits,
        unitsInterval: values.unitsInterval,
        maxUnitsPerDay: values.maxUnitsPerDay ?? null,
        maxUnitsPerWeek: values.maxUnitsPerWeek ?? null,
        maxUnitsPerMonth: values.maxUnitsPerMonth ?? null,
        maxCountPerDay: values.maxCountPerDay ?? null,
        maxCountPerWeek: values.maxCountPerWeek ?? null,
        maxCountPerMonth: values.maxCountPerMonth ?? null,
      }
      setBillingCodes((prev) => [...prev, newEntry])
      setBillingCodesError(false)
    }

    setIsBCModalOpen(false)
    setEditingBC(null)
  }

  // ── Save ────────────────────────────────────────────────────────
  const handleSubmitForm = (e: React.FormEvent) => {
    if (billingCodes.length === 0) setBillingCodesError(true)
    else setBillingCodesError(false)
    handleSave(e)
  }

  const handleSave = form.handleSubmit(async (values) => {
    if (billingCodes.length === 0) {
      return
    }

    const dto: CreatePriorAuthorizationDto = {
      clientId,
      insuranceId: values.insuranceId,
      primaryDiagnosisId: values.primaryDiagnosisId || null,
      authNumber: values.authNumber,
      startDate: values.startDate,
      endDate: values.endDate,
      durationInterval: values.durationInterval,
      requestDate: values.requestDate || null,
      responseDate: values.responseDate || null,
      comments: values.comments || null,
      attachment: values.attachment || null,
      attachmentName: values.attachmentName || null,
      authorizationBillingCodes: billingCodes.map((bc) => ({
        billingCodeId: bc.billingCodeId,
        approvedUnits: bc.approvedUnits,
        usedUnits: bc.usedUnits,
        unitsInterval: bc.unitsInterval,
        maxUnitsPerDay: bc.maxUnitsPerDay ?? null,
        maxUnitsPerWeek: bc.maxUnitsPerWeek ?? null,
        maxUnitsPerMonth: bc.maxUnitsPerMonth ?? null,
        maxCountPerDay: bc.maxCountPerDay ?? null,
        maxCountPerWeek: bc.maxCountPerWeek ?? null,
        maxCountPerMonth: bc.maxCountPerMonth ?? null,
      })),
    }

    const result = await create(dto)
    if (result) {
      if (typeof result.progress === "number") {
        onProgressUpdate?.(result.progress)
      }
      await onSaved()
      onBack()
    }
  })

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">New Prior Authorization</h2>
          <p className="text-sm text-slate-500 mt-0.5">Create a new authorization for this client</p>
        </div>
      </div>

      <form onSubmit={handleSubmitForm}>
        <Card variant="elevated" padding="lg">
          <div className="space-y-8">
            <PriorAuthBaseForm form={form} insurances={insurances} clientId={clientId} fieldRefs={fieldRefs} />

            {/* Divider */}
            <div className="border-t border-slate-200" />

            {/* Billing Codes Section */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-slate-800">
                Authorization Billing Codes <span className="text-[#037ECC]">*</span>
              </h3>
              <BillingCodesSection
                entries={billingCodes}
                onAdd={handleAddBillingCode}
                onEdit={handleEditBillingCode}
                onDelete={handleDeleteBillingCode}
                hasError={billingCodesError}
              />
            </div>
          </div>
        </Card>

      </form>

      <BillingCodeModal
        open={isBCModalOpen}
        onClose={() => {
          setIsBCModalOpen(false)
          setEditingBC(null)
        }}
        onConfirm={handleBCModalConfirm}
        editingCode={editingBC}
        billingCodes={catalogBillingCodes}
        usedBillingCodeIds={usedBillingCodeIds}
        isLoadingCatalog={isLoadingCatalog}
      />
    </>
  )
}
