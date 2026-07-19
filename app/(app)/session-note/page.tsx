"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, NotebookPen } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { SessionNoteForm } from "./components/SessionNoteForm"
import { useSessionNoteForm } from "./hooks/useSessionNoteForm"

export default function SessionNotePage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const appointmentId = searchParams.get("appointmentId")
  const clientId = searchParams.get("clientId")
  const billingCode = searchParams.get("billingCode")

  const {
    formData,
    updateField,
    addParticipant,
    removeParticipant,
    updateParticipantValue,
    handleSubmit,
    isLoadingNote,
    noteError,
    isSaving,
    isLoadingCatalogs,
    teachingMethodOptions,
    memberUserTypeOptions,
    relationshipOptions,
    antecedentItems,
    consequenceItems,
    categories,
  } = useSessionNoteForm({ appointmentId, clientId })

  if (!appointmentId) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <NotebookPen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 mb-2">No Appointment Selected</h2>
            <p className="text-slate-600 mb-6">
              Please open a session note from the calendar by clicking the &quot;Session Note&quot; button on an appointment.
            </p>
            <Button variant="secondary" onClick={() => router.push("/schedules")}>
              Go to Calendar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="secondary"
            className="h-10 w-10 p-0"
            onClick={() => router.back()}
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
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} noValidate>
            <SessionNoteForm
              formData={formData}
              updateField={updateField}
              addParticipant={addParticipant}
              removeParticipant={removeParticipant}
              updateParticipantValue={updateParticipantValue}
              isSaving={isSaving}
              isLoadingCatalogs={isLoadingCatalogs}
              teachingMethodOptions={teachingMethodOptions}
              memberUserTypeOptions={memberUserTypeOptions}
              relationshipOptions={relationshipOptions}
              antecedentItems={antecedentItems}
              consequenceItems={consequenceItems}
              categories={categories}
            />
          </form>
        )}
      </div>
    </div>
  )
}
