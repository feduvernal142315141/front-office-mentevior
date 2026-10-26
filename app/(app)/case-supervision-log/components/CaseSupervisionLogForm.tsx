"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, CalendarClock, ClipboardList, Info, Loader2, Lock } from "lucide-react"
import { toast } from "sonner"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import { MonthPicker } from "@/components/custom/MonthPicker"
import { SectionCard } from "@/components/custom/SectionCard"
import { useAlert } from "@/lib/contexts/alert-context"
import { useClientsByLoggedUser } from "@/lib/modules/clients/hooks/use-clients-by-logged-user"
import { useUsers } from "@/lib/modules/users/hooks/use-users"
import { useCaseSupervisionAppointments } from "@/lib/modules/case-supervision-log/hooks/use-case-supervision-appointments"
import { useCreateCaseSupervisionLog } from "@/lib/modules/case-supervision-log/hooks/use-create-case-supervision-log"
import {
  getManualEntryDuration,
  isManualEntryEmpty,
  toManualEntryInput,
  type ManualEntryFormValue,
} from "@/lib/modules/case-supervision-log/utils/manual-entries"
import { getSupervisionCompliance } from "@/lib/types/case-supervision-log.types"
import { currentReportMonth, formatReportMonthLong, isReportMonth } from "@/lib/utils/report-month"
import { CaseSupervisionAppointmentsTable } from "./CaseSupervisionAppointmentsTable"
import { ComplianceSummary } from "./ComplianceSummary"
import { ManualLogEntrySection } from "./ManualLogEntrySection"

/**
 * Alta de un Case Supervision Log.
 *
 * Dos etapas en una sola pantalla: se elige el trío (cliente, provider, mes), se
 * revisa lo que el backend calculó para ese período, y recién ahí se persiste.
 *
 * La revisión no es decorativa. **El reporte no se borra, y después de creado
 * sólo se pueden editar las entradas manuales** (ni agregar ni quitar). De ahí
 * salen las dos guardas: la validación del backend y la confirmación explícita.
 */
export function CaseSupervisionLogForm() {
  const router = useRouter()
  const alert = useAlert()

  const [clientId, setClientId] = useState("")
  const [providerId, setProviderId] = useState("")
  const [reportMonth, setReportMonth] = useState(currentReportMonth)
  const [manualEntries, setManualEntries] = useState<ManualEntryFormValue[]>([])

  const { clients, isLoading: clientsLoading } = useClientsByLoggedUser({ page: 0, pageSize: 200 })
  const { users: allUsers } = useUsers({ pageSize: 100 })

  const { preparation, isLoading: isLoadingPreparation, error: preparationError } =
    useCaseSupervisionAppointments({ clientId, providerId, reportMonth })

  const { create, isCreating } = useCreateCaseSupervisionLog()

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
    if (clientId || clients.length !== 1) return
    setClientId(clients[0].id)
  }, [clients, clientId])

  // Location sale de las direcciones del cliente: al cambiarlo, la elegida deja de valer
  const handleClientChange = useCallback((nextClientId: string) => {
    setClientId(nextClientId)
    setManualEntries((prev) => prev.map((entry) => ({ ...entry, clientAddressId: "" })))
  }, [])

  const filledManualEntries = useMemo(
    () => manualEntries.filter((entry) => !isManualEntryEmpty(entry)),
    [manualEntries],
  )
  const manualHours = useMemo(
    () => filledManualEntries.reduce(
      (sum, entry) => sum + getManualEntryDuration(entry.timeStart, entry.timeEnd),
      0,
    ),
    [filledManualEntries],
  )
  const isTrioComplete = !!clientId && !!providerId && isReportMonth(reportMonth)
  const isBusy = isLoadingPreparation || isCreating
  const canSubmit = isTrioComplete && !!preparation && !isBusy

  const clientName = clientOptions.find((o) => o.value === clientId)?.label ?? ""
  const providerName = providerOptions.find((o) => o.value === providerId)?.label ?? ""

  const persist = useCallback(async () => {
    try {
      const id = await create({
        clientId,
        providerId,
        reportMonth,
        withoutAppointments: filledManualEntries.map(toManualEntryInput),
      })
      toast.success("Case Supervision Log created")
      // Se navega al detalle y se relee desde el servidor: el `POST` recalcula
      // todo desde la base, así que lo persistido es la única verdad.
      router.push(`/case-supervision-log/${id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error"
      // The request runs from the confirmation modal. Delay the toast until the
      // modal finishes closing so a 422 from the backend is visible to the user.
      setTimeout(() => {
        toast.error("Couldn't create the report", { description: message })
      }, 0)
    }
  }, [create, clientId, providerId, reportMonth, filledManualEntries, router])

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()
      if (!canSubmit || !preparation) return

      const { percent, isMet } = getSupervisionCompliance(
        preparation.supervisionHours + manualHours,
        preparation.totalsHours + manualHours,
      )

      const complianceLine =
        percent === null
          ? "There are no hours logged for this month, so the supervision requirement cannot be evaluated."
          : `Supervision is ${percent.toFixed(1)}% of total hours — the requirement is ${isMet ? "Met" : "Unmet"}.`

      const manualEntriesLine =
        filledManualEntries.length > 0
          ? ` It includes ${filledManualEntries.length} manual log ${filledManualEntries.length === 1 ? "entry" : "entries"}.`
          : ""

      alert.confirm({
        title: "Create this report?",
        description: `${clientName} · ${providerName} · ${formatReportMonthLong(reportMonth)}. ${complianceLine}${manualEntriesLine} Once created, only its manual log entries can be edited.`,
        confirmText: "Create report",
        cancelText: "Review again",
        onConfirm: persist,
      })
    },
    [
      alert, canSubmit, clientId, clientName, filledManualEntries, manualHours, persist,
      preparation, providerId, providerName, reportMonth, router,
    ],
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-32">
      {/* ─── Selección del período ─── */}
      <SectionCard
        icon={<ClipboardList className="h-4 w-4" />}
        title="Report setup"
        subtitle="Client, provider and reporting month"
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <FloatingSelect
            label="Client"
            value={clientId}
            onChange={handleClientChange}
            options={clientOptions}
            disabled={clientsLoading || isCreating}
            searchable
            required
          />
          <FloatingSelect
            label="Supervisor"
            value={providerId}
            onChange={setProviderId}
            options={providerOptions}
            disabled={isCreating}
            searchable
            required
          />
          <MonthPicker
            label="Reporting month"
            value={reportMonth}
            onChange={setReportMonth}
            disabled={isCreating}
          />
        </div>

        <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-400">
          <Info className="mt-px h-3.5 w-3.5 shrink-0" />
          Hours and sessions are calculated by the server from the appointments of the selected
          month. Manual log entries are optional.
        </p>
      </SectionCard>

      {/* ─── Resultado del período ─── */}
      <SectionCard
        icon={<CalendarClock className="h-4 w-4" />}
        title="Sessions in this period"
        subtitle={
          preparation ? `${preparation.appointments.length} in the report` : undefined
        }
      >
        {!isTrioComplete && (
          <EmptyHint
            title="Pick a client, a supervisor and a month"
            description="The sessions and hours for that period will show up here before you create anything."
          />
        )}

        {isTrioComplete && isLoadingPreparation && (
          <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-[#037ECC]" />
            <span className="text-sm">Loading sessions…</span>
          </div>
        )}

        {isTrioComplete && !isLoadingPreparation && preparationError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-red-700">
              <AlertTriangle className="h-4 w-4" />
              Couldn&apos;t load the sessions
            </p>
            <p className="mt-1 text-sm text-red-600">{preparationError.message}</p>
          </div>
        )}

        {isTrioComplete && !isLoadingPreparation && !preparationError && preparation && (
          <div className="space-y-5">
            <ComplianceSummary
              totalsHours={preparation.totalsHours + manualHours}
              supervisionHours={preparation.supervisionHours + manualHours}
            />
            <CaseSupervisionAppointmentsTable
              appointments={preparation.appointments}
            />
          </div>
        )}
      </SectionCard>

      {/* ─── Entradas manuales ─── */}
      {isTrioComplete && (
        <ManualLogEntrySection
          entries={manualEntries}
          clientId={clientId}
          reportMonth={reportMonth}
          canAdd
          onSaveEntry={(entry) =>
            setManualEntries((prev) =>
              prev.some((e) => e.key === entry.key)
                ? prev.map((e) => (e.key === entry.key ? entry : e))
                : [...prev, entry],
            )
          }
          onRemoveEntry={(key) => setManualEntries((prev) => prev.filter((e) => e.key !== key))}
          disabled={isCreating}
        />
      )}

      {/* Es irreversible y conviene decirlo antes del botón, no después */}
      {canSubmit && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            Once created, this report cannot be deleted, and only the manual log entries can be
            edited — you won&apos;t be able to add or remove them later. Check the client, the
            supervisor and the month before continuing.
          </p>
        </div>
      )}

      <FormBottomBar
        isSubmitting={isCreating}
        onCancel={() => router.push("/case-supervision-log")}
        submitText="Create Case Supervision Log"
        disabled={!canSubmit}
      />
    </form>
  )
}

function EmptyHint({ title, description }: { title: string; description: string }) {
  return (
    <div className="py-10 text-center">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  )
}
