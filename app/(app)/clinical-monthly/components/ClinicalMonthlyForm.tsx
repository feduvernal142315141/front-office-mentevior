"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, CalendarRange, ClipboardList, FileDown, Loader2, MessageSquareText, User } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/custom/Button"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import { DocumentViewer } from "@/components/custom/DocumentViewer"
import { useClientsByLoggedUser } from "@/lib/modules/clients/hooks/use-clients-by-logged-user"
import { useClinicalMonthlyById } from "@/lib/modules/clinical-monthly/hooks/use-clinical-monthly-by-id"
import { useSaveClinicalMonthly } from "@/lib/modules/clinical-monthly/hooks/use-save-clinical-monthly"
import { getClinicalMonthlyPdfUrl } from "@/lib/modules/clinical-monthly/services/clinical-monthly.service"
import { validateMonthRange } from "@/lib/modules/clinical-monthly/utils/month-range"
import { CLINICAL_MONTHLY_SUMMARY_GUIDANCE } from "@/lib/constants/clinical-monthly-guidance"
import { getNarrativeLengthState, validateNarrativeLength } from "@/lib/utils/narrative-length"
import { MonthRangePicker } from "./MonthRangePicker"

interface ClinicalMonthlyFormProps {
  /** Presente al editar un reporte existente */
  clinicalMonthlyId?: string
}

/**
 * El reporte se arma en el PDF a partir del Service Plan del cliente, así que el
 * formulario sólo captura lo que no se puede derivar: cliente, período y un
 * comentario único. Los textos por item se retiraron —ver
 * `docs/clinical-monthly-summary-backend.md`.
 */
export function ClinicalMonthlyForm({ clinicalMonthlyId }: ClinicalMonthlyFormProps) {
  const router = useRouter()
  const isEditing = !!clinicalMonthlyId

  const [clientId, setClientId] = useState("")
  const [startMonthYear, setStartMonthYear] = useState("")
  const [endMonthYear, setEndMonthYear] = useState("")
  const [summary, setSummary] = useState("")
  const [rangeError, setRangeError] = useState<string | null>(null)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)

  // Se fija una vez: el año de referencia no debería cambiar mientras el form vive
  const [currentYear] = useState(() => new Date().getFullYear())

  const { clients, isLoading: clientsLoading } = useClientsByLoggedUser({ page: 0, pageSize: 200 })
  const { clinicalMonthly, isLoading: detailLoading } = useClinicalMonthlyById(clinicalMonthlyId)
  const { save, isSaving } = useSaveClinicalMonthly({ clinicalMonthlyId })

  const clientOptions = useMemo(
    () => clients.filter((c) => c.fullName).map((c) => ({ value: c.id, label: c.fullName })),
    [clients],
  )

  // Precarga al editar
  useEffect(() => {
    if (!clinicalMonthly) return

    setClientId(clinicalMonthly.clientId)
    setStartMonthYear(clinicalMonthly.startMonthYear)
    setEndMonthYear(clinicalMonthly.endMonthYear)
    setSummary(clinicalMonthly.summary ?? "")
  }, [clinicalMonthly])

  // Con un solo cliente no tiene sentido hacer elegir: se autocompleta.
  // Al editar no aplica — el cliente lo fija el reporte y el select está bloqueado.
  useEffect(() => {
    if (isEditing || clientId || clients.length !== 1) return
    setClientId(clients[0].id)
  }, [clients, clientId, isEditing])

  const handleRangeChange = useCallback((start: string, end: string) => {
    setStartMonthYear(start)
    setEndMonthYear(end)
    setRangeError(null)
  }, [])

  const persist = useCallback(async (): Promise<string | null> => {
    if (!clientId) {
      toast.error("Select a client first")
      return null
    }

    const error = validateMonthRange(startMonthYear, endMonthYear)
    setRangeError(error)
    if (error) {
      toast.error("Check the report range", { description: error })
      return null
    }

    // El Summary es el único contenido que escribe el usuario: sin él el reporte
    // no aporta nada sobre lo que ya genera el PDF. Se le exige la misma
    // extensión clínica que a los narrative de las session notes.
    const trimmedSummary = summary.trim()
    const lengthError = validateNarrativeLength(trimmedSummary)
    if (lengthError) {
      setSummaryError(lengthError)
      toast.error("Check the summary", { description: lengthError })
      document.querySelector('[data-field="summary"]')?.scrollIntoView({ behavior: "smooth", block: "center" })
      return null
    }
    setSummaryError(null)

    // Sin `items`: el formulario ya no los captura. Se omite la clave en vez de
    // mandar `[]` para no disparar el borrado lógico del PUT sobre reportes viejos.
    return save({ clientId, startMonthYear, endMonthYear, summary: trimmedSummary })
  }, [clientId, endMonthYear, save, startMonthYear, summary])

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault()
    const id = await persist()
    if (!id) return
    toast.success(isEditing ? "Clinical Monthly updated" : "Clinical Monthly created")
    router.push("/clinical-monthly")
  }, [isEditing, persist, router])

  // Generar el PDF exige que el registro exista, así que previsualizar guarda primero
  const handlePreview = useCallback(async () => {
    const id = await persist()
    if (id) setPreviewId(id)
  }, [persist])

  const isBusy = isSaving || detailLoading
  const hasRange = !!startMonthYear && !!endMonthYear
  // Guardar y previsualizar son la misma operación (el preview persiste), así que
  // ambos exigen lo mismo: cliente, período y summary.
  const canSave = !!clientId && hasRange && getNarrativeLengthState(summary).isValid && !isBusy

  if (isEditing && detailLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#037ECC] animate-spin" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-32">
      {/* ─── Preview: exige guardar antes, el PDF sale de un registro existente ─── */}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={handlePreview}
          disabled={!canSave}
          className="gap-2 flex items-center"
        >
          <FileDown className="h-4 w-4" />
          Save &amp; Preview PDF
        </Button>
      </div>

      {/* ─── Context Header: Recipient + Provider ─── */}
      {clinicalMonthly && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-[#037ECC]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Recipient</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              <div><span className="text-slate-400">Name:</span> <span className="font-medium text-slate-800">{clinicalMonthly.recipientName || clinicalMonthly.clientName}</span></div>
              <div><span className="text-slate-400">Payer:</span> <span className="font-medium text-slate-800">{clinicalMonthly.payer || "—"}</span></div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-[#037ECC]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Provider</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              <div><span className="text-slate-400">Name:</span> <span className="font-medium text-slate-800">{clinicalMonthly.providerName || "—"}</span></div>
              <div><span className="text-slate-400">Period:</span> <span className="font-medium text-slate-800 tabular-nums">{clinicalMonthly.startMonthYear} – {clinicalMonthly.endMonthYear}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Report Setup ─── */}
      <Section
        icon={<ClipboardList className="h-4 w-4" />}
        title="Report Setup"
        subtitle="Client and reporting period"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FloatingSelect
            label="Client"
            value={clientId}
            onChange={setClientId}
            options={clientOptions}
            disabled={clientsLoading || isEditing}
            hasError={!clientId && !!rangeError}
            searchable
            required
          />
          <MonthRangePicker
            startValue={startMonthYear}
            endValue={endMonthYear}
            onChange={handleRangeChange}
            currentYear={currentYear}
            hasError={!!rangeError}
            disabled={isBusy}
          />
        </div>

        {rangeError && (
          <p className="mt-3 text-xs font-medium text-red-500">{rangeError}</p>
        )}
        {isEditing && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <CalendarRange className="h-3.5 w-3.5" />
            The client cannot be changed on an existing report.
          </p>
        )}
      </Section>

      {/* ─── Summary ─── */}
      <Section
        icon={<MessageSquareText className="h-4 w-4" />}
        title="Summary"
        subtitle="Everything else is generated in the PDF from the client's service plan"
      >
        <div data-field="summary">
          <FloatingTextarea
            label="Summary"
            value={summary}
            onChange={(v) => { setSummary(v); if (!validateNarrativeLength(v)) setSummaryError(null) }}
            onBlur={() => {}}
            guidance={CLINICAL_MONTHLY_SUMMARY_GUIDANCE}
            rows={10}
            showLengthCounter
            disabled={isBusy}
            hasError={!!summaryError}
            required
          />
          {summaryError && (
            <p className="mt-1.5 text-xs font-medium text-red-500">{summaryError}</p>
          )}
        </div>
      </Section>

      <FormBottomBar
        isSubmitting={isSaving}
        onCancel={() => router.push("/clinical-monthly")}
        submitText={isEditing ? "Update Clinical Monthly" : "Create Clinical Monthly"}
        disabled={!canSave}
      />

      {previewId && (
        <DocumentViewer
          open
          onClose={() => setPreviewId(null)}
          documentUrl={getClinicalMonthlyPdfUrl(previewId)}
          fileName="Clinical Monthly.pdf"
        />
      )}
    </form>
  )
}

function Section({ icon, title, subtitle, children }: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-slate-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#037ECC]/10 text-[#037ECC]">{icon}</div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}
