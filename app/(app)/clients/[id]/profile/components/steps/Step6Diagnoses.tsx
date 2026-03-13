"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Controller, FormProvider, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Activity, Edit2, Upload, X, FileText, File, Eye, AlertCircle, Trash2, Plus, Stethoscope } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { CustomModal } from "@/components/custom/CustomModal"
import { CustomTable, type CustomTableColumn } from "@/components/custom/CustomTable"
import { DeleteConfirmModal } from "@/components/custom/DeleteConfirmModal"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { DocumentViewer } from "@/components/custom/DocumentViewer"
import { Tabs, type TabItem } from "@/components/custom/Tabs"
import { PhysicianFormFields } from "@/app/(app)/my-company/physicians/components/PhysicianFormFields"
import {
  diagnosisFormDefaults,
  diagnosisFormSchema,
  type DiagnosisFormValues,
} from "@/lib/schemas/diagnosis-form.schema"
import { useDiagnosesByClient } from "@/lib/modules/diagnoses/hooks/use-diagnoses-by-client"
import { useCreateDiagnosis } from "@/lib/modules/diagnoses/hooks/use-create-diagnosis"
import { useUpdateDiagnosis } from "@/lib/modules/diagnoses/hooks/use-update-diagnosis"
import { useRemoveDiagnosis } from "@/lib/modules/diagnoses/hooks/use-remove-diagnosis"
import { useClientPhysicians } from "@/lib/modules/client-physicians/hooks/use-client-physicians"
import { useAssignClientPhysician } from "@/lib/modules/client-physicians/hooks/use-assign-client-physician"
import { useRemoveClientPhysician } from "@/lib/modules/client-physicians/hooks/use-remove-client-physician"
import { useCreateManualClientPhysician } from "@/lib/modules/client-physicians/hooks/use-create-manual-client-physician"
import { usePhysicians } from "@/lib/modules/physicians/hooks/use-physicians"
import { useClients } from "@/lib/modules/clients/hooks/use-clients"
import { usePhysicianTypes } from "@/lib/modules/physicians/hooks/use-physician-types"
import { usePhysicianSpecialties } from "@/lib/modules/physicians/hooks/use-physician-specialties"
import { useCountries } from "@/lib/modules/addresses/hooks/use-countries"
import { useStates } from "@/lib/modules/addresses/hooks/use-states"
import type { Diagnosis } from "@/lib/types/diagnosis.types"
import type { ClientPhysician, CreateManualClientPhysicianDto } from "@/lib/types/client-physician.types"
import type { ClientListItem } from "@/lib/types/client.types"
import type { StepComponentProps } from "@/lib/types/wizard.types"
import { physicianFormSchema, getPhysicianFormDefaults, type PhysicianFormData } from "@/lib/schemas/physician-form.schema"
import { dateToISO, formatDateDisplay } from "@/lib/utils/date"
import { isoToLocalDate } from "@/lib/date"
import { cn } from "@/lib/utils"

const MAX_SIZE_MB = 25

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(",")[1] ?? result)
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

function getMimeTypeFromName(fileName: string | null | undefined): string {
  const ext = (fileName ?? "").split(".").pop()?.toLowerCase() ?? ""
  if (ext === "pdf") return "application/pdf"
  if (ext === "png") return "image/png"
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg"
  if (ext === "webp") return "image/webp"
  return "application/octet-stream"
}

export function Step6Diagnoses({
  clientId,
  isCreateMode = false,
  onSaveSuccess,
  onValidationError,
  registerSubmit,
  registerValidation,
  onStepStatusChange,
}: StepComponentProps) {
  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false)
  const [editingDiagnosis, setEditingDiagnosis] = useState<Diagnosis | null>(null)
  const [deletingDiagnosis, setDeletingDiagnosis] = useState<Diagnosis | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [attachmentBase64, setAttachmentBase64] = useState<string | null>(null)
  const [attachmentFileName, setAttachmentFileName] = useState<string | null>(null)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [viewerDocument, setViewerDocument] = useState<{ url: string; name: string } | null>(null)
  const [isReferringPhysicianModalOpen, setIsReferringPhysicianModalOpen] = useState(false)
  const [referringPhysicianTab, setReferringPhysicianTab] = useState("agency")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resolvedClientId = useMemo(() => {
    if (!isCreateMode && clientId !== "new") {
      return clientId
    }

    if (typeof window === "undefined") {
      return null
    }

    const segments = window.location.pathname.split("/")
    const clientsIndex = segments.findIndex((segment) => segment === "clients")
    const possibleClientId = clientsIndex >= 0 ? segments[clientsIndex + 1] : null

    if (!possibleClientId || possibleClientId === "new") {
      return null
    }

    return possibleClientId
  }, [clientId, isCreateMode])

  const { diagnoses, isLoading, error, refetch } = useDiagnosesByClient(resolvedClientId)
  const { create, isLoading: isCreating } = useCreateDiagnosis()
  const { update, isLoading: isUpdating } = useUpdateDiagnosis()
  const { remove, isLoading: isRemoving } = useRemoveDiagnosis()
  const { physicians: clientPhysicians, refetch: refetchClientPhysicians } = useClientPhysicians(resolvedClientId)
  const { assign, isLoading: isAssigningPhysician } = useAssignClientPhysician()
  const { remove: removeClientPhysician, isLoading: isRemovingPhysician } = useRemoveClientPhysician()
  const { createManual, isLoading: isCreatingManualPhysician } = useCreateManualClientPhysician()
  const { physicians: agencyPhysicians } = usePhysicians({ page: 0, pageSize: 200 })
  const { clients } = useClients({ page: 0, pageSize: 200 })

  const form = useForm<DiagnosisFormValues>({
    resolver: zodResolver(diagnosisFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: diagnosisFormDefaults,
  })

  const [selectedAgencyPhysicianId, setSelectedAgencyPhysicianId] = useState("")
  const [selectedSourceClientId, setSelectedSourceClientId] = useState("")
  const [selectedOtherClientPhysicianId, setSelectedOtherClientPhysicianId] = useState("")

  const currentReferringPhysician = clientPhysicians[0] ?? null

  const physicianForm = useForm<PhysicianFormData>({
    resolver: zodResolver(physicianFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: getPhysicianFormDefaults(),
  })

  const { countries, isLoading: isLoadingCountries } = useCountries()
  const { physicianTypes, isLoading: isLoadingPhysicianTypes } = usePhysicianTypes()
  const { physicianSpecialties, isLoading: isLoadingPhysicianSpecialties } = usePhysicianSpecialties()

  const usaCountry = useMemo(
    () => countries.find((country) => country.name === "United States" || country.name === "USA"),
    [countries]
  )

  const { states, isLoading: isLoadingStates } = useStates(usaCountry?.id ?? null)

  const selectableAgencyPhysicians = useMemo(
    () => agencyPhysicians.filter((physician) => physician.id !== currentReferringPhysician?.physicianId),
    [agencyPhysicians, currentReferringPhysician?.physicianId]
  )

  const otherClients = useMemo(
    () => clients.filter((clientItem) => clientItem.id !== resolvedClientId),
    [clients, resolvedClientId]
  )

  const {
    physicians: otherClientPhysicians,
    isLoading: isLoadingOtherClientPhysicians,
  } = useClientPhysicians(selectedSourceClientId || null)

  const selectableOtherClientPhysicians = useMemo(
    () => otherClientPhysicians.filter((physician) => physician.physicianId !== currentReferringPhysician?.physicianId),
    [otherClientPhysicians, currentReferringPhysician?.physicianId]
  )

  const columns: CustomTableColumn<Diagnosis>[] = [
    {
      key: "code",
      header: "Code",
    },
    {
      key: "name",
      header: "Name",
    },
    {
      key: "referralDate",
      header: "Referral Date",
      render: (diagnosis) =>
        diagnosis.referralDate
          ? formatDateDisplay(isoToLocalDate(diagnosis.referralDate))
          : "—",
    },
    {
      key: "status",
      header: "Status",
      render: (diagnosis) => (
        <span className={diagnosis.status
          ? "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200"
        }>
          {diagnosis.status ? "Active" : "Inactive"}
        </span>
      ),
      align: "center",
    },
    {
      key: "isPrimary",
      header: "Type",
      render: (diagnosis) => (
        <span className={diagnosis.isPrimary
          ? "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-blue-50 text-[#037ECC] border border-blue-200"
          : "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"
        }>
          {diagnosis.isPrimary ? "Primary" : "Secondary"}
        </span>
      ),
      align: "center",
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (diagnosis) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setEditingDiagnosis(diagnosis)
              const resetValues = {
                code: diagnosis.code ?? "",
                name: diagnosis.name ?? "",
                referralDate: diagnosis.referralDate ? isoToLocalDate(diagnosis.referralDate) : "",
                treatmentStartDate: diagnosis.treatmentStartDate ? isoToLocalDate(diagnosis.treatmentStartDate) : "",
                status: Boolean(diagnosis.status),
                treatmentEndDate: diagnosis.treatmentEndDate ? isoToLocalDate(diagnosis.treatmentEndDate) : "",
                isPrimary: Boolean(diagnosis.isPrimary),
              }
              form.reset(resetValues)
              setAttachmentFile(null)
              setAttachmentBase64(null)
              setAttachmentFileName(diagnosis.attachmentFileName ?? null)
              setAttachmentError(null)
              setIsDiagnosisModalOpen(true)
            }}
            className={cn(
              "group/edit relative h-9 w-9",
              "flex items-center justify-center rounded-xl",
              "bg-gradient-to-b from-blue-50 to-blue-100/80",
              "border border-blue-200/60 shadow-sm shadow-blue-900/5",
              "hover:from-blue-100 hover:to-blue-200/90",
              "hover:border-blue-300/80 hover:shadow-md hover:shadow-blue-900/10",
              "hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
              "transition-all duration-200 ease-out",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2"
            )}
            title="Edit diagnosis"
            aria-label="Edit diagnosis"
          >
            <Edit2 className="w-4 h-4 text-blue-600 group-hover/edit:text-blue-700 transition-colors duration-200" />
          </button>
          <button
            onClick={() => {
              setDeletingDiagnosis(diagnosis)
              setIsDeleteModalOpen(true)
            }}
            className={cn(
              "group/delete relative h-9 w-9",
              "flex items-center justify-center rounded-xl",
              "bg-gradient-to-b from-red-50 to-red-100/80",
              "border border-red-200/60 shadow-sm shadow-red-900/5",
              "hover:from-red-100 hover:to-red-200/90",
              "hover:border-red-300/80 hover:shadow-md hover:shadow-red-900/10",
              "hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
              "transition-all duration-200 ease-out",
              "focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:ring-offset-2"
            )}
            title="Remove diagnosis"
            aria-label="Remove diagnosis"
          >
            <Trash2 className="w-4 h-4 text-red-600 group-hover/delete:text-red-700 transition-colors duration-200" />
          </button>
        </div>
      ),
    },
  ]

  const totalCount = diagnoses.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const hasPrimaryDiagnosis = useMemo(
    () => diagnoses.some((diagnosis) => diagnosis.isPrimary),
    [diagnoses]
  )
  const isCreatePrimaryLocked = !editingDiagnosis && hasPrimaryDiagnosis
  const paginatedDiagnoses = useMemo(() => {
    const start = (page - 1) * pageSize
    return diagnoses.slice(start, start + pageSize)
  }, [diagnoses, page, pageSize])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  useEffect(() => {
    registerValidation(true)
  }, [registerValidation])

  useEffect(() => {
    registerSubmit(async () => {
      onSaveSuccess({ diagnosesCount: diagnoses.length })
    })
  }, [diagnoses.length, onSaveSuccess, registerSubmit])

  const handleAttachmentChange = async (file: File) => {
    setAttachmentError(null)

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setAttachmentError(`File exceeds the ${MAX_SIZE_MB}MB size limit.`)
      return
    }

    try {
      const base64 = await readFileAsBase64(file)
      setAttachmentFile(file)
      setAttachmentBase64(base64)
      setAttachmentFileName(file.name)
    } catch {
      setAttachmentError("Failed to process file. Please try again.")
    }
  }

  const handleViewAttachment = () => {
    if (attachmentFile) {
      const url = URL.createObjectURL(attachmentFile)
      setViewerDocument({ url, name: attachmentFile.name })
      return
    }

    if (editingDiagnosis?.attachment && editingDiagnosis.attachmentFileName) {
      const mime = getMimeTypeFromName(editingDiagnosis.attachmentFileName)
      const url = editingDiagnosis.attachment.startsWith("data:")
        ? editingDiagnosis.attachment
        : `data:${mime};base64,${editingDiagnosis.attachment}`
      setViewerDocument({ url, name: editingDiagnosis.attachmentFileName })
    }
  }

  useEffect(() => {
    onStepStatusChange?.("diagnoses", diagnoses.length > 0 ? "COMPLETE" : "PENDING")
  }, [diagnoses.length, onStepStatusChange])

  const handleSaveDiagnosis = form.handleSubmit(async (values) => {
    if (!resolvedClientId) {
      onValidationError({ general: "Client not found" })
      return
    }

    const currentDate = dateToISO(new Date())

    if (currentDate && values.treatmentStartDate > currentDate) {
      const message = "Treatment start date is later than the current date"
      form.setError("treatmentStartDate", {
        type: "manual",
        message,
      })
      onValidationError({ treatmentStartDate: message })
      return
    }

    const payload = {
      code: values.code,
      name: values.name,
      referralDate: values.referralDate,
      treatmentStartDate: values.treatmentStartDate,
      status: values.status,
      treatmentEndDate: values.treatmentEndDate || undefined,
      isPrimary: values.isPrimary,
      ...(attachmentBase64 && attachmentFileName
        ? {
            attachment: attachmentBase64,
            attachmentFileName,
          }
        : {}),
    }

    const ok = editingDiagnosis
      ? await update(editingDiagnosis.id, payload)
      : await create({
          clientId: resolvedClientId,
          ...payload,
        })

    if (!ok) {
      return
    }

    form.reset(diagnosisFormDefaults)
    setEditingDiagnosis(null)
    setAttachmentFile(null)
    setAttachmentBase64(null)
    setAttachmentFileName(null)
    setAttachmentError(null)
    setIsDiagnosisModalOpen(false)
    await refetch()
  }, () => {
    const errors: Record<string, string> = {}
    Object.entries(form.formState.errors).forEach(([key, errorItem]) => {
      if (errorItem && typeof errorItem.message === "string") {
        errors[key] = errorItem.message
      }
    })
    onValidationError(errors)
  })

  const handleConfirmRemove = async () => {
    if (!deletingDiagnosis) return
    const ok = await remove(deletingDiagnosis.id)
    if (!ok) return
    setIsDeleteModalOpen(false)
    setDeletingDiagnosis(null)
    await refetch()
  }

  const resetReferringPhysicianModalState = () => {
    setReferringPhysicianTab("agency")
    setSelectedAgencyPhysicianId("")
    setSelectedSourceClientId("")
    setSelectedOtherClientPhysicianId("")
    physicianForm.reset(getPhysicianFormDefaults())
  }

  const handleAssignReferringPhysician = async (physicianId: string) => {
    if (!resolvedClientId || !physicianId) return

    if (currentReferringPhysician) {
      const removed = await removeClientPhysician(currentReferringPhysician.id)
      if (!removed) return
    }

    const assigned = await assign({ clientId: resolvedClientId, physicianId })
    if (!assigned) return

    await refetchClientPhysicians()
    setIsReferringPhysicianModalOpen(false)
    resetReferringPhysicianModalState()
  }

  const handleSaveManualReferringPhysician = physicianForm.handleSubmit(async (values) => {
    if (!resolvedClientId) return

    if (currentReferringPhysician) {
      const removed = await removeClientPhysician(currentReferringPhysician.id)
      if (!removed) return
    }

    const payload: CreateManualClientPhysicianDto = {
      clientId: resolvedClientId,
      firstName: values.firstName,
      lastName: values.lastName,
      specialty: values.specialty,
      npi: values.npi,
      mpi: values.mpi,
      phone: values.phone,
      fax: values.fax || undefined,
      email: values.email,
      type: values.type,
      active: values.active,
      companyName: values.companyName || undefined,
      address: values.address || undefined,
      city: values.city || undefined,
      state: values.state || undefined,
      zipCode: values.zipCode || undefined,
      country: values.country || undefined,
      countryId: usaCountry?.id || undefined,
      stateId: values.stateId || undefined,
    }

    const created = await createManual(payload)
    if (!created) return

    await refetchClientPhysicians()
    setIsReferringPhysicianModalOpen(false)
    resetReferringPhysicianModalState()
  })

  if (!resolvedClientId) {
    return (
      <div className="max-w-5xl mx-auto p-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <p className="text-amber-700 font-medium">
            Please save the client first before managing diagnoses.
          </p>
        </div>
      </div>
    )
  }

  const hasExistingAttachment = Boolean(editingDiagnosis?.attachment && editingDiagnosis?.attachmentFileName)
  const hasAnyAttachment = Boolean(attachmentFile || hasExistingAttachment)

  const referringPhysicianTabs: TabItem[] = [
    {
      id: "agency",
      label: "Agency",
      content: (
        <div className="space-y-5 pt-4">
          <FloatingSelect
            label="Agency Physician"
            value={selectedAgencyPhysicianId}
            onChange={setSelectedAgencyPhysicianId}
            options={selectableAgencyPhysicians.map((physician) => ({
              value: physician.id,
              label: `${physician.firstName} ${physician.lastName}`,
            }))}
            searchable
          />

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsReferringPhysicianModalOpen(false)
                resetReferringPhysicianModalState()
              }}
              disabled={isAssigningPhysician}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleAssignReferringPhysician(selectedAgencyPhysicianId)}
              disabled={!selectedAgencyPhysicianId || isAssigningPhysician}
              loading={isAssigningPhysician}
            >
              Save physician
            </Button>
          </div>
        </div>
      ),
    },
    {
      id: "other-clients",
      label: "Other Clients",
      content: (
        <div className="space-y-5 pt-4">
          <FloatingSelect
            label="Client"
            value={selectedSourceClientId}
            onChange={(value) => {
              setSelectedSourceClientId(value)
              setSelectedOtherClientPhysicianId("")
            }}
            options={otherClients.map((clientItem: ClientListItem) => ({
              value: clientItem.id,
              label: `${clientItem.fullName}${clientItem.chartId ? ` (${clientItem.chartId})` : ""}`,
            }))}
            searchable
          />

          <FloatingSelect
            label="Referring Physician"
            value={selectedOtherClientPhysicianId}
            onChange={setSelectedOtherClientPhysicianId}
            options={selectableOtherClientPhysicians.map((physician) => ({
              value: physician.physicianId,
              label: physician.fullName,
            }))}
            searchable
            disabled={!selectedSourceClientId || isLoadingOtherClientPhysicians}
          />

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsReferringPhysicianModalOpen(false)
                resetReferringPhysicianModalState()
              }}
              disabled={isAssigningPhysician}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleAssignReferringPhysician(selectedOtherClientPhysicianId)}
              disabled={!selectedOtherClientPhysicianId || isAssigningPhysician}
              loading={isAssigningPhysician}
            >
              Save physician
            </Button>
          </div>
        </div>
      ),
    },
    {
      id: "manual",
      label: "Manual",
      content: (
        <FormProvider {...physicianForm}>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void handleSaveManualReferringPhysician()
            }}
            className="space-y-4 pt-4"
          >
            <div className="max-h-[420px] overflow-y-auto pr-1">
              <PhysicianFormFields
                isEditing={false}
                countries={countries.map((country) => ({ id: country.id, name: country.name }))}
                states={states.map((state) => ({ id: state.id, name: state.name }))}
                physicianTypes={physicianTypes}
                physicianSpecialties={physicianSpecialties}
                isLoadingCountries={isLoadingCountries}
                isLoadingStates={isLoadingStates}
                isLoadingPhysicianTypes={isLoadingPhysicianTypes}
                isLoadingPhysicianSpecialties={isLoadingPhysicianSpecialties}
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsReferringPhysicianModalOpen(false)
                  resetReferringPhysicianModalState()
                }}
                disabled={isCreatingManualPhysician}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isCreatingManualPhysician} disabled={isCreatingManualPhysician}>
                Save physician
              </Button>
            </div>
          </form>
        </FormProvider>
      ),
    },
  ]

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Diagnoses</h2>
          <p className="text-slate-600 mt-1">Client diagnoses and treatment dates</p>
        </div>

        <Button
          type="button"
          onClick={() => {
            setEditingDiagnosis(null)
            form.reset({
              ...diagnosisFormDefaults,
              isPrimary: !hasPrimaryDiagnosis,
            })
            setAttachmentFile(null)
            setAttachmentBase64(null)
            setAttachmentFileName(null)
            setAttachmentError(null)
            setIsDiagnosisModalOpen(true)
          }}
        >
          New diagnosis
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
        </div>
      )}

      <CustomTable
        columns={columns}
        data={paginatedDiagnoses}
        isLoading={isLoading}
        emptyMessage="No diagnoses added yet"
        hideEmptyIcon
        emptyContent={
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <div className="relative mb-1">
              <div className="absolute inset-0 rounded-full bg-[#037ECC]/10 blur-2xl" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10">
                <Activity className="h-10 w-10 text-[#037ECC]/60" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-700">No diagnoses available</p>
            <p className="max-w-md text-center text-sm text-slate-500">
              Add at least one diagnosis to keep this client profile complete.
            </p>
          </div>
        }
        getRowKey={(diagnosis) => diagnosis.id}
        pagination={{
          page,
          pageSize,
          total: totalCount,
          onPageChange: setPage,
          onPageSizeChange: (newPageSize) => {
            setPageSize(newPageSize)
            setPage(1)
          },
          pageSizeOptions: [10, 25, 50],
        }}
      />

      <CustomModal
        open={isDiagnosisModalOpen}
        onOpenChange={(open) => {
          setIsDiagnosisModalOpen(open)
          if (!open) {
            setEditingDiagnosis(null)
            form.reset(diagnosisFormDefaults)
            setAttachmentFile(null)
            setAttachmentBase64(null)
            setAttachmentFileName(null)
            setAttachmentError(null)
          }
        }}
        title={editingDiagnosis ? "Edit diagnosis" : "New diagnosis"}
        description={editingDiagnosis ? "Update diagnosis details" : "Add diagnosis details"}
        maxWidthClassName="sm:max-w-[760px]"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleSaveDiagnosis()
          }}
          className="px-6 py-6"
        >
          {Object.keys(form.formState.errors).length > 0 && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {Object.entries(form.formState.errors).map(([key, err]) => (
                <p key={key}>{String(err?.message ?? key)}</p>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Controller
              name="code"
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <FloatingInput
                    label="Code"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    hasError={!!fieldState.error}
                    required
                  />
                  {fieldState.error && <p className="mt-2 text-sm text-red-600">{fieldState.error.message}</p>}
                </div>
              )}
            />

            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <FloatingInput
                    label="Name"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    hasError={!!fieldState.error}
                    required
                  />
                  {fieldState.error && <p className="mt-2 text-sm text-red-600">{fieldState.error.message}</p>}
                </div>
              )}
            />

            <Controller
              name="referralDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <PremiumDatePicker
                  label="Referral Date"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  hasError={!!fieldState.error}
                  errorMessage={fieldState.error?.message}
                  required
                />
              )}
            />

            <Controller
              name="treatmentStartDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <PremiumDatePicker
                  label="Treatment Start Date"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  hasError={!!fieldState.error}
                  errorMessage={fieldState.error?.message}
                  required
                />
              )}
            />

            <Controller
              name="treatmentEndDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <PremiumDatePicker
                  label="Treatment End Date"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  hasError={!!fieldState.error}
                  errorMessage={fieldState.error?.message}
                />
              )}
            />
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">Referring Physician</p>
                {currentReferringPhysician ? (
                  <p className="text-sm text-slate-600 mt-1">
                    {currentReferringPhysician.fullName}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500 mt-1">No referring physician selected</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {currentReferringPhysician && (
                  <button
                    type="button"
                    onClick={async () => {
                      const removed = await removeClientPhysician(currentReferringPhysician.id)
                      if (!removed) return
                      await refetchClientPhysicians()
                    }}
                    className={cn(
                      "group/delete relative h-9 w-9",
                      "flex items-center justify-center rounded-xl",
                      "bg-gradient-to-b from-red-50 to-red-100/80",
                      "border border-red-200/60 shadow-sm shadow-red-900/5",
                      "hover:from-red-100 hover:to-red-200/90",
                      "hover:border-red-300/80 hover:shadow-md hover:shadow-red-900/10",
                      "hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
                      "transition-all duration-200 ease-out",
                      "focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:ring-offset-2"
                    )}
                    title="Remove referring physician"
                    aria-label="Remove referring physician"
                    disabled={isRemovingPhysician}
                  >
                    <Trash2 className="w-4 h-4 text-red-600 group-hover/delete:text-red-700 transition-colors duration-200" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsReferringPhysicianModalOpen(true)}
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#037ECC] hover:text-[#025fa0]"
                >
                  <Plus className="w-4 h-4" />
                  {currentReferringPhysician ? "Change" : "Add Referring Physicians"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Attachment</p>
              {hasAnyAttachment && (
                <button
                  type="button"
                  onClick={handleViewAttachment}
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#037ECC] hover:text-[#0268a8]"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
              )}
            </div>

            {hasAnyAttachment && (
              <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white">
                <div className="w-11 h-11 rounded-lg bg-[#037ECC]/10 flex items-center justify-center flex-shrink-0">
                  {attachmentFile ? (
                    <File className="w-5 h-5 text-[#037ECC]" />
                  ) : (
                    <FileText className="w-5 h-5 text-[#037ECC]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {attachmentFileName || editingDiagnosis?.attachmentFileName}
                  </p>
                  {attachmentFile && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {(attachmentFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "w-9 h-9 rounded-lg",
                      "flex items-center justify-center",
                      "bg-slate-50 hover:bg-slate-100",
                      "border border-slate-200",
                      "text-slate-500 hover:text-slate-700",
                      "transition-all duration-200"
                    )}
                    title="Change attachment"
                  >
                    <Upload className="w-[18px] h-[18px]" />
                  </button>
                  {attachmentFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setAttachmentFile(null)
                        setAttachmentBase64(null)
                        setAttachmentFileName(editingDiagnosis?.attachmentFileName ?? null)
                        setAttachmentError(null)
                      }}
                      className={cn(
                        "w-9 h-9 rounded-lg",
                        "flex items-center justify-center",
                        "bg-slate-50 hover:bg-slate-100",
                        "border border-slate-200",
                        "text-slate-400 hover:text-slate-700",
                        "transition-all duration-200"
                      )}
                      title="Remove selected file"
                    >
                      <X className="w-[18px] h-[18px]" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {!hasAnyAttachment && (
              <label
                className={cn(
                  "flex flex-col items-center justify-center",
                  "gap-2 p-6 rounded-2xl border-2 border-dashed",
                  "cursor-pointer transition-all duration-200",
                  dragOver
                    ? "border-[#037ECC] bg-[#037ECC]/5"
                    : "border-slate-200 hover:border-[#037ECC]/50 hover:bg-slate-50/70"
                )}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={async (e) => {
                  e.preventDefault()
                  setDragOver(false)
                  const dropped = e.dataTransfer.files?.[0]
                  if (dropped) {
                    await handleAttachmentChange(dropped)
                  }
                }}
              >
                <div className="w-10 h-10 rounded-full bg-[#037ECC]/10 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-[#037ECC]" />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  Click to upload or drop file here
                </p>
                <p className="text-xs text-slate-400">Any format up to {MAX_SIZE_MB}MB</p>
              </label>
            )}

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={async (e) => {
                const selected = e.target.files?.[0]
                if (selected) {
                  await handleAttachmentChange(selected)
                }
                e.target.value = ""
              }}
            />

            {attachmentError && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                {attachmentError}
              </div>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Controller
              name="status"
              control={form.control}
              render={({ field }) => (
                <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                  <PremiumSwitch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    label={field.value ? "Active" : "Inactive"}
                    description="Control diagnosis status"
                    variant="default"
                  />
                </div>
              )}
            />

            <Controller
              name="isPrimary"
              control={form.control}
              render={({ field }) => (
                <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                  <PremiumSwitch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    label={field.value ? "Primary" : "Secondary"}
                    description={isCreatePrimaryLocked
                      ? "A primary diagnosis already exists"
                      : "Set diagnosis priority"
                    }
                    disabled={isCreatePrimaryLocked}
                    variant="default"
                  />
                </div>
              )}
            />
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsDiagnosisModalOpen(false)
                setEditingDiagnosis(null)
                form.reset(diagnosisFormDefaults)
                setAttachmentFile(null)
                setAttachmentBase64(null)
                setAttachmentFileName(null)
                setAttachmentError(null)
              }}
              disabled={isCreating || isUpdating}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isCreating || isUpdating} disabled={isCreating || isUpdating}>
              {editingDiagnosis ? "Update diagnosis" : "Save diagnosis"}
            </Button>
          </div>
        </form>
      </CustomModal>

      <CustomModal
        open={isReferringPhysicianModalOpen}
        onOpenChange={(open) => {
          setIsReferringPhysicianModalOpen(open)
          if (!open) {
            resetReferringPhysicianModalState()
          }
        }}
        title="Referring Physicians"
        description="Select one referring physician from catalog, other clients, or create manually"
        maxWidthClassName="sm:max-w-[860px]"
      >
        <div className="pb-2">
          <Tabs
            items={referringPhysicianTabs}
            defaultTab={referringPhysicianTab}
            onChange={setReferringPhysicianTab}
          />
        </div>
      </CustomModal>

      {viewerDocument && (
        <DocumentViewer
          open={!!viewerDocument}
          onClose={() => {
            if (viewerDocument.url.startsWith("blob:")) {
              URL.revokeObjectURL(viewerDocument.url)
            }
            setViewerDocument(null)
          }}
          documentUrl={viewerDocument.url}
          fileName={viewerDocument.name}
        />
      )}

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setDeletingDiagnosis(null)
        }}
        onConfirm={() => void handleConfirmRemove()}
        title="Remove diagnosis"
        message="Are you sure you want to remove this diagnosis from the client?"
        itemName={deletingDiagnosis ? `${deletingDiagnosis.code} - ${deletingDiagnosis.name}` : undefined}
        isDeleting={isRemoving}
      />
    </div>
  )
}
