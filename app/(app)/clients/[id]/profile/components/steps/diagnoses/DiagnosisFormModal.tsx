"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Edit2, Plus, RefreshCw, UserPlus } from "lucide-react"

import { Button } from "@/components/custom/Button"
import { CustomModal } from "@/components/custom/CustomModal"
import { DiagnosisCodeCombobox } from "@/components/custom/DiagnosisCodeCombobox"
import { DocumentViewer } from "@/components/custom/DocumentViewer"
import { MultiSelectWithSearch } from "@/components/custom/MultiSelectWithSearch"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { useAlert } from "@/lib/contexts/alert-context"
import { useCreateDiagnosis } from "@/lib/modules/diagnoses/hooks/use-create-diagnosis"
import { useUpdateDiagnosis } from "@/lib/modules/diagnoses/hooks/use-update-diagnosis"
import { usePhysicianSpecialties } from "@/lib/modules/physicians/hooks/use-physician-specialties"
import { useProvidersOnFile } from "@/lib/modules/provider-on-file/hooks/use-providers-on-file"
import {
  diagnosisFormDefaults,
  diagnosisFormSchema,
  type DiagnosisFormValues,
} from "@/lib/schemas/diagnosis-form.schema"
import type { Diagnosis } from "@/lib/types/diagnosis.types"
import type { DiagnosisCatalogItem } from "@/lib/types/diagnosis-catalog.types"
import { isoToLocalDate } from "@/lib/date"
import { cn } from "@/lib/utils"

import { AttachmentSection } from "./AttachmentSection"
import { EditReferringPhysicianModal } from "./EditReferringPhysicianModal"
import { ReferringPhysicianModal } from "./ReferringPhysicianModal"
import { ProviderOnFileModal } from "./ProviderOnFileModal"
import {
  buildDiagnosisPhysician,
  getFileNameFromUrl,
  getMimeTypeFromName,
  isSupportedAttachment,
  MAX_SIZE_MB,
  readFileAsBase64,
  type SelectedReferringPhysician,
} from "./diagnosis-helpers"

/**
 * Un único modal anidado a la vez. Antes eran tres booleanos independientes más un
 * ref centinela (`preventNextDiagnosisCloseRef`) para que el modal padre no se
 * cerrara solo; con una sola variable el guard es declarativo.
 */
type NestedModal = "none" | "physician" | "editPhysician" | "provider"

interface DiagnosisFormModalProps {
  open: boolean
  /** `null` = alta. Con valor, edición. */
  diagnosis: Diagnosis | null
  clientId: string
  hasPrimaryDiagnosis: boolean
  onClose: () => void
  onSaved: (progress: number | null) => void
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{children}</p>
  )
}

export function DiagnosisFormModal({
  open,
  diagnosis,
  clientId,
  hasPrimaryDiagnosis,
  onClose,
  onSaved,
}: DiagnosisFormModalProps) {
  const alert = useAlert()
  const { create, isLoading: isCreating } = useCreateDiagnosis()
  const { update, isLoading: isUpdating } = useUpdateDiagnosis()

  const [nestedModal, setNestedModal] = useState<NestedModal>("none")
  const [selectedPhysician, setSelectedPhysician] = useState<SelectedReferringPhysician | null>(null)
  const [physicianError, setPhysicianError] = useState<string | null>(null)
  const [providerIds, setProviderIds] = useState<string[]>([])
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [attachmentBase64, setAttachmentBase64] = useState<string | null>(null)
  const [attachmentFileName, setAttachmentFileName] = useState<string | null>(null)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  /** El usuario borró el adjunto guardado y todavía no puso otro. */
  const [attachmentCleared, setAttachmentCleared] = useState(false)
  const [viewerDocument, setViewerDocument] = useState<{ url: string; name: string } | null>(null)
  const [isConfirmingClose, setIsConfirmingClose] = useState(false)

  const isSaving = isCreating || isUpdating
  const isEditing = Boolean(diagnosis)
  /** Cualquier overlay por encima del modal bloquea su cierre automático. */
  const hasOverlayAbove = nestedModal !== "none" || isConfirmingClose || !!viewerDocument

  const { providers, isLoading: isLoadingProviders, refetch: refetchProviders } = useProvidersOnFile({
    enabled: open,
  })
  const { physicianSpecialties } = usePhysicianSpecialties({ enabled: open })

  const form = useForm<DiagnosisFormValues>({
    resolver: zodResolver(diagnosisFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: diagnosisFormDefaults,
  })

  const referralDate = form.watch("referralDate")
  const treatmentStartDate = form.watch("treatmentStartDate")

  /**
   * Punto único de inicialización. Antes este bloque estaba copiado en tres sitios
   * (botón New, botón Cancel y `onOpenChange`) y las copias ya habían divergido.
   */
  // Sin este guard, cualquier cambio de `hasPrimaryDiagnosis` (por ejemplo un refetch
  // de la lista de fondo) volvería a resetear el formulario y borraría lo escrito.
  const initializedForRef = useRef<string | null>(null)

  useEffect(() => {
    if (!open) {
      initializedForRef.current = null
      return
    }

    const initKey = diagnosis?.id ?? "new"
    if (initializedForRef.current === initKey) return
    initializedForRef.current = initKey

    const source = diagnosis

    form.reset(
      source
        ? {
            diagnosisCodeId: source.diagnosisCodeId ?? "",
            code: source.code ?? "",
            name: source.name ?? "",
            referralDate: source.referralDate ? isoToLocalDate(source.referralDate) : "",
            treatmentStartDate: source.treatmentStartDate ? isoToLocalDate(source.treatmentStartDate) : "",
            status: Boolean(source.status),
            treatmentEndDate: source.treatmentEndDate ? isoToLocalDate(source.treatmentEndDate) : "",
            isPrimary: Boolean(source.isPrimary),
          }
        : { ...diagnosisFormDefaults, isPrimary: !hasPrimaryDiagnosis }
    )

    setSelectedPhysician(buildDiagnosisPhysician(source))
    setPhysicianError(null)
    setProviderIds((source?.providerOnFiles ?? []).map((provider) => provider.id))
    setAttachmentFile(null)
    setAttachmentBase64(null)
    setAttachmentFileName(
      source
        ? source.attachmentFileName ??
            getFileNameFromUrl(source.attachment) ??
            getFileNameFromUrl(source.attachmentDownload) ??
            null
        : null
    )
    setAttachmentError(null)
    setAttachmentCleared(false)
    setNestedModal("none")
  }, [open, diagnosis, hasPrimaryDiagnosis, form])

  const providerItems = useMemo(() => {
    const specialtyById = new Map(physicianSpecialties.map((sp) => [sp.id, sp.name]))
    return providers.map((provider) => {
      const name = [provider.firstName, provider.lastName].filter(Boolean).join(" ")
      const specialty = provider.specialyName || specialtyById.get(provider.specialyId)
      return { id: provider.id, name: [name, provider.agencyName, specialty].filter(Boolean).join(" — ") }
    })
  }, [providers, physicianSpecialties])

  const hasStoredAttachment = Boolean(
    !attachmentCleared && (diagnosis?.attachment || diagnosis?.attachmentDownload)
  )
  const isPrimaryLocked = !isEditing && hasPrimaryDiagnosis

  const isDirty =
    form.formState.isDirty ||
    Boolean(attachmentFile) ||
    attachmentCleared ||
    selectedPhysician?.physicianId !== diagnosis?.physicianId

  const handleAttachmentPick = useCallback(async (file: File) => {
    setAttachmentError(null)

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setAttachmentError(`File exceeds the ${MAX_SIZE_MB}MB size limit.`)
      return
    }

    if (!isSupportedAttachment(file.name)) {
      setAttachmentError("Unsupported format. Use PDF, PNG, JPG or WEBP.")
      return
    }

    try {
      const base64 = await readFileAsBase64(file)
      setAttachmentFile(file)
      setAttachmentBase64(base64)
      setAttachmentFileName(file.name)
      setAttachmentCleared(false)
    } catch {
      setAttachmentError("Failed to process file. Please try again.")
    }
  }, [])

  const handleAttachmentRemove = () => {
    setAttachmentError(null)

    if (attachmentFile) {
      // Sólo se descarta la selección nueva; el adjunto guardado sigue vigente.
      setAttachmentFile(null)
      setAttachmentBase64(null)
      setAttachmentFileName(diagnosis?.attachmentFileName ?? null)
      return
    }

    setAttachmentCleared(true)
    setAttachmentFileName(null)
  }

  const handleViewAttachment = () => {
    if (attachmentFile) {
      setViewerDocument({ url: URL.createObjectURL(attachmentFile), name: attachmentFile.name })
      return
    }

    if (!diagnosis?.attachment) return

    const fileName =
      diagnosis.attachmentFileName ||
      getFileNameFromUrl(diagnosis.attachment) ||
      getFileNameFromUrl(diagnosis.attachmentDownload) ||
      "Attachment"

    if (diagnosis.attachment.startsWith("http://") || diagnosis.attachment.startsWith("https://")) {
      setViewerDocument({ url: diagnosis.attachment, name: fileName })
      return
    }

    const url = diagnosis.attachment.startsWith("data:")
      ? diagnosis.attachment
      : `data:${getMimeTypeFromName(fileName)};base64,${diagnosis.attachment}`
    setViewerDocument({ url, name: fileName })
  }

  const requestClose = () => {
    if (isSaving) return

    if (!isDirty) {
      onClose()
      return
    }

    setIsConfirmingClose(true)
    alert.confirm({
      title: "Discard changes?",
      description: "This diagnosis has unsaved changes. If you close now they will be lost.",
      confirmText: "Discard",
      cancelText: "Keep editing",
      onConfirm: () => {
        setIsConfirmingClose(false)
        onClose()
      },
      onCancel: () => setIsConfirmingClose(false),
    })
  }

  const handleSubmit = form.handleSubmit(
    async (values) => {
      // El médico es obligatorio también al editar: la guarda anterior sólo
      // aplicaba al crear, así que un diagnóstico sin médico se podía guardar así.
      if (!selectedPhysician?.physicianId) {
        setPhysicianError("Referring physician is required")
        return
      }

      const payload = {
        physicianId: selectedPhysician.physicianId,
        diagnosisCodeId: values.diagnosisCodeId,
        referralDate: values.referralDate,
        treatmentStartDate: values.treatmentStartDate,
        status: values.status,
        // `null` explícito en vez de omitir la clave, para que quede clara la intención
        // de limpiar el campo.
        treatmentEndDate: values.treatmentEndDate ? values.treatmentEndDate : null,
        isPrimary: values.isPrimary,
        providerOnFileIds: providerIds,
        ...(attachmentBase64 && attachmentFileName
          ? { attachment: attachmentBase64, attachmentFileName }
          : attachmentCleared
            ? { attachment: null, attachmentFileName: null }
            : {}),
      }

      const result = diagnosis
        ? await update(diagnosis.id, payload)
        : await create({ clientId, ...payload })

      if (!result) return

      onSaved(typeof result.progress === "number" ? result.progress : null)
      onClose()
    },
    () => {
      if (!selectedPhysician?.physicianId) {
        setPhysicianError("Referring physician is required")
      }
    }
  )

  return (
    <>
      <CustomModal
        open={open}
        onOpenChange={(next) => {
          // Mientras hay un modal anidado abierto, ignoramos las peticiones de cierre
          // que Radix propaga al padre.
          if (!next && hasOverlayAbove) return
          if (!next) requestClose()
        }}
        title={isEditing ? "Edit diagnosis" : "New diagnosis"}
        description={isEditing ? "Update diagnosis details" : "Add diagnosis details"}
        maxWidthClassName="sm:max-w-[760px]"
        constrainHeight
        onInteractOutside={(event) => {
          if (isSaving || hasOverlayAbove) event.preventDefault()
        }}
        onEscapeKeyDown={(event) => {
          if (isSaving || hasOverlayAbove) event.preventDefault()
        }}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleSubmit()
          }}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6">
            {/* --- Identificación --- */}
            <section className="space-y-3">
              <SectionTitle>Diagnosis</SectionTitle>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Controller
                  name="code"
                  control={form.control}
                  render={({ field, fieldState }) => {
                    const idError = form.formState.errors.diagnosisCodeId
                    return (
                      <div>
                        <Controller
                          name="diagnosisCodeId"
                          control={form.control}
                          render={({ field: idField }) => (
                            <input type="hidden" {...idField} value={idField.value ?? ""} />
                          )}
                        />
                        <DiagnosisCodeCombobox
                          key={diagnosis?.id ?? "new"}
                          value={field.value}
                          onChange={(code) => {
                            form.setValue("diagnosisCodeId", "", { shouldValidate: true, shouldDirty: true })
                            form.setValue("name", "", { shouldDirty: true })
                            field.onChange(code)
                          }}
                          onBlur={field.onBlur}
                          onCatalogPick={(item: DiagnosisCatalogItem) => {
                            form.setValue("diagnosisCodeId", item.id, { shouldValidate: true, shouldDirty: true })
                            form.setValue("code", item.code, { shouldValidate: true, shouldDirty: true })
                            form.setValue("name", item.longDescription || item.shortDescription, {
                              shouldValidate: true,
                              shouldDirty: true,
                            })
                          }}
                          hasError={!!fieldState.error || !!idError}
                          required
                        />
                        {fieldState.error && (
                          <p className="mt-2 text-sm text-red-600">{fieldState.error.message}</p>
                        )}
                        {idError && <p className="mt-2 text-sm text-red-600">{idError.message}</p>}
                      </div>
                    )
                  }}
                />

                {/* Valor derivado del catálogo ICD, no un campo que se escriba: antes era
                    un input deshabilitado con asterisco de obligatorio. */}
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field }) => (
                    <div className="flex min-h-[52px] flex-col justify-center rounded-[16px] border border-slate-200 bg-slate-50/70 px-4 py-2">
                      <span className="text-xs font-medium text-slate-500">Name</span>
                      <span
                        className={cn(
                          "mt-0.5 text-[15px]",
                          field.value ? "text-slate-800" : "text-slate-400"
                        )}
                      >
                        {field.value || "Select a code to fill the name"}
                      </span>
                    </div>
                  )}
                />
              </div>
            </section>

            {/* --- Fechas --- */}
            <section className="space-y-3">
              <SectionTitle>Dates</SectionTitle>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
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
                      maxDate={treatmentStartDate || undefined}
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
                      minDate={referralDate || undefined}
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
                      onClear={() => field.onChange("")}
                      onBlur={field.onBlur}
                      hasError={!!fieldState.error}
                      errorMessage={fieldState.error?.message}
                      minDate={treatmentStartDate || undefined}
                    />
                  )}
                />
              </div>
            </section>

            {/* --- Personas --- */}
            <section className="space-y-3">
              <SectionTitle>People</SectionTitle>

              <div
                className={cn(
                  "rounded-xl border bg-slate-50/60 p-4",
                  physicianError ? "border-red-300" : "border-slate-200"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        physicianError ? "text-red-600" : "text-slate-800"
                      )}
                    >
                      Referring Physician{" "}
                      <span className={physicianError ? "text-red-600" : "text-[#2563EB]"}>*</span>
                    </p>
                    {selectedPhysician ? (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-sm font-medium text-slate-700">{selectedPhysician.fullName}</p>
                        {(selectedPhysician.specialty || selectedPhysician.type) && (
                          <p className="text-xs text-slate-500">
                            {[selectedPhysician.specialty, selectedPhysician.type]
                              .filter(Boolean)
                              .join(" - ")}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-slate-500">No referring physician selected</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <button
                      type="button"
                      onClick={() => setNestedModal("physician")}
                      className="inline-flex items-center gap-2 text-sm font-medium text-[#037ECC] hover:text-[#025fa0]"
                    >
                      {selectedPhysician ? (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          Change
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          Add Referring Physician
                        </>
                      )}
                    </button>

                    {selectedPhysician && (
                      <button
                        type="button"
                        onClick={() => setNestedModal("editPhysician")}
                        className="inline-flex items-center gap-2 text-sm font-medium text-[#037ECC] hover:text-[#025fa0]"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </button>
                    )}
                  </div>
                </div>
                {physicianError && <p className="mt-3 text-sm text-red-600">{physicianError}</p>}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Providers on File</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {providerIds.length === 0
                        ? "No providers selected"
                        : `${providerIds.length} provider${providerIds.length === 1 ? "" : "s"} selected`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNestedModal("provider")}
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#037ECC] hover:text-[#025fa0]"
                  >
                    <Plus className="h-4 w-4" />
                    New provider
                  </button>
                </div>
                <div className="mt-3">
                  <MultiSelectWithSearch
                    items={providerItems}
                    selectedIds={providerIds}
                    onChange={setProviderIds}
                    isLoading={isLoadingProviders}
                    placeholder="Select providers on file..."
                  />
                </div>
              </div>
            </section>

            {/* --- Documentación --- */}
            <section className="space-y-3">
              <SectionTitle>Documentation</SectionTitle>
              <AttachmentSection
                file={attachmentFile}
                fileName={attachmentFileName}
                hasStoredAttachment={hasStoredAttachment}
                canDownload={Boolean(diagnosis?.attachmentDownload) && !attachmentCleared}
                error={attachmentError}
                onPick={(file) => void handleAttachmentPick(file)}
                onRemove={handleAttachmentRemove}
                onView={handleViewAttachment}
                onDownload={() => {
                  if (!diagnosis?.attachmentDownload) return
                  window.open(diagnosis.attachmentDownload, "_blank", "noopener,noreferrer")
                }}
              />
            </section>

            {/* --- Estado --- */}
            <section className="space-y-3">
              <SectionTitle>Status</SectionTitle>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Etiqueta fija: antes el label era el propio valor ("Active"/"Inactive"),
                    así que no se distinguía el estado actual de lo que haría el toggle. */}
                <Controller
                  name="status"
                  control={form.control}
                  render={({ field }) => (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                      <PremiumSwitch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        label="Diagnosis is active"
                        description={field.value ? "Currently active" : "Currently inactive"}
                        variant="default"
                      />
                    </div>
                  )}
                />

                {/* Primary/Secondary no son un par on/off: un segmented control lo dice
                    mejor que un toggle cuyo texto cambia. */}
                <Controller
                  name="isPrimary"
                  control={form.control}
                  render={({ field }) => (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                      <p className="text-sm font-semibold text-slate-900">Diagnosis type</p>
                      <div
                        role="radiogroup"
                        aria-label="Diagnosis type"
                        className="mt-2 inline-flex rounded-lg border border-slate-200 bg-white p-0.5"
                      >
                        {[
                          { value: true, label: "Primary" },
                          { value: false, label: "Secondary" },
                        ].map((option) => {
                          const isSelected = field.value === option.value
                          const isDisabled = isPrimaryLocked && option.value === true
                          return (
                            <button
                              key={option.label}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              disabled={isDisabled}
                              onClick={() => field.onChange(option.value)}
                              className={cn(
                                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                                isSelected
                                  ? "bg-[#037ECC] text-white shadow-sm"
                                  : "text-slate-600 hover:bg-slate-50",
                                isDisabled && "cursor-not-allowed opacity-40 hover:bg-transparent"
                              )}
                            >
                              {option.label}
                            </button>
                          )
                        })}
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        {isPrimaryLocked
                          ? "A primary diagnosis already exists"
                          : "Set diagnosis priority"}
                      </p>
                    </div>
                  )}
                />
              </div>
            </section>
          </div>

          {/* Footer fijo: con el modal acotado en altura deja de quedar fuera de pantalla. */}
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
            <Button type="button" variant="secondary" onClick={requestClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" loading={isSaving} disabled={isSaving}>
              {isEditing ? "Update diagnosis" : "Save diagnosis"}
            </Button>
          </div>
        </form>
      </CustomModal>

      <ReferringPhysicianModal
        open={nestedModal === "physician"}
        onClose={() => setNestedModal("none")}
        clientId={clientId}
        currentPhysicianId={selectedPhysician?.physicianId}
        onSelect={(physician) => {
          setSelectedPhysician(physician)
          setPhysicianError(null)
        }}
      />

      <EditReferringPhysicianModal
        open={nestedModal === "editPhysician"}
        physicianId={selectedPhysician?.physicianId ?? null}
        onClose={() => setNestedModal("none")}
        onSaved={(updated) =>
          setSelectedPhysician((current) => (current ? { ...current, ...updated } : current))
        }
      />

      <ProviderOnFileModal
        open={nestedModal === "provider"}
        onClose={() => setNestedModal("none")}
        onCreated={(providerId) => {
          void refetchProviders()
          setProviderIds((prev) => (prev.includes(providerId) ? prev : [...prev, providerId]))
        }}
      />

      {viewerDocument && (
        <DocumentViewer
          open
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
    </>
  )
}
