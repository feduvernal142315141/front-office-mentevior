"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CustomModal } from "@/components/custom/CustomModal"
import { Button } from "@/components/custom/Button"
import { TabGeneral } from "./TabGeneral"
import { TabAuthorizations } from "./TabAuthorizations"
import {
  priorAuthFormDefaults,
  priorAuthFormSchema,
  type PriorAuthFormValues,
} from "@/lib/schemas/prior-authorization-form.schema"
import type {
  PriorAuthorization,
  PriorAuthBillingCode,
  CreatePriorAuthorizationDto,
  UpdatePriorAuthorizationDto,
} from "@/lib/types/prior-authorization.types"
import type { ClientInsurance } from "@/lib/types/client-insurance.types"
import type { BillingCodeListItem } from "@/lib/types/billing-code.types"
import { calculatePAStatus, getPAStatusBadgeClasses } from "@/lib/utils/prior-auth-utils"
import { useCreatePriorAuthorization } from "@/lib/modules/prior-authorizations/hooks/use-create-prior-authorization"
import { useUpdatePriorAuthorization } from "@/lib/modules/prior-authorizations/hooks/use-update-prior-authorization"
import { cn } from "@/lib/utils"

type ModalTab = "general" | "authorizations"

interface PriorAuthModalProps {
  open: boolean
  onClose: () => void
  editingPA: PriorAuthorization | null
  clientId: string
  insurances: ClientInsurance[]
  availableBillingCodes: BillingCodeListItem[]
  onSaved: () => Promise<void>
  onViewLinkedEvents?: (pa: PriorAuthorization, code: PriorAuthBillingCode) => void
}

export function PriorAuthModal({
  open,
  onClose,
  editingPA,
  clientId,
  insurances,
  availableBillingCodes,
  onSaved,
  onViewLinkedEvents,
}: PriorAuthModalProps) {
  const isEditMode = editingPA !== null

  const [activeTab, setActiveTab] = useState<ModalTab>("general")
  const [createdPaId, setCreatedPaId] = useState<string | undefined>(undefined)

  const { create, isLoading: isCreating } = useCreatePriorAuthorization()
  const { update, isLoading: isUpdating } = useUpdatePriorAuthorization()

  const form = useForm<PriorAuthFormValues>({
    resolver: zodResolver(priorAuthFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: priorAuthFormDefaults,
  })

  useEffect(() => {
    if (!open) return

    if (editingPA) {
      form.reset({
        authNumber: editingPA.authNumber,
        insuranceId: editingPA.insuranceId,
        primaryDiagnosisId: editingPA.primaryDiagnosisId ?? "",
        startDate: editingPA.startDate,
        endDate: editingPA.endDate,
        durationInterval: editingPA.durationInterval,
        requestDate: editingPA.requestDate ?? "",
        responseDate: editingPA.responseDate ?? "",
        comments: editingPA.comments ?? "",
        attachment: editingPA.attachment ?? "",
        attachmentName: editingPA.attachmentName ?? "",
      })
    } else {
      form.reset(priorAuthFormDefaults)
      setCreatedPaId(undefined)
    }

    setActiveTab("general")
  }, [open, editingPA, form])

  const handleClose = async () => {
    form.reset(priorAuthFormDefaults)
    setCreatedPaId(undefined)
    setActiveTab("general")
    if (createdPaId || isEditMode) await onSaved()
    onClose()
  }

  const handleSaveGeneral = form.handleSubmit(async (values) => {
    if (isEditMode && editingPA) {
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
      }
      const result = await update(dto)
      if (!result) return
      await onSaved()
      onClose()
    } else {
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
      }
      const result = await create(dto)
      if (!result) return
      setCreatedPaId(result.id)
      setActiveTab("authorizations")
    }
  })

  const editingStatus =
    editingPA ? calculatePAStatus(editingPA.startDate, editingPA.endDate) : null

  const activePaId = isEditMode ? editingPA?.id : createdPaId
  const authorizationsTabEnabled = isEditMode || !!createdPaId

  const tabs: { id: ModalTab; label: string }[] = [
    { id: "general", label: "General" },
    { id: "authorizations", label: "Authorizations" },
  ]

  return (
    <CustomModal
      open={open}
      onOpenChange={(o) => { if (!o) void handleClose() }}
      title={
        isEditMode
          ? `Edit PA — ${editingPA?.authNumber}`
          : "New prior authorization"
      }
      description={
        isEditMode
          ? `${editingPA?.insuranceName} · ${editingPA?.memberInsuranceId}`
          : "Create a new prior authorization for this client"
      }
      maxWidthClassName="sm:max-w-[820px]"
    >
      <div>
        {isEditMode && editingStatus && (
          <div className="px-6 pt-4 pb-0 flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Status:</span>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                getPAStatusBadgeClasses(editingStatus)
              )}
            >
              {editingStatus}
            </span>
          </div>
        )}

        <div className="px-6 pt-4 border-b border-slate-200">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const isDisabled = tab.id === "authorizations" && !authorizationsTabEnabled
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => { if (!isDisabled) setActiveTab(tab.id) }}
                  disabled={isDisabled}
                  className={cn(
                    "px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all duration-150",
                    activeTab === tab.id
                      ? "text-[#037ECC] border-b-2 border-[#037ECC] bg-[#037ECC]/5"
                      : isDisabled
                      ? "text-slate-300 cursor-not-allowed"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); void handleSaveGeneral() }}
          noValidate
        >
          <div className="px-6 py-5">
            {activeTab === "general" && (
              <TabGeneral
                control={form.control}
                errors={form.formState.errors}
                watch={(field) => form.watch(field) as string}
                setValue={(field, value) => form.setValue(field, value)}
                insurances={insurances}
                clientId={clientId}
              />
            )}

            {activeTab === "authorizations" && (
              <TabAuthorizations
                availableBillingCodes={availableBillingCodes}
                paId={activePaId}
                onViewLinkedEvents={
                  onViewLinkedEvents && editingPA
                    ? (code) => onViewLinkedEvents(editingPA, code)
                    : undefined
                }
              />
            )}
          </div>

          <div className="flex items-center justify-end px-6 pb-5 border-t border-slate-200 pt-4">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleClose()}
                disabled={isCreating || isUpdating}
              >
                {createdPaId && !isEditMode ? "Close" : "Cancel"}
              </Button>
              {activeTab === "general" && (
                <Button
                  type="submit"
                  loading={isCreating || isUpdating}
                  disabled={isCreating || isUpdating}
                >
                  {isEditMode ? "Update" : "Create"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </CustomModal>
  )
}
