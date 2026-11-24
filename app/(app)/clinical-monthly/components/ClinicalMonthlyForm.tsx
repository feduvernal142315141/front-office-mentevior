"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, CalendarRange, ClipboardList, FileDown, Loader2, MessageSquareText, PenTool, User } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/custom/Button"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import { DocumentViewer } from "@/components/custom/DocumentViewer"
import { useClientsByLoggedUser } from "@/lib/modules/clients/hooks/use-clients-by-logged-user"
import { useClinicalMonthlyById } from "@/lib/modules/clinical-monthly/hooks/use-clinical-monthly-by-id"
import { useSaveClinicalMonthly } from "@/lib/modules/clinical-monthly/hooks/use-save-clinical-monthly"
import { ClinicalMonthlySignatureConflictError, getClinicalMonthlyPdfUrl, signClinicalMonthly } from "@/lib/modules/clinical-monthly/services/clinical-monthly.service"
import { CLINICAL_MONTHLY_SUMMARY_GUIDANCE } from "@/lib/constants/clinical-monthly-guidance"
import { getNarrativeLengthState, validateNarrativeLength } from "@/lib/utils/narrative-length"
import { MonthPicker } from "@/components/custom/MonthPicker"
import { currentReportMonth, formatReportMonthShort, parseReportMonth } from "@/lib/utils/report-month"
import { usePermission } from "@/lib/hooks/use-permission"
import { useAuth } from "@/lib/hooks/use-auth"
import { PermissionModule } from "@/lib/utils/permissions-new"
import { ClinicalMonthlySignature } from "./ClinicalMonthlySignature"

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
  const { user } = useAuth()
  const { create, edit } = usePermission()

  const [clientId, setClientId] = useState("")
  const [reportMonth, setReportMonth] = useState(() => (clinicalMonthlyId ? "" : currentReportMonth()))
  const [summary, setSummary] = useState("")
  const [creatorSign, setCreatorSign] = useState<string | null>(null)
  const [coSignerSign, setCoSignerSign] = useState<string | null>(null)
  const [isSigning, setIsSigning] = useState(false)
  const signingRef = useRef(false)
  const [signatureError, setSignatureError] = useState(false)
  const [monthError, setMonthError] = useState<string | null>(null)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)

  const { clients, isLoading: clientsLoading } = useClientsByLoggedUser({ page: 0, pageSize: 200 })
  const { save, clinicalMonthlyId: persistedId, isSaving } = useSaveClinicalMonthly({ clinicalMonthlyId })
  const isEditing = !!persistedId
  const canPersist = isEditing ? edit(PermissionModule.CLINICAL_MONTHLY) : create(PermissionModule.CLINICAL_MONTHLY)
  const { clinicalMonthly, isLoading: detailLoading, error: detailError, refetch } = useClinicalMonthlyById(persistedId)
  const hasUnsavedChanges = !!clinicalMonthly && (
    reportMonth !== parseReportMonth(clinicalMonthly.startMonthYear)
    || summary.trim() !== (clinicalMonthly.summary ?? "").trim()
  )

  const clientOptions = useMemo(
    () => clients.filter((c) => c.fullName).map((c) => ({ value: c.id, label: c.fullName })),
    [clients],
  )

  // Precarga al editar
  useEffect(() => {
    if (!clinicalMonthly) return

    setClientId(clinicalMonthly.clientId)
    setReportMonth(parseReportMonth(clinicalMonthly.startMonthYear) ?? "")
    setSummary(clinicalMonthly.summary ?? "")
    setCreatorSign(clinicalMonthly.creatorSign ?? null)
    setCoSignerSign(clinicalMonthly.coSignerSign ?? null)
  }, [clinicalMonthly])

  // Con un solo cliente no tiene sentido hacer elegir: se autocompleta.
  // Al editar no aplica — el cliente lo fija el reporte y el select está bloqueado.
  useEffect(() => {
    if (isEditing || clientId || clients.length !== 1) return
    setClientId(clients[0].id)
  }, [clients, clientId, isEditing])

  const persist = useCallback(async (): Promise<string | null> => {
    if (!canPersist) return null
    if (!clientId) {
      toast.error("Select a client first")
      return null
    }

    const monthYear = formatReportMonthShort(reportMonth)
    if (!monthYear) {
      const error = "Report month is required"
      setMonthError(error)
      toast.error("Select the report month", { description: error })
      return null
    }
    setMonthError(null)

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

    if (!isEditing && !creatorSign) {
      setSignatureError(true)
      toast.error("The creator signature is required")
      document.querySelector('[data-section="creator-signature"]')?.scrollIntoView({ behavior: "smooth", block: "center" })
      return null
    }
    setSignatureError(false)

    const id = await save({
      clientId,
      startMonthYear: monthYear,
      endMonthYear: monthYear,
      summary: trimmedSummary,
      ...(isEditing ? {} : { creatorSign: creatorSign ?? "" }),
    })
    if (id && isEditing) await refetch()
    return id
  }, [canPersist, clientId, creatorSign, isEditing, refetch, reportMonth, save, summary])

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault()
    const id = await persist()
    if (!id) return
    toast.success(isEditing ? "Clinical Monthly updated" : "Clinical Monthly created")
    router.push("/clinical-monthly")
  }, [isEditing, persist, router])

  // Un reporte guardado se puede revisar sin mutarlo ni invalidar su firma.
  const handlePreview = useCallback(async () => {
    if (persistedId && clinicalMonthly && !hasUnsavedChanges) {
      setPreviewId(persistedId)
      return
    }
    const id = await persist()
    if (id) setPreviewId(id)
  }, [clinicalMonthly, hasUnsavedChanges, persist, persistedId])

  const handleCoSignature = async () => {
    if (!persistedId || !clinicalMonthly?.canSign || !clinicalMonthly.signatureContentHash
      || !coSignerSign || hasUnsavedChanges || !canPersist || signingRef.current) return
    signingRef.current = true
    setIsSigning(true)
    try {
      await signClinicalMonthly(persistedId, coSignerSign, clinicalMonthly.signatureContentHash)
      toast.success("Clinical Monthly signature saved")
      await refetch()
    } catch (error) {
      toast.error("Error signing Clinical Monthly", {
        description: error instanceof Error ? error.message : "Please try again",
      })
      if (error instanceof ClinicalMonthlySignatureConflictError) {
        setCoSignerSign(null)
        await refetch()
      }
    } finally {
      signingRef.current = false
      setIsSigning(false)
    }
  }

  const isBusy = isSaving || detailLoading || isSigning
  const hasMonth = !!reportMonth
  // Crear o guardar cambios exige cliente, período, summary y la firma del autor.
  const canSave = !!clientId && hasMonth && getNarrativeLengthState(summary).isValid
    && (isEditing || !!creatorSign) && !isBusy && canPersist && (!isEditing || !!clinicalMonthly)
  const canPreview = !isBusy && ((!!clinicalMonthly && !hasUnsavedChanges) || canSave)

  if (isEditing && detailLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#037ECC] animate-spin" />
      </div>
    )
  }

  if (isEditing && !clinicalMonthly) {
    return <p className="py-10 text-center text-sm text-red-600">{detailError?.message || "Clinical Monthly not found"}</p>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-32">
      {/* El preview sólo guarda cuando hay cambios o aún no existe el reporte. */}
      <div className="flex items-center justify-end gap-3">
        {clinicalMonthly && (
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${clinicalMonthly.status === "Completed"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-amber-200 bg-amber-50 text-amber-700"}`}>
            {clinicalMonthly.status}
          </span>
        )}
        <Button
          type="button"
          variant="secondary"
          onClick={handlePreview}
          disabled={!canPreview}
          className="gap-2 flex items-center"
        >
          <FileDown className="h-4 w-4" />
          {clinicalMonthly && !hasUnsavedChanges ? "Preview PDF" : "Save & Preview PDF"}
        </Button>
      </div>

      {clinicalMonthly?.status === "Pending" && (
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold">Document Pending Signature</span>
          {clinicalMonthly.coSignerName && ` · Awaiting ${clinicalMonthly.coSignerName}${clinicalMonthly.coSignerRole ? ` (${clinicalMonthly.coSignerRole})` : ""}`}
        </p>
      )}

      {/* ─── Context Header: Recipient + Provider ─── */}
      {clinicalMonthly && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-[#037ECC]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Recipient</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              <div><span className="text-slate-400">Name:</span> <span className="font-medium text-slate-800">{clinicalMonthly.recipientName || clinicalMonthly.clientName}</span></div>
              <div><span className="text-slate-400">Payer:</span> <span className="font-medium text-slate-800">{clinicalMonthly.payer || "—"}</span></div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-[#037ECC]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Provider</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              <div><span className="text-slate-400">Name:</span> <span className="font-medium text-slate-800">{[clinicalMonthly.creatorName, clinicalMonthly.creatorCredential].filter(Boolean).join(", ") || "—"}</span></div>
              <div><span className="text-slate-400">Report month:</span> <span className="font-medium text-slate-800 tabular-nums">{clinicalMonthly.startMonthYear}</span></div>
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
            disabled={clientsLoading || isEditing || !canPersist}
            hasError={!clientId && !!monthError}
            searchable
            required
          />
          <MonthPicker
            label="Report month"
            value={reportMonth}
            onChange={(value) => {
              setReportMonth(value)
              setMonthError(null)
            }}
            required
            hasError={!!monthError}
            disabled={isBusy || !canPersist}
          />
        </div>

        {monthError && (
          <p className="mt-3 text-xs font-medium text-red-500">{monthError}</p>
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
            showCharacterCounter={false}
            disabled={isBusy || !canPersist}
            hasError={!!summaryError}
            required
          />
          {summaryError && (
            <p className="mt-1.5 text-xs font-medium text-red-500">{summaryError}</p>
          )}
        </div>
      </Section>

      <Section
        icon={<PenTool className="h-4 w-4" />}
        title="Signature"
        subtitle={isEditing ? "Signature saved with this report" : "Sign the report as its creator"}
      >
        <ClinicalMonthlySignature
          memberUserId={user?.id ?? null}
          providerName={clinicalMonthly?.creatorName}
          signature={creatorSign}
          onChange={(value) => {
            setCreatorSign(value)
            if (value) setSignatureError(false)
          }}
          disabled={isEditing || isBusy || !user?.id}
          hasError={signatureError}
        />
      </Section>

      {clinicalMonthly?.requiresCoSignature && (
        <Section
          icon={<PenTool className="h-4 w-4" />}
          title="Other provider signature"
          subtitle={clinicalMonthly.coSignerSignedAt
            ? `Signed on ${new Date(clinicalMonthly.coSignerSignedAt).toLocaleDateString()}`
            : `Pending ${clinicalMonthly.coSignerRole || "provider"} signature`}
        >
          <div className="space-y-4">
            <ClinicalMonthlySignature
              role="coSigner"
              professionalRole={clinicalMonthly.coSignerRole}
              providerName={clinicalMonthly.coSignerName}
              memberUserId={clinicalMonthly.coSignerId ?? null}
              signature={coSignerSign}
              onChange={setCoSignerSign}
              disabled={!clinicalMonthly.canSign || !clinicalMonthly.signatureContentHash || isBusy || !canPersist}
            />
            {clinicalMonthly.coSignerSignedAt && hasUnsavedChanges && (
              <p className="text-sm text-amber-700">Saving changes will require the other provider to sign again.</p>
            )}
            {clinicalMonthly.canSign && (
              <div className="space-y-2">
                {hasUnsavedChanges && (
                  <p className="text-sm text-amber-700">Save or discard your changes before signing the report.</p>
                )}
                <Button
                  type="button"
                  onClick={handleCoSignature}
                  loading={isSigning}
                  disabled={!coSignerSign || !clinicalMonthly.signatureContentHash || isBusy || hasUnsavedChanges || !canPersist}
                >
                  Sign Clinical Monthly
                </Button>
              </div>
            )}
          </div>
        </Section>
      )}

      {canPersist ? (
        <FormBottomBar
          isSubmitting={isSaving || isSigning}
          onCancel={() => router.push("/clinical-monthly")}
          submitText={isEditing ? "Update Clinical Monthly" : "Create Clinical Monthly"}
          disabled={!canSave}
        />
      ) : (
        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={() => router.push("/clinical-monthly")}>
            Back to Clinical Monthly
          </Button>
        </div>
      )}

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
