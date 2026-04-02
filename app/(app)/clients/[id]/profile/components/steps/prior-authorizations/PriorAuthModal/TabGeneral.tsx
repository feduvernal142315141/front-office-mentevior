"use client"

import { useEffect, useRef, useState } from "react"
import { Controller, type Control, type FieldErrors } from "react-hook-form"
import { Upload, X, FileText, Eye } from "lucide-react"
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

interface TabGeneralProps {
  control: Control<PriorAuthFormValues>
  errors: FieldErrors<PriorAuthFormValues>
  watch: (field: keyof PriorAuthFormValues) => string
  setValue: (field: keyof PriorAuthFormValues, value: string) => void
  insurances: ClientInsurance[]
  clientId: string
  /** URL de S3 del attachment ya guardado en el servidor (no base64) */
  existingAttachmentUrl?: string | null
  /** Callback para limpiar la URL existente cuando se sube un archivo nuevo */
  onClearExistingAttachment?: () => void
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

export function TabGeneral({
  control,
  errors,
  watch,
  setValue,
  insurances,
  clientId,
  existingAttachmentUrl,
  onClearExistingAttachment,
}: TabGeneralProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [viewerDocument, setViewerDocument] = useState<{ url: string; name: string } | null>(null)

  const startDate = watch("startDate")
  const endDate = watch("endDate")
  const interval = watch("durationInterval")
  const attachmentName = watch("attachmentName")
  const primaryDiagnosisId = watch("primaryDiagnosisId")
  const insuranceId = watch("insuranceId")

  const { diagnoses, isLoading: isLoadingDiagnoses } = useDiagnosesByClient(clientId)

  const diagnosisOptions = diagnoses.map((d) => ({
    value: d.id,
    label: `${d.code} — ${d.name}`,
  }))

  const activeInsurances = insurances.filter((ins) => ins.isActive)

  useEffect(() => {
    if (diagnoses.length === 1 && !primaryDiagnosisId) {
      setValue("primaryDiagnosisId", diagnoses[0].id)
    }
  }, [diagnoses, primaryDiagnosisId, setValue])

  useEffect(() => {
    if (activeInsurances.length === 1 && !insuranceId) {
      setValue("insuranceId", activeInsurances[0].id)
    }
  }, [activeInsurances.length, insuranceId, setValue])

  const duration = calculateDuration(
    startDate,
    endDate,
    interval as "DAYS" | "WEEKS" | "MONTHS"
  )
  const durationDisplay = duration > 0 ? String(duration) : ""

  const insuranceOptions = activeInsurances.map((ins) => ({
    value: ins.id,
    label: ins.payerName,
  }))

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
      setValue("attachment", base64)
      setValue("attachmentName", file.name)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAttachment = () => {
    onClearExistingAttachment?.()
    setValue("attachment", "")
    setValue("attachmentName", "")
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

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Controller
          name="authNumber"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
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
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingSelect
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
          control={control}
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
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <PremiumDatePicker
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
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <PremiumDatePicker
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
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingSelect
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
          control={control}
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
          control={control}
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
        control={control}
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
            <p className="flex-1 text-sm font-medium text-slate-800 truncate"
               title={getFileNameFromUrl(existingAttachmentUrl) ?? "Attachment"}>
              {getFileNameFromUrl(existingAttachmentUrl) ?? "Attachment"}
            </p>
            <button
              type="button"
              onClick={handleViewExisting}
              className={cn(
                "inline-flex items-center gap-1.5 text-sm font-medium text-[#037ECC] hover:text-[#025fa0]",
                "transition-colors duration-150"
              )}
              title="View attachment"
            >
              <Eye className="w-4 h-4" />
              View
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
