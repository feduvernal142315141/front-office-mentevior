"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
import { useAuth } from "@/lib/hooks/use-auth"
import { usePermission } from "@/lib/hooks/use-permission"
import { PermissionAction, PermissionModule } from "@/lib/utils/permissions-new"
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
import { MonthPicker } from "@/components/custom/MonthPicker"
import { SupervisionAppointmentsTable } from "./SupervisionAppointmentsTable"
import { ManualSupervisionModal, type ManualSupervisionDraft } from "./ManualSupervisionModal"
import { ManualSupervisionsTable } from "./ManualSupervisionsTable"
import { SupervisionOptionsChecklist } from "./SupervisionOptionsChecklist"
import { SupervisionEditableOptionsTable } from "./SupervisionEditableOptionsTable"
import { MonthlySupervisionRequirementsTable } from "./MonthlySupervisionRequirementsTable"
import { SupervisionSignatures } from "./SupervisionSignatures"

interface MonthlySupervisionFormProps {
  /** Presente al editar un reporte existente */
  monthlySupervisionId?: string
}

const ADMINISTRATION_MEMBER_USER_TYPE_ID = "2f7af3a7-7080-40cb-9792-4676f1ebb01a"

function hoursBetween(start?: string, end?: string): number {
  if (!start || !end) return 0
  const [startHour, startMinute] = start.slice(0, 5).split(":").map(Number)
  const [endHour, endMinute] = end.slice(0, 5).split(":").map(Number)
  const minutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute)
  return minutes > 0 ? minutes / 60 : 0
}

export function MonthlySupervisionForm({ monthlySupervisionId }: MonthlySupervisionFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { can } = usePermission()
  const isEditing = !!monthlySupervisionId

  const [clientId, setClientId] = useState("")
  const [providerId, setProviderId] = useState("")
  const [reportMonth, setReportMonth] = useState(() => (monthlySupervisionId ? "" : currentReportMonth()))

  const [documentOptionIds, setDocumentOptionIds] = useState<string[]>([])
  const [appliedOptionIds, setAppliedOptionIds] = useState<string[]>([])
  const [otherAppliedOption, setOtherAppliedOption] = useState("")
  const [appointments, setAppointments] = useState<SupervisionAppointment[]>([])
  const [manualModalOpen, setManualModalOpen] = useState(false)
  const [manualDraft, setManualDraft] = useState<ManualSupervisionDraft | null>(null)
  const [supervisorSign, setSupervisorSign] = useState<string | null>(null)
  const [superviseeSign, setSuperviseeSign] = useState<string | null>(null)
  const [supervisionConducted, setSupervisionConducted] = useState<string[]>([])
  const [itemsEvaluated, setItemsEvaluated] = useState<string[]>([])
  const optionSeedKeyRef = useRef("")

  const [invalidAppointmentIds, setInvalidAppointmentIds] = useState<string[]>([])
  const [signatureError, setSignatureError] = useState(false)
  const [previewId, setPreviewId] = useState<string | null>(null)

  const { clients, isLoading: clientsLoading } = useClientsByLoggedUser({ page: 0, pageSize: 200 })
  const { users: allUsers } = useUsers({ pageSize: 100 })
  const catalogs = useSupervisionOptionCatalogs({ loadCustomOptions: !isEditing })

  const { context, isLoading: contextLoading, error: contextError } = useMonthlySupervisionContext({
    monthlySupervisionId,
    clientId,
    providerId,
    reportMonth,
  })

  const { save, sign, isSaving } = useSaveMonthlySupervision({ monthlySupervisionId })

  const hasMonthlySupervisionSignPermission = can(
    PermissionModule.MONTHLY_SUPERVISIONS,
    PermissionAction.SIGN,
  )
  const hasMonthlySupervisionEditPermission = can(
    PermissionModule.MONTHLY_SUPERVISIONS,
    PermissionAction.EDIT,
  )
  const isReadOnly = isEditing && !hasMonthlySupervisionEditPermission
  const normalizedRole = user?.role?.trim().toLowerCase()
  const isPrivilegedSigner =
    normalizedRole === "superadmin" ||
    normalizedRole === "admin" ||
    normalizedRole === "administrator" ||
    user?.memberUserTypes.includes(ADMINISTRATION_MEMBER_USER_TYPE_ID) === true
  // La firma del supervisor requiere EDIT; SIGN sólo habilita la firma propia
  // del supervisee (o la de un usuario administrativo).
  const canEditSupervisorSignature =
    hasMonthlySupervisionEditPermission &&
    (!!user?.id && !!providerId && (user.id !== providerId || isPrivilegedSigner))
  const canEditSuperviseeSignature =
    hasMonthlySupervisionSignPermission &&
    (!!user?.id && !!providerId && (user.id === providerId || isPrivilegedSigner))

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

  const optionSeedKey = monthlySupervisionId ? `existing:${monthlySupervisionId}` : "new"

  useEffect(() => {
    if (!optionSeedKey || optionSeedKeyRef.current === optionSeedKey) return
    if (isEditing && !context) return

    const storedConducted = splitEditableOptions(context?.supervisionConducted)
    const storedEvaluated = splitEditableOptions(context?.itemsEvaluated)
    const catalogsLoaded = catalogs.conductedOptions.length > 0 && catalogs.evaluationOptions.length > 0
    if (!isEditing && (!storedConducted.length || !storedEvaluated.length) && !catalogsLoaded) return

    optionSeedKeyRef.current = optionSeedKey
    setSupervisionConducted(
      storedConducted.length > 0 ? storedConducted : catalogs.conductedOptions.map((option) => option.name),
    )
    setItemsEvaluated(
      storedEvaluated.length > 0 ? storedEvaluated : catalogs.evaluationOptions.map((option) => option.name),
    )
  }, [context, optionSeedKey, catalogs.conductedOptions, catalogs.evaluationOptions, isEditing])

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
    (appointmentId: string, field: "mode" | "structure" | "evaluation" | "observedWithClient" | "date" | "timeStart" | "timeEnd" | "supervisionNotes", value: string) => {
      const nextValue = field === "observedWithClient" ? value === "yes" : value
      setAppointments((current) =>
        current.map((item) =>
          item.id === appointmentId ? { ...item, [field]: nextValue } : item,
        ),
      )
      setInvalidAppointmentIds((current) => current.filter((id) => id !== appointmentId))
    },
    [],
  )

  const addManualAppointment = useCallback(() => {
    setManualDraft(null)
    setManualModalOpen(true)
  }, [])

  const saveManualAppointment = useCallback((draft: ManualSupervisionDraft) => {
    const id = draft.id ?? `manual-${Date.now()}`
    const appointment: SupervisionAppointment = {
      id,
      appointmentId: undefined,
      isManual: true,
      date: draft.date,
      timeStart: draft.timeStart,
      timeEnd: draft.timeEnd,
      duration: "",
      summary: "",
      mode: draft.mode,
      structure: draft.structure,
      evaluation: draft.evaluation,
      observedWithClient: draft.observedWithClient,
      supervisionNotes: draft.supervisionNotes,
    }
    setAppointments((current) => current.some((item) => item.id === id)
      ? current.map((item) => item.id === id ? appointment : item)
      : [...current, appointment])
    setManualModalOpen(false)
    setManualDraft(null)
  }, [])

  const editManualAppointment = useCallback((appointment: SupervisionAppointment) => {
    setManualDraft(appointment)
    setManualModalOpen(true)
  }, [])

  const deleteManualAppointment = useCallback((id: string) => {
    setAppointments((current) => current.filter((item) => item.id !== id))
    setInvalidAppointmentIds((current) => current.filter((item) => item !== id))
  }, [])

  const automaticAppointments = useMemo(
    () => appointments.filter((appointment) => !appointment.isManual),
    [appointments],
  )
  const manualAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.isManual),
    [appointments],
  )

  const manualHours = useMemo(
    () => manualAppointments.reduce((total, appointment) => total + hoursBetween(appointment.timeStart, appointment.timeEnd), 0),
    [manualAppointments],
  )
  const persistedManualHours = useMemo(
    () => (context?.appointments ?? [])
      .filter((appointment) => appointment.isManual)
      .reduce((total, appointment) => total + hoursBetween(appointment.timeStart, appointment.timeEnd), 0),
    [context?.appointments],
  )
  const automaticTotalHours = Math.max(0, (context?.totalHoursWorked ?? 0) - persistedManualHours)
  const automaticSupervisedHours = Math.max(0, (context?.supervisedHours ?? 0) - persistedManualHours)
  const totalHoursWorked = automaticTotalHours + manualHours
  const supervisedHours = automaticSupervisedHours + manualHours

  const toggleId = (setter: React.Dispatch<React.SetStateAction<string[]>>) =>
    (id: string, checked: boolean) => {
      setter((current) => (checked ? [...current, id] : current.filter((entry) => entry !== id)))
    }

  const persist = useCallback(async (): Promise<string | null> => {
    if (isReadOnly) {
      if (!hasMonthlySupervisionSignPermission || !monthlySupervisionId) {
        toast.error("This report is read-only", {
          description: "You need Edit permission to update Monthly Supervision fields.",
        })
        return null
      }

      if (!superviseeSign) {
        toast.error("The supervisee signature is required")
        return null
      }

      return sign(superviseeSign)
    }

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
      .filter((item) =>
        !item.mode
        || !item.structure
        || !item.evaluation
        || (item.isManual && (!item.date || !item.timeStart || !item.timeEnd || item.observedWithClient === undefined)),
      )
      .map((item) => item.id)

    if (incomplete.length > 0) {
      setInvalidAppointmentIds(incomplete)
      toast.error("Complete every supervision", {
        description: `${incomplete.length} ${incomplete.length === 1 ? "session is" : "sessions are"} missing mode, structure or evaluation.`,
      })
      document.querySelector("[data-section='appointments']")?.scrollIntoView({ behavior: "smooth", block: "start" })
      return null
    }
    setInvalidAppointmentIds([])

    if (!supervisorSign) {
      setSignatureError(true)
      toast.error("The supervisor signature is required")
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
      // El backend suma la duración de las entradas manuales. Enviamos solo
      // la base automática para que una edición no vuelva a contar las
      // entradas manuales que ya estaban guardadas.
      totalHoursWorked: automaticTotalHours,
      supervisedHours: automaticSupervisedHours,
      supervisorSign,
      superviseeSign,
      supervisionConducted: serializeEditableOptions(supervisionConducted),
      itemsEvaluated: serializeEditableOptions(itemsEvaluated),
      documentOptionCatalogIds: documentOptionIds,
      appliedOptionCatalogIds: appliedOptionIds,
      appointments: appointments.map((item) => ({
        appointmentId: item.isManual ? null : item.appointmentId ?? null,
        mode: item.mode ?? "",
        structure: item.structure ?? "",
        evaluation: item.evaluation ?? "",
        date: item.isManual ? item.date || null : null,
        timeStart: item.isManual ? item.timeStart ? `${item.timeStart}:00` : null : null,
        timeEnd: item.isManual ? item.timeEnd ? `${item.timeEnd}:00` : null : null,
        observedWithClient: item.observedWithClient === true,
        supervisionNotes: item.isManual ? item.supervisionNotes?.trim() || null : null,
      })),
    })
  }, [
    isReadOnly, hasMonthlySupervisionSignPermission, monthlySupervisionId, superviseeSign, sign,
    isBlocked, clientId, providerId, reportMonth, appointments, supervisorSign,
    otherAppliedOption, supervisionConducted, itemsEvaluated, documentOptionIds, appliedOptionIds,
    context, save, automaticTotalHours, automaticSupervisedHours,
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
    if ((isBlocked || isReadOnly) && monthlySupervisionId) {
      setPreviewId(monthlySupervisionId)
      return
    }
    const id = await persist()
    if (id) setPreviewId(id)
  }, [isBlocked, isReadOnly, monthlySupervisionId, persist])

  const hasSelection = !!clientId && !!providerId && !!reportMonth
  const isBusy = isSaving || contextLoading
  const canSignOnly =
    isEditing &&
    isReadOnly &&
    hasMonthlySupervisionSignPermission &&
    !!superviseeSign &&
    !isBusy &&
    !isBlocked
  const canSave = canSignOnly || (hasSelection && appointments.length > 0 && !isBusy && !isBlocked && !isReadOnly)

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
          disabled={isBlocked || isReadOnly ? !monthlySupervisionId : !canSave}
          className="flex items-center gap-2"
        >
          <FileDown className="h-4 w-4" />
          {isBlocked || isReadOnly ? "Preview PDF" : "Save & Preview PDF"}
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
                value: `${formatHours(supervisedHours)} supervised of ${formatHours(totalHoursWorked)} worked`,
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
              appointments={automaticAppointments}
              onChange={handleAppointmentChange}
              disabled={isBusy || isBlocked || isReadOnly}
              invalidIds={invalidAppointmentIds}
            />
          )}
        </Section>
      </div>

      <Section
        icon={<ClipboardList className="h-4 w-4" />}
        title="Manual Supervision"
        subtitle={manualAppointments.length > 0
          ? `${manualAppointments.length} added manually · ${formatHours(manualHours)} hours`
          : "Optional entries"}
      >
        {manualAppointments.length > 0 && (
          <ManualSupervisionsTable
            appointments={manualAppointments}
            onEdit={editManualAppointment}
            onDelete={deleteManualAppointment}
            disabled={isBusy || isBlocked || isReadOnly}
          />
        )}
        <div className={manualAppointments.length > 0 ? "mt-4 flex justify-end border-t border-slate-100 pt-4" : "flex justify-end"}>
          <Button type="button" variant="secondary" onClick={addManualAppointment} disabled={!hasSelection || isBusy || isBlocked || isReadOnly}>
            <span className="mr-2 text-lg leading-none">+</span>
            Add supervision
          </Button>
        </div>
      </Section>

      <ManualSupervisionModal
        open={manualModalOpen}
        onOpenChange={setManualModalOpen}
        draft={manualDraft}
        onSave={saveManualAppointment}
        disabled={!hasSelection || isBusy || isBlocked || isReadOnly}
      />

      {context && hasSelection && (
        <MonthlySupervisionRequirementsTable
          totalHoursWorked={totalHoursWorked}
          supervisedHours={supervisedHours}
          appointments={appointments}
        />
      )}

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
              disabled={isBusy || isBlocked || isReadOnly}
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
              disabled={isBusy || isBlocked || isReadOnly}
              otherValue={otherAppliedOption}
              onOtherChange={setOtherAppliedOption}
            />
          </Section>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <SupervisionEditableOptionsTable
          title="Characteristics of Supervision Conducted"
          description="Items observed or discussed during supervision"
          options={supervisionConducted}
          onChange={setSupervisionConducted}
          disabled={isBusy || isBlocked || isReadOnly}
        />
        <SupervisionEditableOptionsTable
          title="Other Items Evaluated"
          description="Additional items evaluated during supervision"
          options={itemsEvaluated}
          onChange={setItemsEvaluated}
          disabled={isBusy || isBlocked || isReadOnly}
        />
      </div>

      {/* ─── Firmas ─── */}
      <div data-section="signatures">
        <Section icon={<PenTool className="h-4 w-4" />} title="Signatures">
          <SupervisionSignatures
            supervisorId={user?.id ?? ""}
            supervisorName={context?.supervisor.name ?? ""}
            supervisorCredentials={context?.supervisor.credentials}
            superviseeId={providerId}
            superviseeName={context?.supervisee.name ?? ""}
            supervisorSign={supervisorSign}
            superviseeSign={superviseeSign}
            onSupervisorSignChange={(value) => { setSupervisorSign(value); setSignatureError(false) }}
            onSuperviseeSignChange={(value) => { setSuperviseeSign(value); setSignatureError(false) }}
            canEditSupervisorSignature={canEditSupervisorSignature}
            canEditSuperviseeSignature={canEditSuperviseeSignature}
            disabled={isBusy || isBlocked}
            hasError={signatureError}
          />
        </Section>
      </div>

      <FormBottomBar
        isSubmitting={isSaving}
        onCancel={() => router.push("/monthly-supervisions")}
        submitText={canSignOnly ? "Sign Monthly Supervision" : isEditing ? "Update Monthly Supervision" : "Create Monthly Supervision"}
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

function splitEditableOptions(value?: string): string[] {
  return (value ?? "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
}

function serializeEditableOptions(options: string[]): string {
  return options.map((item) => item.trim()).filter(Boolean).join(";")
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
