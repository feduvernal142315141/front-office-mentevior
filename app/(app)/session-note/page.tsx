"use client"

import { useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, NotebookPen, FileDown, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/custom/Button"
import { DocumentViewer } from "@/components/custom/DocumentViewer"
import { getAppointmentNotePdfUrl } from "@/lib/modules/appointment-notes/services/appointment-note.service"
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
    useCheckmarkSignature,
    caregiverSignatureChecked,
    setCaregiverChecked,
    caregiverSignatureImage,
    setCaregiverSignatureImage,
    noteBlocked,
    noteNotCanEdit,
  } = useSessionNoteForm({ appointmentId, clientId })

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
              useCheckmarkSignature={useCheckmarkSignature}
              caregiverSignatureChecked={caregiverSignatureChecked}
              onCaregiverCheckedChange={setCaregiverChecked}
              onCaregiverSignatureChange={setCaregiverSignatureImage}
              caregiverSignatureImage={caregiverSignatureImage}
              blocked={noteBlocked}
              notCanEdit={noteNotCanEdit}
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
