"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  Building2,
  ClipboardCheck,
  ClipboardList,
  FileDown,
  Loader2,
  ListChecks,
  Lock,
  PenTool,
  User,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/custom/Button"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import { DocumentViewer } from "@/components/custom/DocumentViewer"
import { useClientsByLoggedUser } from "@/lib/modules/clients/hooks/use-clients-by-logged-user"
import { useUsers } from "@/lib/modules/users/hooks/use-users"
import { useMonthlySupervisionContext } from "@/lib/modules/monthly-supervision/hooks/use-monthly-supervision-context"
import { useSupervisionOptionCatalogs } from "@/lib/modules/monthly-supervision/hooks/use-supervision-option-catalogs"
import { useSaveMonthlySupervision } from "@/lib/modules/monthly-supervision/hooks/use-save-monthly-supervision"
import { getMonthlySupervisionPdfUrl } from "@/lib/modules/monthly-supervision/services/monthly-supervision.service"
import {
  currentReportMonth,
  formatReportMonthLong,
  toApiReportDate,
} from "@/lib/modules/monthly-supervision/utils/report-month"
import type { SupervisionAppointment } from "@/lib/types/monthly-supervision.types"
import { MonthPicker } from "./MonthPicker"
import { SupervisionAppointmentsTable } from "./SupervisionAppointmentsTable"
import { SupervisionOptionsChecklist } from "./SupervisionOptionsChecklist"
import { SupervisionSignatures } from "./SupervisionSignatures"

interface MonthlySupervisionFormProps {
  /** Presente al editar un reporte existente */
  monthlySupervisionId?: string
}

export function MonthlySupervisionForm({ monthlySupervisionId }: MonthlySupervisionFormProps) {
  const router = useRouter()
  const isEditing = !!monthlySupervisionId

  const [clientId, setClientId] = useState("")
  const [providerId, setProviderId] = useState("")
  const [reportMonth, setReportMonth] = useState(() => (monthlySupervisionId ? "" : currentReportMonth()))

  const [documentOptionIds, setDocumentOptionIds] = useState<string[]>([])
  const [appliedOptionIds, setAppliedOptionIds] = useState<string[]>([])
  const [otherAppliedOption, setOtherAppliedOption] = useState("")
  const [appointments, setAppointments] = useState<SupervisionAppointment[]>([])
  const [supervisorSign, setSupervisorSign] = useState<string | null>(null)
  const [superviseeSign, setSuperviseeSign] = useState<string | null>(null)

  const [invalidAppointmentIds, setInvalidAppointmentIds] = useState<string[]>([])
  const [signatureError, setSignatureError] = useState(false)
  const [previewId, setPreviewId] = useState<string | null>(null)

  const { clients, isLoading: clientsLoading } = useClientsByLoggedUser({ page: 0, pageSize: 200 })
  const { users: allUsers } = useUsers({ pageSize: 100 })
  const catalogs = useSupervisionOptionCatalogs()

  const { context, isLoading: contextLoading, error: contextError } = useMonthlySupervisionContext({
    monthlySupervisionId,
    clientId,
    providerId,
    reportMonth,
  })

  const { save, isSaving } = useSaveMonthlySupervision({ monthlySupervisionId })

  const clientOptions = useMemo(
    () => clients.filter((c) => c.fullName).map((c) => ({ value: c.id, label: c.fullName })),
    [clients],
  )

  const providerOptions = useMemo(
    () =>
      allUsers
        .filter((u) => u.active && !u.terminated)
        .map((u) => ({ value: u.id, label: u.fullName })),
    [allUsers],
  )

  // Con un solo cliente no tiene sentido hacer elegir
  useEffect(() => {
    if (isEditing || clientId || clients.length !== 1) return
    setClientId(clients[0].id)
  }, [clients, clientId, isEditing])

  /**
   * Precarga desde el backend.
   *
   * Se vuelca todo lo que vino: los appointments del mes, las opciones marcadas
   * y las firmas. Al crear, `documentOptionCatalogIds` no viene y las listas
   * quedan vacías, que es lo correcto para un reporte nuevo.
   */
  useEffect(() => {
    if (!context) return

    setAppointments(context.appointments)
    setSupervisorSign(context.supervisorSign ?? null)
    setSuperviseeSign(context.superviseeSign ?? null)

    if (context.documentOptionCatalogIds) setDocumentOptionIds(context.documentOptionCatalogIds)
    if (context.appliedOptionCatalogIds) setAppliedOptionIds(context.appliedOptionCatalogIds)
    if (context.otherAppliedOption !== undefined) setOtherAppliedOption(context.otherAppliedOption)

    // Al editar, el trío viene del propio reporte
    if (isEditing) {
      if (context.clientId) setClientId(context.clientId)
      if (context.providerId) setProviderId(context.providerId)
      if (context.requestedReportDate) setReportMonth(context.requestedReportDate)
    }
  }, [context, isEditing])

  /**
   * 🔴 La guarda de R3.
   *
   * El `PUT` **reemplaza** appointments y opciones. Si el detalle no devolvió lo
   * que ya estaba guardado, guardar mandaría vacíos y borraría el trabajo del
   * analista sin un solo error. Antes que ofrecer un botón que destruye datos,
   * se bloquea el guardado y se dice por qué.
   *
   * Es una guarda que se desactiva sola: el día que el backend devuelva los
   * campos, `completeness` da `true` y la edición se habilita sin tocar código.
   */
  const editGuard = useMemo(() => {
    if (!isEditing || !context) return null

    const missing: string[] = []
    if (!context.completeness.identifiers) missing.push("the client and supervisee ids")
    if (!context.completeness.options) missing.push("the selected document and applied options")
    if (!context.completeness.evaluations) missing.push("each session's mode, structure and evaluation")

    return missing.length > 0 ? missing : null
  }, [isEditing, context])

  const isBlocked = !!editGuard

  const handleAppointmentChange = useCallback(
    (appointmentId: string, field: "mode" | "structure" | "evaluation", value: string) => {
      setAppointments((current) =>
        current.map((item) =>
          item.appointmentId === appointmentId ? { ...item, [field]: value } : item,
        ),
      )
      setInvalidAppointmentIds((current) => current.filter((id) => id !== appointmentId))
    },
    [],
  )

  const toggleId = (setter: React.Dispatch<React.SetStateAction<string[]>>) =>
    (id: string, checked: boolean) => {
      setter((current) => (checked ? [...current, id] : current.filter((entry) => entry !== id)))
    }

  const persist = useCallback(async (): Promise<string | null> => {
    // Cinturón: el botón ya está deshabilitado, pero un Enter dentro del form
    // dispara submit igual, y acá se estaría guardando encima de datos que no
    // se pudieron precargar.
    if (isBlocked) {
      toast.error("This report can't be saved", {
        description: "The server didn't return everything the update needs.",
      })
      return null
    }

    if (!clientId || !providerId || !reportMonth) {
      toast.error("Select client, supervisee and month first")
      return null
    }

    if (appointments.length === 0) {
      toast.error("There are no supervisions to report", {
        description: "The backend requires at least one 97155 appointment.",
      })
      return null
    }

    // Los tres campos son obligatorios porque el PDF los imprime en la tabla:
    // una fila a medias sale con huecos en un documento clínico.
    const incomplete = appointments
      .filter((item) => !item.mode || !item.structure || !item.evaluation)
      .map((item) => item.appointmentId)

    if (incomplete.length > 0) {
      setInvalidAppointmentIds(incomplete)
      toast.error("Complete every supervision", {
        description: `${incomplete.length} ${incomplete.length === 1 ? "session is" : "sessions are"} missing mode, structure or evaluation.`,
      })
      document.querySelector("[data-section='appointments']")?.scrollIntoView({ behavior: "smooth", block: "start" })
      return null
    }
    setInvalidAppointmentIds([])

    if (!supervisorSign || !superviseeSign) {
      setSignatureError(true)
      toast.error("Both signatures are required")
      document.querySelector("[data-section='signatures']")?.scrollIntoView({ behavior: "smooth", block: "center" })
      return null
    }
    setSignatureError(false)

    return save({
      clientId,
      providerId,
      requestedReportDate: toApiReportDate(reportMonth),
      otherAppliedOption: otherAppliedOption.trim(),
      // Las horas las calcula el backend; se reenvían tal cual llegaron para no
      // introducir una segunda fuente de verdad.
      totalHoursWorked: context?.totalHoursWorked ?? 0,
      supervisedHours: context?.supervisedHours ?? 0,
      supervisorSign,
      superviseeSign,
      documentOptionCatalogIds: documentOptionIds,
      appliedOptionCatalogIds: appliedOptionIds,
      appointments: appointments.map((item) => ({
        appointmentId: item.appointmentId,
        mode: item.mode ?? "",
        structure: item.structure ?? "",
        evaluation: item.evaluation ?? "",
      })),
    })
  }, [
    isBlocked, clientId, providerId, reportMonth, appointments, supervisorSign, superviseeSign,
    otherAppliedOption, documentOptionIds, appliedOptionIds, context, save,
  ])

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault()
    const id = await persist()
    if (!id) return
    toast.success(isEditing ? "Monthly Supervision updated" : "Monthly Supervision created")
    router.push("/monthly-supervisions")
  }, [isEditing, persist, router])

  // Generar el PDF exige que el registro exista, así que previsualizar guarda antes
  const handlePreview = useCallback(async () => {
    if (isBlocked && monthlySupervisionId) {
      setPreviewId(monthlySupervisionId)
      return
    }
    const id = await persist()
    if (id) setPreviewId(id)
  }, [isBlocked, monthlySupervisionId, persist])

  const hasSelection = !!clientId && !!providerId && !!reportMonth
  const isBusy = isSaving || contextLoading
  const canSave = hasSelection && appointments.length > 0 && !isBusy && !isBlocked

  if (isEditing && contextLoading && !context) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#037ECC]" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-32">
      {/* ─── Guarda de edición: ver R3 ─── */}
      {editGuard && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <div className="flex gap-3">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-[#d03b3b]" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-red-700">Editing is disabled for this report</p>
              <p className="mt-1 text-sm text-red-600">
                The server didn&apos;t return {editGuard.join(", ")}. Saving now would replace what
                is stored with empty values, so the form is locked until the backend returns the
                full report. You can still view the PDF.
              </p>
            </div>
          </div>
        </div>
      )}

      {catalogs.isUnavailable && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-amber-800">Option catalogs are unavailable</p>
              <p className="mt-1 text-sm text-amber-700">
                Documents reviewed and applied activities can&apos;t be selected right now. The rest
                of the report still works.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={handlePreview}
          disabled={isBlocked ? !monthlySupervisionId : !canSave}
          className="flex items-center gap-2"
        >
          <FileDown className="h-4 w-4" />
          {isBlocked ? "Preview PDF" : "Save & Preview PDF"}
        </Button>
      </div>

      {/* ─── Report Setup ─── */}
      <Section
        icon={<ClipboardList className="h-4 w-4" />}
        title="Report Setup"
        subtitle="Client, supervisee and month"
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <FloatingSelect
            label="Client"
            value={clientId}
            onChange={setClientId}
            options={clientOptions}
            disabled={clientsLoading || isEditing}
            searchable
            required
          />
          <FloatingSelect
            label="Supervisee"
            value={providerId}
            onChange={setProviderId}
            options={providerOptions}
            disabled={isEditing}
            searchable
            required
          />
          <MonthPicker value={reportMonth} onChange={setReportMonth} disabled={isEditing || isBusy} />
        </div>

        {isEditing && (
          <p className="mt-3 text-xs text-slate-400">
            Client, supervisee and month can&apos;t be changed on an existing report.
          </p>
        )}

        {contextError && (
          <p className="mt-3 text-xs font-medium text-red-500">{contextError.message}</p>
        )}
      </Section>

      {/* ─── Contexto ─── */}
      {context && hasSelection && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ContextCard
            icon={<User className="h-4 w-4 text-[#037ECC]" />}
            title="Recipient"
            rows={[
              { label: "Client", value: context.clientName || "—" },
              { label: "Period", value: formatReportMonthLong(reportMonth) },
            ]}
          />
          <ContextCard
            icon={<Building2 className="h-4 w-4 text-[#037ECC]" />}
            title="Supervision"
            rows={[
              {
                label: "Supervisor",
                value: context.supervisor.name
                  ? `${context.supervisor.name}${context.supervisor.credentials ? ` · ${context.supervisor.credentials}` : ""}`
                  : "—",
              },
              { label: "Supervisee", value: context.supervisee.name || "—" },
              {
                label: "Hours",
                value: `${formatHours(context.supervisedHours)} supervised of ${formatHours(context.totalHoursWorked)} worked`,
              },
            ]}
          />
        </div>
      )}

      {/* ─── Supervisiones del mes ─── */}
      <div data-section="appointments">
        <Section
          icon={<ClipboardCheck className="h-4 w-4" />}
          title="Supervisions"
          subtitle={appointments.length > 0 ? `${appointments.length} this month` : undefined}
        >
          {contextLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-[#037ECC]" />
            </div>
          ) : !hasSelection ? (
            <p className="py-10 text-center text-sm text-slate-400">
              Pick a client, a supervisee and a month to load the supervisions.
            </p>
          ) : (
            <SupervisionAppointmentsTable
              appointments={appointments}
              onChange={handleAppointmentChange}
              disabled={isBusy || isBlocked}
              invalidIds={invalidAppointmentIds}
            />
          )}
        </Section>
      </div>

      {/* ─── Opciones ─── */}
      {!catalogs.isUnavailable && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <Section
            icon={<ListChecks className="h-4 w-4" />}
            title="Documents Reviewed"
            subtitle="Supervisee records checked this month"
          >
            <SupervisionOptionsChecklist
              options={catalogs.documentOptions}
              selectedIds={documentOptionIds}
              onToggle={toggleId(setDocumentOptionIds)}
              disabled={isBusy || isBlocked}
            />
          </Section>

          <Section
            icon={<ListChecks className="h-4 w-4" />}
            title="Applied During Supervision"
            subtitle="Activities carried out"
          >
            <SupervisionOptionsChecklist
              options={catalogs.appliedOptions}
              selectedIds={appliedOptionIds}
              onToggle={toggleId(setAppliedOptionIds)}
              disabled={isBusy || isBlocked}
              otherValue={otherAppliedOption}
              onOtherChange={setOtherAppliedOption}
            />
          </Section>
        </div>
      )}

      {/* ─── Firmas ─── */}
      <div data-section="signatures">
        <Section icon={<PenTool className="h-4 w-4" />} title="Signatures">
          <SupervisionSignatures
            supervisorName={context?.supervisor.name ?? ""}
            supervisorCredentials={context?.supervisor.credentials}
            superviseeName={context?.supervisee.name ?? ""}
            supervisorSign={supervisorSign}
            superviseeSign={superviseeSign}
            onSupervisorSignChange={(value) => { setSupervisorSign(value); setSignatureError(false) }}
            onSuperviseeSignChange={(value) => { setSuperviseeSign(value); setSignatureError(false) }}
            disabled={isBusy || isBlocked}
            hasError={signatureError}
          />
        </Section>
      </div>

      <FormBottomBar
        isSubmitting={isSaving}
        onCancel={() => router.push("/monthly-supervisions")}
        submitText={isEditing ? "Update Monthly Supervision" : "Create Monthly Supervision"}
        disabled={!canSave}
      />

      {previewId && (
        <DocumentViewer
          open
          onClose={() => setPreviewId(null)}
          documentUrl={getMonthlySupervisionPdfUrl(previewId)}
          fileName="Monthly Supervision.pdf"
        />
      )}
    </form>
  )
}

function formatHours(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 })
}

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#037ECC]/10 text-[#037ECC]">
          {icon}
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {subtitle && <span className="truncate text-xs text-slate-400">{subtitle}</span>}
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function ContextCard({
  icon,
  title,
  rows,
}: {
  icon: React.ReactNode
  title: string
  rows: { label: string; value: string }[]
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
      </div>
      <div className="space-y-1.5 text-sm">
        {rows.map((row) => (
          <div key={row.label}>
            <span className="text-slate-400">{row.label}:</span>{" "}
            <span className="font-medium text-slate-800">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
