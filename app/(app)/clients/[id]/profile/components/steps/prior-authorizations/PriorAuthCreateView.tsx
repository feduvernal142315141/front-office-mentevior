"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/custom/Card"
import { Button } from "@/components/custom/Button"
import { PriorAuthBaseForm } from "./PriorAuthBaseForm"
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
}

export function PriorAuthCreateView({
  clientId,
  insurances,
  onBack,
  onSaved,
}: PriorAuthCreateViewProps) {
  const form = useForm<PriorAuthFormValues>({
    resolver: zodResolver(priorAuthFormSchema),
    defaultValues: priorAuthFormDefaults,
    mode: "onBlur",
  })

  const { create, isLoading: isCreating } = useCreatePriorAuthorization()

  // In-memory billing codes
  const [billingCodes, setBillingCodes] = useState<LocalBillingCodeEntry[]>([])

  // BC modal state
  const [isBCModalOpen, setIsBCModalOpen] = useState(false)
  const [editingBC, setEditingBC] = useState<LocalBillingCodeEntry | null>(null)

  // Billing code catalog
  const [catalogBillingCodes, setCatalogBillingCodes] = useState<BillingCodeListItem[]>([])
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false)

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
    }

    setIsBCModalOpen(false)
    setEditingBC(null)
  }

  // ── Save ────────────────────────────────────────────────────────
  const handleSave = form.handleSubmit(async (values) => {
    if (billingCodes.length === 0) {
      toast.error("At least one billing code is required")
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

      <form onSubmit={handleSave}>
        <Card variant="elevated" padding="lg">
          <div className="space-y-8">
            <PriorAuthBaseForm form={form} insurances={insurances} clientId={clientId} />

            {/* Divider */}
            <div className="border-t border-slate-200" />

            {/* Billing Codes Section */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-slate-800">
                Authorization Billing Codes
              </h3>
              <BillingCodesSection
                entries={billingCodes}
                onAdd={handleAddBillingCode}
                onEdit={handleEditBillingCode}
                onDelete={handleDeleteBillingCode}
              />
            </div>
          </div>
        </Card>

        {/* Inline footer buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200 mt-6">
          <Button type="button" variant="secondary" onClick={onBack} disabled={isCreating}>
            Cancel
          </Button>
          <Button type="submit" loading={isCreating} disabled={isCreating}>
            Create Authorization
          </Button>
        </div>
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
