"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, X } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CustomModal } from "@/components/custom/CustomModal"
import { Button } from "@/components/custom/Button"
import { TabGeneral } from "./TabGeneral"
import { TabAuthorizations, type TabAuthorizationsHandle } from "./TabAuthorizations"
import { BillingCodeModal } from "../BillingCodeModal"
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
import { useAvailableBillingCodesForAuth } from "@/lib/modules/billing-codes/hooks/use-available-billing-codes-for-auth"
import { calculatePAStatus, getPAStatusBadgeClasses } from "@/lib/utils/prior-auth-utils"
import { useCreatePriorAuthorization } from "@/lib/modules/prior-authorizations/hooks/use-create-prior-authorization"
import { useUpdatePriorAuthorization } from "@/lib/modules/prior-authorizations/hooks/use-update-prior-authorization"
import { getPriorAuthorizationById } from "@/lib/modules/prior-authorizations/services/prior-authorizations-api.service"
import { cn } from "@/lib/utils"

type ModalTab = "general" | "authorizations"

interface PriorAuthModalProps {
  open: boolean
  onClose: () => void
  editingPA: PriorAuthorization | null
  clientId: string
  insurances: ClientInsurance[]
  onSaved: () => Promise<void>
  onRefresh?: () => Promise<void>
  onViewLinkedEvents?: (pa: PriorAuthorization, code: PriorAuthBillingCode) => void
}

export function PriorAuthModal({
  open,
  onClose,
  editingPA,
  clientId,
  onRefresh,
  insurances,
  onSaved,
  onViewLinkedEvents,
}: PriorAuthModalProps) {
  const isEditMode = editingPA !== null

  const [activeTab, setActiveTab] = useState<ModalTab>("general")
  const [createdPaId, setCreatedPaId] = useState<string | undefined>(undefined)
  const [isFetchingPA, setIsFetchingPA] = useState(false)
  const [existingAttachmentUrl, setExistingAttachmentUrl] = useState<string | null>(null)
  const [isBCModalOpen, setIsBCModalOpen] = useState(false)
  const [bcEditingCode, setBcEditingCode] = useState<PriorAuthBillingCode | null>(null)
  const tabAuthRef = useRef<TabAuthorizationsHandle>(null)

  const activePaId = isEditMode ? editingPA?.id : createdPaId
  const {
    billingCodes: availableBillingCodes,
    isLoading: isLoadingAvailableBillingCodes,
    refetch: refetchAvailableBillingCodes,
  } = useAvailableBillingCodesForAuth(activePaId ?? undefined, { autoFetch: false })


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
      setActiveTab("general")
      setExistingAttachmentUrl(null)
      setIsFetchingPA(true)
      getPriorAuthorizationById(editingPA.id)
        .then((fresh) => {
          const isUrl = fresh.attachment?.startsWith("http://") || fresh.attachment?.startsWith("https://")
          setExistingAttachmentUrl(isUrl ? (fresh.attachment ?? null) : null)
          form.reset({
            authNumber: fresh.authNumber,
            insuranceId: fresh.insuranceId,
            primaryDiagnosisId: fresh.primaryDiagnosisId ?? "",
            startDate: fresh.startDate,
            endDate: fresh.endDate,
            durationInterval: fresh.durationInterval,
            requestDate: fresh.requestDate ?? "",
            responseDate: fresh.responseDate ?? "",
            comments: fresh.comments ?? "",
            // solo base64 nuevo va en el form; URL existente va en existingAttachmentUrl
            attachment: isUrl ? "" : (fresh.attachment ?? ""),
            attachmentName: fresh.attachmentName ?? "",
          })
        })
        .catch(() => {
          // fallback a los datos en memoria
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
            attachment: "",
            attachmentName: editingPA.attachmentName ?? "",
          })
          setExistingAttachmentUrl(null)
        })
        .finally(() => setIsFetchingPA(false))
    } else {
      form.reset(priorAuthFormDefaults)
      setCreatedPaId(undefined)
      setExistingAttachmentUrl(null)
      setActiveTab("general")
    }
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
      await onRefresh?.()
    }
  })

  const editingStatus =
    editingPA ? calculatePAStatus(editingPA.startDate, editingPA.endDate) : null

  const authorizationsTabEnabled = isEditMode || !!createdPaId

  const tabs: { id: ModalTab; label: string }[] = [
    { id: "general", label: "General" },
    { id: "authorizations", label: "Authorizations" },
  ]

  return (
    <>
    <CustomModal
      open={open}
      onOpenChange={() => { /* close only via explicit Cancel/Close buttons */ }}
      onInteractOutside={(e) => e.preventDefault()}
      onPointerDownOutside={(e) => e.preventDefault()}
      onEscapeKeyDown={(e) => e.preventDefault()}
      showCloseButton={false}
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
        {/* Close button positioned over the modal header */}
        <button
          type="button"
          onClick={() => void handleClose()}
          className={cn(
            "absolute top-5 right-5 z-10",
            "w-9 h-9 rounded-xl",
            "flex items-center justify-center",
            "bg-slate-50 hover:bg-slate-100",
            "border border-slate-200/60",
            "text-slate-400 hover:text-slate-700",
            "transition-all duration-200",
            "hover:scale-105 active:scale-95",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/30 focus-visible:ring-offset-2"
          )}
        >
          <X className="w-[18px] h-[18px]" />
          <span className="sr-only">Close</span>
        </button>

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
              const isDisabled =
                (tab.id === "authorizations" && !authorizationsTabEnabled) ||
                (tab.id === "general" && !!createdPaId && !isEditMode)
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

        {isFetchingPA && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-[#037ECC]" />
            <p className="text-sm font-medium">Loading authorization…</p>
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); void handleSaveGeneral() }}
          noValidate
          className={isFetchingPA ? "hidden" : ""}
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
                existingAttachmentUrl={existingAttachmentUrl}
                onClearExistingAttachment={() => setExistingAttachmentUrl(null)}
              />
            )}

            {activeTab === "authorizations" && (
              <TabAuthorizations
                ref={tabAuthRef}
                availableBillingCodes={availableBillingCodes}
                paId={activePaId}
                onOpenBCModal={async (code) => {
                  await refetchAvailableBillingCodes()
                  setBcEditingCode(code)
                  setIsBCModalOpen(true)
                }}
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

      <BillingCodeModal
        open={isBCModalOpen}
        onClose={() => {
          setIsBCModalOpen(false)
          setBcEditingCode(null)
        }}
        onConfirm={async (values, label) => {
          await tabAuthRef.current?.handleConfirm(values, label)
          setIsBCModalOpen(false)
          setBcEditingCode(null)
        }}
        editingCode={bcEditingCode}
        billingCodes={availableBillingCodes}
        usedBillingCodeIds={tabAuthRef.current?.usedBillingCodeIds ?? []}
        isLoading={tabAuthRef.current?.isConfirming ?? false}
        isLoadingCatalog={isLoadingAvailableBillingCodes}
      />
    </>
  )
}
