"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
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
import { parseLocalDate } from "@/lib/date"
import { useCaseSupervisionLogById } from "@/lib/modules/case-supervision-log/hooks/use-case-supervision-log-by-id"
import { getCaseSupervisionLogPdfUrl } from "@/lib/modules/case-supervision-log/services/case-supervision-log.service"
import { formatReportMonthLong } from "@/lib/utils/report-month"
import { CaseSupervisionAppointmentsTable } from "../components/CaseSupervisionAppointmentsTable"
import { ComplianceSummary } from "../components/ComplianceSummary"

interface CaseSupervisionLogDetailPageProps {
  params: Promise<{ id: string }>
}

/** El backend manda `yyyy-MM-dd`; se parsea en local para no correr un día */
function formatReportDate(value: string): string {
  if (!value) return "—"
  try {
    return format(parseLocalDate(value), "MM/dd/yyyy")
  } catch {
    return value
  }
}

/**
 * Detalle de un Case Supervision Log.
 *
 * Es **sólo lectura y así tiene que verse**: no hay endpoint de actualización, y
 * mostrar campos deshabilitados sugeriría que en algún momento se van a poder
 * editar. Es un documento emitido, no un borrador.
 */
export default function CaseSupervisionLogDetailPage({ params }: CaseSupervisionLogDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { report, isLoading, notFound, error } = useCaseSupervisionLogById(id)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  return (
    <div className="p-8">
      <div className="mx-auto max-w-6xl">
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

        {isLoading && (
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

        {!isLoading && report && (
          <div className="space-y-5">
            {/* ─── Cabecera ─── */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <InfoCard icon={<User className="h-4 w-4 text-[#037ECC]" />} label="Recipient">
                <Field label="Name" value={report.clientName || "—"} />
                <Field label="Period" value={formatReportMonthLong(report.monthYear)} />
              </InfoCard>

              <InfoCard icon={<Building2 className="h-4 w-4 text-[#037ECC]" />} label="Supervisor">
                <Field label="Name" value={report.providerName || "—"} />
                <Field label="Report date" value={formatReportDate(report.date)} />
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

            <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <Lock className="h-3.5 w-3.5" />
              Case supervision logs are a permanent record and cannot be edited.
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
