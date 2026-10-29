"use client"

import { use, useEffect, useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  ClipboardCheck,
  FileDown,
  FileQuestion,
  Loader2,
  Lock,
  User,
} from "lucide-react"
import { Button } from "@/components/custom/Button"
import { DocumentViewer } from "@/components/custom/DocumentViewer"
import { SectionCard } from "@/components/custom/SectionCard"
import { useCaseSupervisionLogById } from "@/lib/modules/case-supervision-log/hooks/use-case-supervision-log-by-id"
import {
  getCaseSupervisionLogPdfUrl,
  updateCaseSupervisionLog,
} from "@/lib/modules/case-supervision-log/services/case-supervision-log.service"
import {
  manualEntryToFormValue,
  toManualEntryInput,
  validateManualEntry,
  type ManualEntryFormValue,
} from "@/lib/modules/case-supervision-log/utils/manual-entries"
import { useModulePermissions } from "@/lib/hooks/use-module-permissions"
import { PermissionModule } from "@/lib/utils/permissions-new"
import { formatReportMonthLong } from "@/lib/utils/report-month"
import { CaseSupervisionAppointmentsTable } from "../components/CaseSupervisionAppointmentsTable"
import { ComplianceSummary } from "../components/ComplianceSummary"
import { ManualLogEntrySection } from "../components/ManualLogEntrySection"

interface CaseSupervisionLogDetailPageProps {
  params: Promise<{ id: string }>
}

/**
 * Detalle de un Case Supervision Log.
 *
 * El encabezado y las sesiones son **sólo lectura**. Lo único editable son las
 * entradas manuales, que pueden agregarse, editarse o eliminarse.
 */
export default function CaseSupervisionLogDetailPage({ params }: CaseSupervisionLogDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { report, isLoading, notFound, error, refetch } = useCaseSupervisionLogById(id)
  const { canEdit } = useModulePermissions(PermissionModule.CASE_SUPERVISION)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [manualEntries, setManualEntries] = useState<ManualEntryFormValue[]>([])

  const savedEntries = report?.withoutAppointments ?? []

  useEffect(() => {
    setManualEntries(report?.withoutAppointments.map(manualEntryToFormValue) ?? [])
  }, [report])

  /**
   * El `PUT` recibe el estado final de las entradas manuales. Si falla, el modal
   * queda abierto.
   */
  const handleSaveEntry = async (entry: ManualEntryFormValue) => {
    if (!report) return

    const nextEntries = manualEntries.some((e) => e.key === entry.key)
      ? manualEntries.map((e) => (e.key === entry.key ? entry : e))
      : [...manualEntries, entry]
    const incompleteIndex = nextEntries.findIndex(
      (e) => e.key !== entry.key && Object.keys(validateManualEntry(e)).length > 0,
    )
    if (incompleteIndex !== -1) {
      toast.error("Another entry is incomplete", {
        description: `Entry ${incompleteIndex + 1} is missing its date or times. Complete it first.`,
      })
      throw new Error("Incomplete manual entry")
    }

    setIsSaving(true)
    try {
      await updateCaseSupervisionLog(report.id, {
        withoutAppointments: nextEntries.map(toManualEntryInput),
      })
      toast.success(entry.id ? "Manual log entry updated" : "Manual log entry added")
      await refetch()
    } catch (err) {
      toast.error("Couldn't update the entry", {
        description: err instanceof Error ? err.message : "Unexpected error",
      })
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveEntry = async (key: string) => {
    if (!report) return
    const nextEntries = manualEntries.filter((entry) => entry.key !== key)
    setIsSaving(true)
    try {
      await updateCaseSupervisionLog(report.id, {
        withoutAppointments: nextEntries.map(toManualEntryInput),
      })
      toast.success("Manual log entry removed")
      await refetch()
    } catch (err) {
      toast.error("Couldn't remove the entry", {
        description: err instanceof Error ? err.message : "Unexpected error",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/case-supervision-log")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:-translate-y-0.5 hover:border-[#037ECC]/40 hover:text-[#037ECC] hover:shadow-md"
            aria-label="Back to case supervision logs"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="rounded-xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 p-3">
            <ClipboardCheck className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-3xl font-bold text-transparent">
              Case Supervision Log
            </h1>
            <p className="mt-1 text-slate-600">
              {report ? formatReportMonthLong(report.monthYear) : "Report detail"}
            </p>
          </div>

          {report && (
            <div className="ml-auto">
              <Button
                variant="secondary"
                onClick={() => setIsPreviewOpen(true)}
                className="flex items-center gap-2"
              >
                <FileDown className="h-4 w-4" />
                Preview PDF
              </Button>
            </div>
          )}
        </div>

        {isLoading && !report && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#037ECC]" />
          </div>
        )}

        {!isLoading && notFound && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <FileQuestion className="mx-auto h-14 w-14 text-slate-300" />
            <h2 className="mt-4 text-xl font-semibold text-slate-700">Report not found</h2>
            <p className="mx-auto mt-1 max-w-md text-slate-500">
              This case supervision log doesn&apos;t exist, or it belongs to another company.
            </p>
            <Button
              variant="ghost"
              onClick={() => router.push("/case-supervision-log")}
              className="mt-5"
            >
              Back to the list
            </Button>
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <p className="font-medium text-red-600">Failed to load the report</p>
            <p className="mt-1 text-sm text-red-500">{error.message}</p>
          </div>
        )}

        {report && (
          <div className="space-y-5">
            {/* ─── Cabecera ─── */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <InfoCard icon={<User className="h-4 w-4 text-[#037ECC]" />} label="Recipient">
                <Field label="Name" value={report.clientName || "—"} />
                <Field label="Period" value={formatReportMonthLong(report.monthYear)} />
              </InfoCard>

              <InfoCard icon={<Building2 className="h-4 w-4 text-[#037ECC]" />} label="Supervisor">
                <Field label="Name" value={report.providerName || "—"} />
                <Field label="Credential" value={report.providerCredential || "—"} />
              </InfoCard>
            </div>

            <SectionCard
              icon={<ClipboardCheck className="h-4 w-4" />}
              title="Supervision coverage"
            >
              <ComplianceSummary
                totalsHours={report.totalsHours}
                supervisionHours={report.supervisionHours}
              />
            </SectionCard>

            <SectionCard
              icon={<CalendarClock className="h-4 w-4" />}
              title="Sessions in this period"
              subtitle={`${report.appointments.length} recorded`}
            >
              <CaseSupervisionAppointmentsTable
                appointments={report.appointments}
                emptyDescription="This report was created without any sessions for the period."
              />
            </SectionCard>

            <ManualLogEntrySection
              entries={manualEntries}
              clientId={report.clientId}
              reportMonth={report.monthYear}
              savedEntries={savedEntries}
              onSaveEntry={handleSaveEntry}
              canAdd={canEdit}
              canEdit={canEdit}
              onRemoveEntry={canEdit ? (key) => void handleRemoveEntry(key) : undefined}
              isSaving={isSaving}
            />

            <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <Lock className="h-3.5 w-3.5" />
              Sessions and totals are a permanent record. Only manual log entries can be edited.
            </p>
          </div>
        )}

        {report && isPreviewOpen && (
          <DocumentViewer
            open
            onClose={() => setIsPreviewOpen(false)}
            documentUrl={getCaseSupervisionLogPdfUrl(report.id)}
            fileName="Case Supervision Log.pdf"
          />
        )}
      </div>
    </div>
  )
}

function InfoCard({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">{children}</div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-slate-400">{label}:</span>{" "}
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  )
}
