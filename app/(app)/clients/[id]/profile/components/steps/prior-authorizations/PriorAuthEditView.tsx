"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/custom/Card"
import { Button } from "@/components/custom/Button"
import { DeleteConfirmModal } from "@/components/custom/DeleteConfirmModal"
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
  PriorAuthorization,
  UpdatePriorAuthorizationDto,
} from "@/lib/types/prior-authorization.types"
import type { BillingCodeListItem } from "@/lib/types/billing-code.types"
import type { ClientInsurance } from "@/lib/types/client-insurance.types"
import { useUpdatePriorAuthorization } from "@/lib/modules/prior-authorizations/hooks/use-update-prior-authorization"
import { useDeleteAuthorizationBillingCode } from "@/lib/modules/authorization-billing-codes/hooks/use-delete-authorization-billing-code"
import { getPriorAuthorizationById } from "@/lib/modules/prior-authorizations/services/prior-authorizations-api.service"
import { getBillingCodes } from "@/lib/modules/billing-codes/services/billing-codes.service"

interface PriorAuthEditViewProps {
  clientId: string
  editingPA: PriorAuthorization
  insurances: ClientInsurance[]
  onBack: () => void
  onSaved: () => Promise<void>
}

export function PriorAuthEditView({
  clientId,
  editingPA,
  insurances,
  onBack,
  onSaved,
}: PriorAuthEditViewProps) {
  const form = useForm<PriorAuthFormValues>({
    resolver: zodResolver(priorAuthFormSchema),
    defaultValues: priorAuthFormDefaults,
    mode: "onBlur",
  })

  const { update, isLoading: isUpdating } = useUpdatePriorAuthorization()
  const { remove, isLoading: isDeletingBillingCode } = useDeleteAuthorizationBillingCode()

  // PA data loaded from backend (fresh fetch for attachment URLs etc.)
  const [pa, setPa] = useState<PriorAuthorization | null>(null)
  const [isLoadingPA, setIsLoadingPA] = useState(true)

  // Existing attachment URLs from the loaded PA
  const [existingAttachmentUrl, setExistingAttachmentUrl] = useState<string | null>(null)
  const [existingAttachmentDownloadUrl, setExistingAttachmentDownloadUrl] = useState<string | null>(null)

  // In-memory billing codes
  const [billingCodes, setBillingCodes] = useState<LocalBillingCodeEntry[]>([])

  // BC modal state
  const [isBCModalOpen, setIsBCModalOpen] = useState(false)
  const [editingBC, setEditingBC] = useState<LocalBillingCodeEntry | null>(null)
  const [deletingBC, setDeletingBC] = useState<LocalBillingCodeEntry | null>(null)

  // Billing code catalog
  const [catalogBillingCodes, setCatalogBillingCodes] = useState<BillingCodeListItem[]>([])
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false)

  // Fetch PA data on mount
  useEffect(() => {
    let cancelled = false
    setIsLoadingPA(true)

    getPriorAuthorizationById(editingPA.id)
      .then((data) => {
        if (cancelled) return
        setPa(data)

        // Reset form with loaded PA fields
        form.reset({
          authNumber: data.authNumber,
          insuranceId: data.insuranceId,
          primaryDiagnosisId: data.primaryDiagnosisId ?? "",
          startDate: data.startDate,
          endDate: data.endDate,
          durationInterval: data.durationInterval,
          requestDate: data.requestDate ?? "",
          responseDate: data.responseDate ?? "",
          comments: data.comments ?? "",
          attachment: "",
          attachmentName: data.attachmentName ?? "",
        })

        // Set existing attachment URLs
        setExistingAttachmentUrl(data.attachment ?? null)
        setExistingAttachmentDownloadUrl(data.attachmentDownload ?? null)

        // Map backend billing codes to local entries
        const localBCs: LocalBillingCodeEntry[] = data.billingCodes.map((bc) => ({
          _tempId: crypto.randomUUID(),
          id: bc.id,
          billingCodeId: bc.billingCodeId,
          billingCodeLabel: bc.billingCodeLabel,
          approvedUnits: bc.approvedUnits,
          usedUnits: bc.usedUnits,
          remainingUnits: bc.remainingUnits,
          unitsInterval: bc.unitsInterval,
          maxUnitsPerDay: bc.maxUnitsPerDay ?? null,
          maxUnitsPerWeek: bc.maxUnitsPerWeek ?? null,
          maxUnitsPerMonth: bc.maxUnitsPerMonth ?? null,
          maxCountPerDay: bc.maxCountPerDay ?? null,
          maxCountPerWeek: bc.maxCountPerWeek ?? null,
          maxCountPerMonth: bc.maxCountPerMonth ?? null,
        }))
        setBillingCodes(localBCs)
      })
      .catch(() => {
        toast.error("Failed to load prior authorization")
        onBack()
      })
      .finally(() => {
        if (!cancelled) setIsLoadingPA(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingPA.id])

  // Fetch billing code catalog
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

  // Computed: already-used billing code IDs
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
    if (entry.id) {
      setDeletingBC(entry)
      return
    }

    setBillingCodes((prev) => prev.filter((bc) => bc._tempId !== entry._tempId))
  }

  const handleBCModalConfirm = (values: BillingCodeEntryValues, label: string) => {
    if (editingBC) {
      // Update existing entry — KEEP the backend `id` if present
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
      // Add new entry (no backend id)
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

  const handleClearExistingAttachment = () => {
    setExistingAttachmentUrl(null)
    setExistingAttachmentDownloadUrl(null)
  }

  // ── Save ────────────────────────────────────────────────────────
  const handleSave = form.handleSubmit(async (values) => {
    if (billingCodes.length === 0) {
      toast.error("At least one billing code is required")
      return
    }

    const dto: UpdatePriorAuthorizationDto = {
      id: editingPA.id,
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
        ...(bc.id ? { id: bc.id } : {}),
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

    const result = await update(dto)
    if (result) {
      await onSaved()
      onBack()
    }
  })

  // ── Loading skeleton ────────────────────────────────────────────
  if (isLoadingPA) {
    return (
      <>
        <div className="mb-6 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-slate-100 animate-pulse" />
          <div className="space-y-2">
            <div className="h-7 w-56 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-36 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
        <Card variant="elevated" padding="lg">
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-[52px] animate-pulse rounded-[16px] bg-gray-100" />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-[52px] animate-pulse rounded-[16px] bg-gray-100" />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-[52px] animate-pulse rounded-[16px] bg-gray-100" />
              ))}
            </div>
            <div className="border-t border-slate-200" />
            <div className="h-32 animate-pulse rounded-xl bg-gray-100" />
          </div>
        </Card>
      </>
    )
  }

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
          <h2 className="text-2xl font-bold text-slate-800">
            Edit Prior Authorization
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">{pa?.authNumber ?? editingPA.authNumber}</p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <Card variant="elevated" padding="lg">
          <div className="space-y-8">
            <PriorAuthBaseForm
              form={form}
              insurances={insurances}
              clientId={clientId}
              existingAttachmentUrl={existingAttachmentUrl}
              existingAttachmentDownloadUrl={existingAttachmentDownloadUrl}
              onClearExistingAttachment={handleClearExistingAttachment}
              editingInsuranceId={pa?.insuranceId}
              editingInsuranceName={pa?.insuranceName}
            />

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
          <Button type="button" variant="secondary" onClick={onBack} disabled={isUpdating}>
            Cancel
          </Button>
          <Button type="submit" loading={isUpdating} disabled={isUpdating}>
            Update Authorization
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

      <DeleteConfirmModal
        isOpen={!!deletingBC}
        onClose={() => setDeletingBC(null)}
        onConfirm={async () => {
          const target = deletingBC
          if (!target?.id) return

          const deleted = await remove(target.id)
          if (!deleted) return

          setBillingCodes((prev) => prev.filter((bc) => bc._tempId !== target._tempId))
          setDeletingBC(null)
        }}
        title="Delete Billing Code"
        message="Are you sure you want to delete this billing code from the authorization? This action cannot be undone."
        itemName={deletingBC?.billingCodeLabel}
        isDeleting={isDeletingBillingCode}
      />
    </>
  )
}
