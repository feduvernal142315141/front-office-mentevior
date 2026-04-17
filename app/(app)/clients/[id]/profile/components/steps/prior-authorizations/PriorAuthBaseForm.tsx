"use client"

import { useEffect, useRef, useState, type RefObject } from "react"
import { Controller, type UseFormReturn } from "react-hook-form"
import { Upload, X, FileText, Eye, Download } from "lucide-react"
import { toast } from "sonner"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { DocumentViewer } from "@/components/custom/DocumentViewer"
import {
  DURATION_INTERVAL_OPTIONS,
  type PriorAuthFormValues,
} from "@/lib/schemas/prior-authorization-form.schema"
import type { ClientInsurance } from "@/lib/types/client-insurance.types"
import { useDiagnosesByClient } from "@/lib/modules/diagnoses/hooks/use-diagnoses-by-client"
import { calculateDuration } from "@/lib/utils/prior-auth-utils"
import { cn } from "@/lib/utils"

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024

export interface PriorAuthBaseFormRefs {
  authNumber: RefObject<HTMLInputElement | null>
  insuranceId: RefObject<HTMLButtonElement | null>
  startDate: RefObject<HTMLButtonElement | null>
  endDate: RefObject<HTMLButtonElement | null>
  durationInterval: RefObject<HTMLButtonElement | null>
}

interface PriorAuthBaseFormProps {
  form: UseFormReturn<PriorAuthFormValues>
  insurances: ClientInsurance[]
  clientId: string
  existingAttachmentUrl?: string | null
  existingAttachmentDownloadUrl?: string | null
  onClearExistingAttachment?: () => void
  editingInsuranceId?: string | null
  editingInsuranceName?: string | null
  fieldRefs?: PriorAuthBaseFormRefs
}

function getFileNameFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    const segment = parsed.pathname.split("/").pop()
    return segment ? decodeURIComponent(segment) : null
  } catch {
    return null
  }
}

function truncateFileName(name: string | null | undefined, max = 52): string {
  if (!name) return "Attachment"
  const cleaned = name.trim()
  if (cleaned.length <= max) return cleaned
  return `${cleaned.slice(0, max)}...`
}

export function PriorAuthBaseForm({
  form,
  insurances,
  clientId,
  existingAttachmentUrl,
  existingAttachmentDownloadUrl,
  onClearExistingAttachment,
  editingInsuranceId,
  editingInsuranceName,
  fieldRefs,
}: PriorAuthBaseFormProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [viewerDocument, setViewerDocument] = useState<{ url: string; name: string } | null>(null)

  const startDate = form.watch("startDate")
  const endDate = form.watch("endDate")
  const interval = form.watch("durationInterval")
  const attachmentName = form.watch("attachmentName")
  const primaryDiagnosisId = form.watch("primaryDiagnosisId")
  const insuranceId = form.watch("insuranceId")

  const { diagnoses, isLoading: isLoadingDiagnoses } = useDiagnosesByClient(clientId)

  const diagnosisOptions = diagnoses.map((d) => ({
    value: d.id,
    label: `${d.code} — ${d.name}`,
  }))

  const activeInsurances = insurances.filter((ins) => ins.isActive)

  useEffect(() => {
    if (diagnoses.length === 1 && !primaryDiagnosisId) {
      form.setValue("primaryDiagnosisId", diagnoses[0].id, { shouldDirty: false })
    }
  }, [diagnoses, primaryDiagnosisId, form])

  useEffect(() => {
    if (activeInsurances.length === 1 && !insuranceId) {
      form.setValue("insuranceId", activeInsurances[0].id, { shouldDirty: false })
    }
  }, [activeInsurances.length, insuranceId, form])

  const duration = calculateDuration(
    startDate,
    endDate,
    interval as "DAYS" | "WEEKS" | "MONTHS"
  )
  const durationDisplay = duration > 0 ? String(duration) : ""

  const insuranceOptions = (() => {
    const options = activeInsurances.map((ins) => ({
      value: ins.id,
      label: ins.payerName,
    }))

    // En modo edit, si el insurance original no está entre los activos
    // (fue desactivado), lo inyectamos como opción para que el select no quede vacío
    if (
      editingInsuranceId &&
      editingInsuranceName &&
      !options.some((o) => o.value === editingInsuranceId)
    ) {
      options.unshift({
        value: editingInsuranceId,
        label: editingInsuranceName,
      })
    }

    return options
  })()

  const handleFileChange = (file: File | null) => {
    if (!file) return
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`File "${file.name}" exceeds the 25 MB limit.`)
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      const base64 = result.split(",")[1] ?? result
      // al subir un archivo nuevo, la URL existente del servidor queda reemplazada
      onClearExistingAttachment?.()
      form.setValue("attachment", base64)
      form.setValue("attachmentName", file.name)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAttachment = () => {
    onClearExistingAttachment?.()
    form.setValue("attachment", "")
    form.setValue("attachmentName", "")
    if (inputRef.current) inputRef.current.value = ""
  }

  const handleViewExisting = () => {
    if (existingAttachmentUrl) {
      setViewerDocument({
        url: existingAttachmentUrl,
        name: getFileNameFromUrl(existingAttachmentUrl) ?? "Attachment",
      })
    }
  }

  const handleDownloadExisting = () => {
    const downloadUrl = existingAttachmentDownloadUrl ?? existingAttachmentUrl
    if (!downloadUrl) return

    const urlWithoutParams = downloadUrl.split("?")[0]
    let extension = ""
    if (urlWithoutParams.includes(".")) {
      const parts = urlWithoutParams.split(".")
      extension = `.${parts[parts.length - 1]}`
    }

    const fileName = attachmentName
      ? attachmentName
      : `authorization-document${extension}`

    const link = document.createElement("a")
    link.href = downloadUrl
    link.download = fileName
    link.style.display = "none"
    document.body.appendChild(link)
    link.click()
    setTimeout(() => document.body.removeChild(link), 100)
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Controller
          name="authNumber"
          control={form.control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                ref={fieldRefs?.authNumber}
                label="Authorization Number"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                inputMode="numeric"
                hasError={!!fieldState.error}
                required
              />
              {fieldState.error && (
                <p className="mt-1.5 text-sm text-red-600">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />

        <Controller
          name="insuranceId"
          control={form.control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingSelect
                ref={fieldRefs?.insuranceId}
                label="Insurance / Payer"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={insuranceOptions}
                hasError={!!fieldState.error}
                required
                searchable={insuranceOptions.length > 5}
              />
              {fieldState.error && (
                <p className="mt-1.5 text-sm text-red-600">{fieldState.error.message}</p>
              )}
              {insuranceOptions.length === 0 && (
                <p className="mt-1.5 text-xs text-amber-600">
                  No active insurances found for this client.
                </p>
              )}

            </div>
          )}
        />

        <Controller
          name="primaryDiagnosisId"
          control={form.control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingSelect
                label="Primary Diagnosis"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={diagnosisOptions}
                hasError={!!fieldState.error}
                searchable={diagnosisOptions.length > 5}
                disabled={isLoadingDiagnoses}
              />
              {fieldState.error && (
                <p className="mt-1.5 text-sm text-red-600">{fieldState.error.message}</p>
              )}
              {!isLoadingDiagnoses && diagnosisOptions.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  No diagnoses found for this client.
                </p>
              )}
            </div>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Controller
          name="startDate"
          control={form.control}
          render={({ field, fieldState }) => (
            <div>
              <PremiumDatePicker
                ref={fieldRefs?.startDate}
                label="Start Date"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                onClear={() => field.onChange("")}
                hasError={!!fieldState.error}
                errorMessage={fieldState.error?.message}
                required
              />
            </div>
          )}
        />

        <Controller
          name="endDate"
          control={form.control}
          render={({ field, fieldState }) => (
            <div>
              <PremiumDatePicker
                ref={fieldRefs?.endDate}
                label="End Date"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                onClear={() => field.onChange("")}
                hasError={!!fieldState.error}
                errorMessage={fieldState.error?.message}
                required
              />
            </div>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div>
          <div className="relative">
            <div
              className={cn(
                "w-full h-[52px] 2xl:h-[56px] px-4 rounded-[16px] flex items-center",
                "bg-slate-50 border border-slate-200 text-slate-600 text-[15px]",
                "cursor-not-allowed select-none"
              )}
            >
              {durationDisplay}
            </div>
            <label className="absolute left-4 px-1 top-0 -translate-y-1/2 text-xs text-slate-400 bg-white/80 pointer-events-none">
              Duration <span className="text-slate-300">(auto)</span>
            </label>
          </div>
        </div>

        <Controller
          name="durationInterval"
          control={form.control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingSelect
                ref={fieldRefs?.durationInterval}
                label="Interval"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={DURATION_INTERVAL_OPTIONS}
                hasError={!!fieldState.error}
                required
              />
              {fieldState.error && (
                <p className="mt-1.5 text-sm text-red-600">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />


      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Controller
          name="requestDate"
          control={form.control}
          render={({ field, fieldState }) => (
            <div>
              <PremiumDatePicker
                label="Request Date"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                onClear={() => field.onChange("")}
                hasError={!!fieldState.error}
                errorMessage={fieldState.error?.message}
              />
            </div>
          )}
        />

        <Controller
          name="responseDate"
          control={form.control}
          render={({ field, fieldState }) => (
            <div>
              <PremiumDatePicker
                label="Response Date"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                onClear={() => field.onChange("")}
                hasError={!!fieldState.error}
                errorMessage={fieldState.error?.message}
              />
            </div>
          )}
        />
      </div>

      <Controller
        name="comments"
        control={form.control}
        render={({ field, fieldState }) => (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Comments
            </label>
            <textarea
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
              maxLength={500}
              rows={3}
              placeholder="Enter comments or notes about this authorization"
              className={cn(
                "w-full resize-y rounded-[16px] px-4 py-3 text-sm text-slate-800",
                "bg-gradient-to-b from-[hsl(240_20%_99%)] to-[hsl(240_18%_96%)]",
                "border border-[hsl(240_20%_88%/0.6)]",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_2px_rgba(15,23,42,0.04)]",
                "placeholder:text-slate-400",
                "focus:outline-none focus:border-[hsl(var(--primary))]",
                "focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_0_0_4px_hsl(var(--primary)/0.12)]",
                "transition-all duration-200",
                fieldState.error && "border-2 border-red-500/70"
              )}
            />
            <div className="flex items-center justify-between mt-1">
              {fieldState.error ? (
                <p className="text-sm text-red-600">{fieldState.error.message}</p>
              ) : (
                <span />
              )}
              <p className="text-xs text-slate-400 text-right">
                {(field.value ?? "").length}/500
              </p>
            </div>
          </div>
        )}
      />

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Attachment
        </label>

        {/* Archivo nuevo subido en esta sesión */}
        {attachmentName && !existingAttachmentUrl ? (
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3",
              "border border-slate-200 bg-white shadow-sm"
            )}
          >
            <div className="h-9 w-9 rounded-lg bg-[#037ECC]/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-[#037ECC]" />
            </div>
            <p className="flex-1 text-sm font-medium text-slate-800 truncate" title={attachmentName}>
              {attachmentName}
            </p>
            <button
              type="button"
              onClick={handleRemoveAttachment}
              className={cn(
                "h-7 w-7 flex items-center justify-center rounded-lg flex-shrink-0",
                "text-slate-400 hover:text-red-500 hover:bg-red-50",
                "transition-colors duration-150"
              )}
              title="Remove attachment"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : existingAttachmentUrl ? (
          /* Archivo existente en S3 */
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3",
              "border border-slate-200 bg-white shadow-sm"
            )}
          >
            <div className="h-9 w-9 rounded-lg bg-[#037ECC]/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-[#037ECC]" />
            </div>
            <p
              className="flex-1 text-sm font-medium text-slate-800 truncate"
              title={getFileNameFromUrl(existingAttachmentUrl) ?? "Attachment"}
            >
              {truncateFileName(getFileNameFromUrl(existingAttachmentUrl), 52)}
            </p>
            <button
              type="button"
              onClick={handleViewExisting}
              className={cn(
                "w-9 h-9 rounded-lg",
                "flex items-center justify-center",
                "bg-slate-50 hover:bg-slate-100",
                "border border-slate-200",
                "text-slate-600 hover:text-slate-900",
                "transition-all duration-200"
              )}
              title="View attachment"
            >
              <Eye className="w-[18px] h-[18px]" />
            </button>
            <button
              type="button"
              onClick={handleDownloadExisting}
              className={cn(
                "w-9 h-9 rounded-lg",
                "flex items-center justify-center",
                "bg-slate-50 hover:bg-slate-100",
                "border border-slate-200",
                "text-slate-600 hover:text-slate-900",
                "transition-all duration-200"
              )}
              title="Download attachment"
            >
              <Download className="w-[18px] h-[18px]" />
            </button>
            <button
              type="button"
              onClick={handleRemoveAttachment}
              className={cn(
                "h-7 w-7 flex items-center justify-center rounded-lg flex-shrink-0",
                "text-slate-400 hover:text-red-500 hover:bg-red-50",
                "transition-colors duration-150"
              )}
              title="Remove attachment"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Sin archivo — zona de upload */
          <div
            onClick={() => inputRef.current?.click()}
            className={cn(
              "group relative cursor-pointer rounded-2xl border-2 border-dashed",
              "border-slate-300 bg-slate-50/60",
              "hover:border-[#037ECC]/50 hover:bg-[#037ECC]/5",
              "transition-all duration-200",
              "flex flex-col items-center justify-center gap-2 py-6"
            )}
          >
            <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center group-hover:border-[#037ECC]/30 transition-colors">
              <Upload className="w-5 h-5 text-slate-400 group-hover:text-[#037ECC]/70 transition-colors" />
            </div>
            <p className="text-sm font-medium text-slate-700">
              Click to upload{" "}
              <span className="text-[#037ECC] font-semibold">authorization document</span>
            </p>
            <p className="text-xs text-slate-400">Any document file up to 25 MB</p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
      </div>

      {viewerDocument && (
        <DocumentViewer
          open={!!viewerDocument}
          onClose={() => setViewerDocument(null)}
          documentUrl={viewerDocument.url}
          fileName={viewerDocument.name}
        />
      )}
    </div>
  )
}
