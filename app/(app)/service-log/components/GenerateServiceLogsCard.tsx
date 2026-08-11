"use client"

import { useState } from "react"
import { format } from "date-fns"
import { FileStack, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/custom/Button"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { SectionCard } from "@/components/custom/SectionCard"
import { parseLocalDate } from "@/lib/date"
import { useAlert } from "@/lib/contexts/alert-context"
import { useCreateServiceLogs } from "@/lib/modules/service-log/hooks/use-create-service-logs"

function formatRangeDate(value: string): string {
  try {
    return format(parseLocalDate(value), "MM/dd/yyyy")
  } catch {
    return value
  }
}

/**
 * Generación de Service Logs por rango de fechas.
 *
 * El POST genera para **toda la compañía** (una cabecera por combinación
 * cliente/provider con servicios en el período), por eso la confirmación lo
 * dice explícitamente. El procesamiento es asíncrono: el 200 solo confirma que
 * la solicitud quedó encolada.
 */
interface GenerateServiceLogsCardProps {
  /** Se llama tras encolar con éxito, para que la página refresque el listado */
  onGenerated?: () => void
}

export function GenerateServiceLogsCard({ onGenerated }: GenerateServiceLogsCardProps) {
  const alert = useAlert()
  const { create, isCreating } = useCreateServiceLogs()

  const [initDate, setInitDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [errors, setErrors] = useState<{ initDate?: string; endDate?: string }>({})

  const handleGenerate = () => {
    const newErrors: { initDate?: string; endDate?: string } = {}
    if (!initDate) newErrors.initDate = "Select a start date"
    if (!endDate) newErrors.endDate = "Select an end date"
    if (initDate && endDate && initDate > endDate) {
      newErrors.endDate = "End date must be after the start date"
    }
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    alert.confirm({
      title: "Generate Service Logs",
      description:
        `Service logs will be generated for every client and provider with services between ` +
        `${formatRangeDate(initDate)} and ${formatRangeDate(endDate)}. ` +
        `Generated logs cannot be deleted, and overlapping ranges are rejected.`,
      confirmText: "Generate",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await create({ initDate, endDate })
          toast.success("Service log generation queued — logs will be available shortly")
          setInitDate("")
          setEndDate("")
          onGenerated?.()
        } catch (err) {
          // El 422 trae el motivo exacto (rango inválido o solapado): se muestra tal cual
          toast.error(err instanceof Error ? err.message : "Failed to queue service log generation")
        }
      },
    })
  }

  return (
    <SectionCard
      icon={<FileStack className="h-4 w-4" />}
      title="Generate Service Logs"
      subtitle="One log per client/provider pair with services in the range"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PremiumDatePicker
            label="From"
            value={initDate}
            onChange={(v) => {
              setInitDate(v)
              setErrors((prev) => ({ ...prev, initDate: undefined }))
            }}
            hasError={!!errors.initDate}
            errorMessage={errors.initDate}
            required
            disabled={isCreating}
          />
          <PremiumDatePicker
            label="To"
            value={endDate}
            onChange={(v) => {
              setEndDate(v)
              setErrors((prev) => ({ ...prev, endDate: undefined }))
            }}
            hasError={!!errors.endDate}
            errorMessage={errors.endDate}
            required
            disabled={isCreating}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            Both dates are inclusive. Only appointments with a session note are included; rows
            appear in the document once their note is locked for billing.
          </p>
          <Button onClick={handleGenerate} disabled={isCreating} className="shrink-0 gap-2">
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileStack className="h-4 w-4" />}
            Generate
          </Button>
        </div>
      </div>
    </SectionCard>
  )
}
