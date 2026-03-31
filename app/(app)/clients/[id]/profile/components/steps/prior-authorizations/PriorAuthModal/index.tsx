"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CustomModal } from "@/components/custom/CustomModal"
import { Button } from "@/components/custom/Button"
import { TabGeneral } from "./TabGeneral"
import { TabAuthorizations } from "./TabAuthorizations"
import { TabFiles } from "./TabFiles"
import {
  priorAuthFormDefaults,
  priorAuthFormSchema,
  type PriorAuthFormValues,
} from "@/lib/schemas/prior-authorization-form.schema"
import type {
  PriorAuthorization,
  PriorAuthBillingCode,
  PriorAuthFile,
  CreatePriorAuthorizationDto,
  UpdatePriorAuthorizationDto,
} from "@/lib/types/prior-authorization.types"
import type { ClientInsurance } from "@/lib/types/client-insurance.types"
import type { BillingCodeListItem } from "@/lib/types/billing-code.types"
import { calculatePAStatus, getPAStatusBadgeClasses } from "@/lib/utils/prior-auth-utils"
import { useCreatePriorAuthorization } from "@/lib/modules/prior-authorizations/hooks/use-create-prior-authorization"
import { useUpdatePriorAuthorization } from "@/lib/modules/prior-authorizations/hooks/use-update-prior-authorization"
import { cn } from "@/lib/utils"

type ModalTab = "general" | "authorizations" | "files"

interface PriorAuthModalProps {
  open: boolean
  onClose: () => void
  /** null = create mode, PA object = edit mode */
  editingPA: PriorAuthorization | null
  clientId: string
  /** Active insurances for the client */
  insurances: ClientInsurance[]
  /** Company billing codes for the billing code sub-modal */
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
  const [billingCodes, setBillingCodes] = useState<PriorAuthBillingCode[]>([])
  const [files, setFiles] = useState<PriorAuthFile[]>([])

  const { create, isLoading: isCreating } = useCreatePriorAuthorization()
  const { update, isLoading: isUpdating } = useUpdatePriorAuthorization()

  const form = useForm<PriorAuthFormValues>({
    resolver: zodResolver(priorAuthFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: priorAuthFormDefaults,
  })

  // Populate form when editing
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
      })
      setBillingCodes(editingPA.billingCodes)
      setFiles(editingPA.files)
    } else {
      form.reset(priorAuthFormDefaults)
      setBillingCodes([])
      setFiles([])
    }

    setActiveTab("general")
  }, [open, editingPA, form])

  const handleClose = () => {
    form.reset(priorAuthFormDefaults)
    setBillingCodes([])
    setFiles([])
    setActiveTab("general")
    onClose()
  }

  const handleSave = form.handleSubmit(async (values) => {
    const dto: CreatePriorAuthorizationDto = {
      clientId,
      authNumber: values.authNumber,
      insuranceId: values.insuranceId,
      primaryDiagnosisId: values.primaryDiagnosisId || null,
      startDate: values.startDate,
      endDate: values.endDate,
      durationInterval: values.durationInterval,
      requestDate: values.requestDate || null,
      responseDate: values.responseDate || null,
      comments: values.comments || null,
      billingCodes: billingCodes.map((bc) => ({
        billingCodeId: bc.billingCodeId,
        approvedUnits: bc.approvedUnits,
        usedUnits: bc.usedUnits,
        unitsInterval: bc.unitsInterval,
        maxUnitsPerDay: bc.maxUnitsPerDay,
        maxUnitsPerWeek: bc.maxUnitsPerWeek,
        maxUnitsPerMonth: bc.maxUnitsPerMonth,
        maxCountPerDay: bc.maxCountPerDay,
        maxCountPerWeek: bc.maxCountPerWeek,
        maxCountPerMonth: bc.maxCountPerMonth,
      })),
      files: files.map((f) => ({
        name: f.name,
        url: f.url,
        size: f.size,
        uploadedAt: f.uploadedAt,
      })),
    }

    let result: PriorAuthorization | null = null

    if (isEditMode && editingPA) {
      result = await update({ ...dto, id: editingPA.id } as UpdatePriorAuthorizationDto)
    } else {
      result = await create(dto)
    }

    if (!result) return

    await onSaved()
    handleClose()
  })

  // Status badge for edit mode header
  const editingStatus =
    editingPA ? calculatePAStatus(editingPA.startDate, editingPA.endDate) : null

  const tabs: { id: ModalTab; label: string }[] = [
    { id: "general", label: "General" },
    { id: "authorizations", label: "Authorizations" },
    { id: "files", label: "Files" },
  ]

  return (
    <CustomModal
      open={open}
      onOpenChange={(o) => { if (!o) handleClose() }}
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
        {/* Status badge in edit mode */}
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

        {/* Tabs */}
        <div className="px-6 pt-4 border-b border-slate-200">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all duration-150",
                  activeTab === tab.id
                    ? "text-[#037ECC] border-b-2 border-[#037ECC] bg-[#037ECC]/5"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                {tab.label}
                {tab.id === "authorizations" && billingCodes.length > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-bold bg-[#037ECC] text-white">
                    {billingCodes.length}
                  </span>
                )}
                {tab.id === "files" && files.length > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-bold bg-slate-500 text-white">
                    {files.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <form
          onSubmit={(e) => { e.preventDefault(); void handleSave() }}
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
                isEditMode={isEditMode}
              />
            )}

            {activeTab === "authorizations" && (
              <TabAuthorizations
                billingCodes={billingCodes}
                onChange={setBillingCodes}
                availableBillingCodes={availableBillingCodes}
                paId={editingPA?.id}
                onViewLinkedEvents={
                  onViewLinkedEvents && editingPA
                    ? (code) => onViewLinkedEvents(editingPA, code)
                    : undefined
                }
              />
            )}

            {activeTab === "files" && (
              <TabFiles files={files} onChange={setFiles} />
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end px-6 pb-5 border-t border-slate-200 pt-4">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={isCreating || isUpdating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isCreating || isUpdating}
                disabled={isCreating || isUpdating}
              >
                {isEditMode ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </CustomModal>
  )
}
