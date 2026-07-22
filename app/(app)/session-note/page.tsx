"use client"

import { useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, NotebookPen, FileDown, Loader2, Lock, LockOpen, BookOpen, PenLine, Clock } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/custom/Button"
import { DocumentViewer } from "@/components/custom/DocumentViewer"
import { getAppointmentNotePdfUrl, lockAppointmentNote } from "@/lib/modules/appointment-notes/services/appointment-note.service"
import { toggleAppointmentEditLocks } from "@/lib/modules/schedules/services/appointments.service"
import { useAuth } from "@/lib/hooks/use-auth"
import { useUserById } from "@/lib/modules/users/hooks/use-user-by-id"
import { usePermission } from "@/lib/hooks/use-permission"
import { PermissionModule } from "@/lib/utils/permissions-new"
import { useAlert } from "@/lib/contexts/alert-context"
import { deriveNoteStatusInfo } from "./hooks/useNoteStatus"
import { SessionNoteForm } from "./components/SessionNoteForm"
import { SessionNotesTable } from "./components/SessionNotesTable"
import { useSessionNoteForm } from "./hooks/useSessionNoteForm"

export default function SessionNotePage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const appointmentId = searchParams.get("appointmentId")
  const clientId = searchParams.get("clientId")
  const billingCode = searchParams.get("billingCode")

  // ─── List view (no appointmentId) ───
  if (!appointmentId) {
    return (
      <div className="px-6 py-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
              <NotebookPen className="h-8 w-8 text-[#037ECC]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
                Session Notes
              </h1>
              <p className="text-slate-600 mt-1">View and manage all session notes</p>
            </div>
          </div>
          <SessionNotesTable />
        </div>
      </div>
    )
  }

  // ─── Form view (with appointmentId) ───
  return <SessionNoteFormView appointmentId={appointmentId} clientId={clientId} billingCode={billingCode} />
}

// Extracted to a separate component so hooks are not called conditionally
function SessionNoteFormView({ appointmentId, clientId, billingCode }: { appointmentId: string; clientId: string | null; billingCode: string | null }) {
  const router = useRouter()
  const alert = useAlert()
  const { user } = useAuth()
  const { user: fullUser } = useUserById(user?.id || null)
  const { block: canBlock } = usePermission()
  const isAdmin = /admin|superadmin/i.test(fullUser?.role?.name ?? "")
  const hasBlockPermission = canBlock(PermissionModule.APPOINTMENT)
  const canAdminAction = isAdmin && hasBlockPermission

  const [isChangingStatus, setIsChangingStatus] = useState(false)

  const {
    formData,
    updateField,
    updateItemValue,
    updateItemEnvironmentalChange,
    handleSubmit,
    isLoadingNote,
    noteError,
    isSaving,
    isLoadingCatalogs,
    teachingMethodOptions,
    modalityOptions,
    participantCatalog,
    antecedentItems,
    consequenceItems,
    categories,
    recipient,
    provider,
    serviceDetails,
    billingCodes: noteBillingCodes,
    noteModality,
    itemErrors,
    providerSignatureUrl,
    saveProviderSignature,
    isProviderSignatureSaving,
    useCheckmarkSignature,
    caregiverSignatureChecked,
    setCaregiverChecked,
    caregiverSignatureImage,
    setCaregiverSignatureImage,
    noteStatus,
    noteId,
    refetchNote,
  } = useSessionNoteForm({ appointmentId, clientId })

  const statusInfo = deriveNoteStatusInfo(noteStatus, canAdminAction)

  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const handlePreviewPdf = useCallback(async () => {
    if (!appointmentId || isGeneratingPdf) return
    setIsGeneratingPdf(true)
    try {
      const url = await getAppointmentNotePdfUrl(appointmentId)
      setPdfUrl(url)
    } catch {
      toast.error("Failed to generate PDF preview")
    } finally {
      setIsGeneratingPdf(false)
    }
  }, [appointmentId, isGeneratingPdf])

  const handleNoteStatusChange = useCallback(async (newStatus: "lock" | "active") => {
    if (!appointmentId || isChangingStatus) return
    if (newStatus === "lock") {
      alert.confirm({
        title: "Lock Note for Billing",
        description: "This action is permanent. The note will be sent to billing and cannot be unlocked.",
        confirmText: "Lock",
        cancelText: "Cancel",
        onConfirm: async () => {
          setIsChangingStatus(true)
          try {
            const result = await lockAppointmentNote(appointmentId)
            if (result) { await refetchNote(); toast.success("Note locked and sent to billing") }
            else toast.error("Failed to lock note")
          } catch { toast.error("Failed to lock note") }
          finally { setIsChangingStatus(false) }
        },
      })
      return
    }
    setIsChangingStatus(true)
    try {
      const result = await toggleAppointmentEditLocks(appointmentId)
      if (result) { await refetchNote(); toast.success("Note re-activated for editing") }
      else toast.error("Failed to re-activate note")
    } catch { toast.error("Failed to re-activate note") }
    finally { setIsChangingStatus(false) }
  }, [appointmentId, isChangingStatus, refetchNote, alert])

  const handleSaveAndRedirect = useCallback(async () => {
    const result = await handleSubmit()
    if (result) {
      toast.success("Session note saved")
      router.push("/session-note")
    }
  }, [handleSubmit, router])

  return (
    <div className="px-6 py-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="secondary"
            className="h-10 w-10 p-0"
            onClick={() => router.push("/session-note")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
            <NotebookPen className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
                Session Note
              </h1>
              <p className="text-slate-600 mt-1">Document the session details and interventions</p>
            </div>
            {billingCode && (
              <span className="inline-flex items-center rounded-full bg-[#037ECC]/10 px-3 py-1 text-xs font-semibold text-[#037ECC] border border-[#037ECC]/20">
                {billingCode}
              </span>
            )}
          </div>
          {/* Preview PDF button */}
          <div className="ml-auto">
            <Button
              type="button"
              variant="secondary"
              className="gap-2"
              onClick={handlePreviewPdf}
              disabled={isGeneratingPdf || isLoadingNote}
            >
              {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              {isGeneratingPdf ? "Generating..." : "Preview PDF"}
            </Button>
          </div>
        </div>

        {/* Note Status Banner */}
        {!isLoadingNote && !noteError && (
          <NoteStatusBanner
            statusInfo={statusInfo}
            isChangingStatus={isChangingStatus}
            onStatusChange={handleNoteStatusChange}
          />
        )}

        {/* Loading state */}
        {isLoadingNote && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-slate-200 rounded w-1/3 mx-auto" />
              <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto" />
            </div>
          </div>
        )}

        {/* Error state */}
        {noteError && !isLoadingNote && (
          <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-12 text-center">
            <p className="text-red-600">{noteError.message}</p>
          </div>
        )}

        {/* Form */}
        {!isLoadingNote && !noteError && (
          <form onSubmit={(e) => { e.preventDefault(); handleSaveAndRedirect() }} noValidate>
            <SessionNoteForm
              formData={formData}
              updateField={updateField}
              updateItemValue={updateItemValue}
              updateItemEnvironmentalChange={updateItemEnvironmentalChange}
              isSaving={isSaving}
              isLoadingCatalogs={isLoadingCatalogs}
              teachingMethodOptions={teachingMethodOptions}
              modalityOptions={modalityOptions}
              participantCatalog={participantCatalog}
              antecedentItems={antecedentItems}
              consequenceItems={consequenceItems}
              categories={categories}
              recipient={recipient}
              provider={provider}
              serviceDetails={serviceDetails}
              billingCodes={noteBillingCodes}
              modality={noteModality}
              itemErrors={itemErrors}
              providerSignatureUrl={providerSignatureUrl}
              onProviderSignatureSave={saveProviderSignature}
              isProviderSaving={isProviderSignatureSaving}
              useCheckmarkSignature={useCheckmarkSignature}
              caregiverSignatureChecked={caregiverSignatureChecked}
              onCaregiverCheckedChange={setCaregiverChecked}
              onCaregiverSignatureChange={setCaregiverSignatureImage}
              caregiverSignatureImage={caregiverSignatureImage}
              noteStatus={noteStatus}
            />
          </form>
        )}
      </div>

      {/* PDF Viewer */}
      {pdfUrl && (
        <DocumentViewer
          open
          onClose={() => {
            URL.revokeObjectURL(pdfUrl)
            setPdfUrl(null)
          }}
          documentUrl={pdfUrl}
          fileName="Appointment Note.pdf"
        />
      )}
    </div>
  )
}

// ============================================
// Note Status Banner
// ============================================

const BANNER_CONFIG = {
  info:    { border: "border-[#037ECC]/20", bg: "from-[#037ECC]/[0.04] to-[#079CFB]/[0.04]", shadow: "shadow-[0_2px_12px_rgba(3,126,204,0.06)]", iconBg: "bg-[#037ECC]/10 border-[#037ECC]/20", title: "text-[#037ECC]", desc: "text-[#037ECC]/60" },
  success: { border: "border-emerald-200/80", bg: "from-emerald-50/90 to-emerald-100/50", shadow: "shadow-[0_2px_12px_rgba(16,185,129,0.08)]", iconBg: "bg-emerald-100 border-emerald-200/60", title: "text-emerald-800", desc: "text-emerald-600/80" },
  warning: { border: "border-amber-200/80", bg: "from-amber-50/90 to-amber-100/50", shadow: "shadow-[0_2px_12px_rgba(245,158,11,0.08)]", iconBg: "bg-amber-100 border-amber-200/60", title: "text-amber-800", desc: "text-amber-600/80" },
  danger:  { border: "border-red-200/80", bg: "from-red-50/90 to-red-100/50", shadow: "shadow-[0_2px_12px_rgba(239,68,68,0.08)]", iconBg: "bg-red-100 border-red-200/60", title: "text-red-800", desc: "text-red-600/80" },
} as const

const BANNER_ICONS = { read: BookOpen, active: PenLine, close: Clock, lock: Lock } as const

function NoteStatusBanner({ statusInfo, isChangingStatus, onStatusChange }: {
  statusInfo: import("./hooks/useNoteStatus").NoteStatusInfo
  isChangingStatus: boolean
  onStatusChange: (status: "lock" | "active") => void
}) {
  const colors = BANNER_CONFIG[statusInfo.bannerVariant]
  const Icon = BANNER_ICONS[statusInfo.status]

  return (
    <div className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl border mb-6 transition-all duration-300 ease-out bg-gradient-to-r ${colors.border} ${colors.bg} ${colors.shadow}`}>
      <div className={`flex items-center justify-center h-10 w-10 rounded-xl shrink-0 border ${colors.iconBg}`}>
        <Icon className={`h-4 w-4 ${colors.title}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${colors.title}`}>{statusInfo.bannerMessage}</p>
        <p className={`text-xs mt-0.5 ${colors.desc}`}>{statusInfo.bannerDescription}</p>
      </div>
      {statusInfo.canActivate && (
        <Button
          type="button"
          variant="secondary"
          className="shrink-0 h-9 px-4 text-xs font-semibold gap-2 rounded-xl border-amber-300 text-amber-700 hover:bg-amber-100 hover:border-amber-400"
          onClick={() => onStatusChange("active")}
          disabled={isChangingStatus}
        >
          {isChangingStatus ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LockOpen className="h-3.5 w-3.5" />}
          Re-Activate
        </Button>
      )}
      {statusInfo.canLock && (
        <Button
          type="button"
          variant="secondary"
          className="shrink-0 h-9 px-4 text-xs font-semibold gap-2 rounded-xl border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400"
          onClick={() => onStatusChange("lock")}
          disabled={isChangingStatus}
        >
          {isChangingStatus ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
          Lock for Billing
        </Button>
      )}
    </div>
  )
}
