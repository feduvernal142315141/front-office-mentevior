"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarClock,
  ClipboardList,
  FileDown,
  FileQuestion,
  Loader2,
  Lock,
  ShieldCheck,
  User,
} from "lucide-react"
import { Button } from "@/components/custom/Button"
import { DocumentViewer } from "@/components/custom/DocumentViewer"
import { SectionCard } from "@/components/custom/SectionCard"
import { parseLocalDate } from "@/lib/date"
import { useServiceLogById } from "@/lib/modules/service-log/hooks/use-service-log-by-id"
import { getServiceLogPdfUrl } from "@/lib/modules/service-log/services/service-log.service"
import { ServiceLogServicesTable } from "../components/ServiceLogServicesTable"

interface ServiceLogDetailPageProps {
  params: Promise<{ id: string }>
}

/** `yyyy-MM-dd` (ya recortado del timestamp UTC en el service) → `MM/dd/yyyy` */
function formatRangeDate(value: string): string {
  if (!value) return "—"
  try {
    return format(parseLocalDate(value), "MM/dd/yyyy")
  } catch {
    return value
  }
}

/**
 * Detalle de un Service Log.
 *
 * Es **sólo lectura y así tiene que verse**: no hay update ni delete. Es el
 * documento que respalda la facturación ante la aseguradora, no un borrador.
 * Las filas incompletas (sin validación del caregiver o sin firma del provider)
 * van en rojo, con el mismo criterio que el PDF.
 */
export default function ServiceLogDetailPage({ params }: ServiceLogDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { serviceLog, isLoading, notFound, error } = useServiceLogById(id)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const incompleteCount = serviceLog?.services.filter((s) => s.imcomplete).length ?? 0

  return (
    <div className="p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/service-log")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:-translate-y-0.5 hover:border-[#037ECC]/40 hover:text-[#037ECC] hover:shadow-md"
            aria-label="Back to service logs"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="rounded-xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 p-3">
            <ClipboardList className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-3xl font-bold text-transparent">
              Service Log
            </h1>
            <p className="mt-1 text-slate-600">
              {serviceLog
                ? `${formatRangeDate(serviceLog.initDate)} – ${formatRangeDate(serviceLog.endDate)}`
                : "Service log detail"}
            </p>
          </div>

          {serviceLog && (
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
            <h2 className="mt-4 text-xl font-semibold text-slate-700">Service log not found</h2>
            <p className="mx-auto mt-1 max-w-md text-slate-500">
              This service log doesn&apos;t exist, or it belongs to another company.
            </p>
            <Button variant="ghost" onClick={() => router.push("/service-log")} className="mt-5">
              Back to Service Log
            </Button>
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <p className="font-medium text-red-600">Failed to load the service log</p>
            <p className="mt-1 text-sm text-red-500">{error.message}</p>
          </div>
        )}

        {!isLoading && serviceLog && (
          <div className="space-y-5">
            {/* ─── Cabecera ─── */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <InfoCard icon={<User className="h-4 w-4 text-[#037ECC]" />} label="Recipient">
                <Field label="Name" value={serviceLog.recipient || "—"} />
                <Field label="Insurance" value={serviceLog.insurance || "—"} />
                <Field label="Diagnosis" value={serviceLog.diagnosis || "—"} />
              </InfoCard>

              <InfoCard icon={<Building2 className="h-4 w-4 text-[#037ECC]" />} label="Provider">
                <Field label="Name" value={serviceLog.provider || "—"} />
                <Field label="Credentials" value={serviceLog.credentials || "—"} />
                <Field label="Total hours" value={serviceLog.totalHours || "—"} />
              </InfoCard>
            </div>

            {/* Con varias autorizaciones en el rango los valores vienen unidos
                con " | ": la card va a lo ancho para que no se trunquen. */}
            <InfoCard
              icon={<ShieldCheck className="h-4 w-4 text-[#037ECC]" />}
              label="Prior Authorization"
              wide
            >
              <Field label="PA #" value={serviceLog.priorAuthorizationNumber || "—"} />
              <Field label="PA start date" value={serviceLog.priorAuthorizationStartDate || "—"} />
              <Field label="PA end date" value={serviceLog.priorAuthorizationEndDate || "—"} />
              <Field label="Approved units" value={serviceLog.approvedUnits || "—"} wide />
            </InfoCard>

            {incompleteCount > 0 && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50/70 px-4 py-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <p className="text-sm text-red-700">
                  {incompleteCount === 1
                    ? "1 service is missing the caregiver validation or the provider signature."
                    : `${incompleteCount} services are missing the caregiver validation or the provider signature.`}{" "}
                  Incomplete rows are highlighted below and in the PDF.
                </p>
              </div>
            )}

            <SectionCard
              icon={<CalendarClock className="h-4 w-4" />}
              title="Services in this period"
              subtitle={`${serviceLog.services.length} from locked session notes`}
            >
              <ServiceLogServicesTable services={serviceLog.services} />
            </SectionCard>

            <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <Lock className="h-3.5 w-3.5" />
              Service logs are a permanent billing record and cannot be edited.
            </p>
          </div>
        )}

        {serviceLog && isPreviewOpen && (
          <DocumentViewer
            open
            onClose={() => setIsPreviewOpen(false)}
            documentUrl={getServiceLogPdfUrl(serviceLog.id)}
            fileName="Service Log.pdf"
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
  wide = false,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
      </div>
      <div
        className={`grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm ${
          wide ? "sm:grid-cols-3" : "sm:grid-cols-2"
        }`}
      >
        {children}
      </div>
    </div>
  )
}

function Field({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-3" : undefined}>
      <span className="text-slate-400">{label}:</span>{" "}
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  )
}
