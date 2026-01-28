"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useApplicantById } from "@/lib/modules/applicants/hooks/use-applicant-by-id"
import { markApplicantAsRead } from "@/lib/modules/applicants/services/applicants.service"
import { ApplicantFormViewer } from "./components/ApplicantFormViewer"
import { Loader2 } from "lucide-react"

export default function ApplicantDetailsPage() {
  const params = useParams()
  const applicantId = params.id as string

  const { applicant, isLoading, error, refetch } = useApplicantById(applicantId)

  useEffect(() => {
    if (applicant && !applicant.isRead) {
      markApplicantAsRead(applicantId, true)
        .then(() => {
          refetch()
        })
        .catch((err) => {
          console.error("Failed to mark applicant as read:", err)
        })
    }
  }, [applicant?.id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#037ECC] animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading applicant details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <p className="text-red-600 font-medium">Error loading applicant</p>
            <p className="text-red-500 text-sm mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!applicant) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <p className="text-yellow-600 font-medium">Applicant not found</p>
            <p className="text-yellow-500 text-sm mt-1">The requested applicant does not exist or has been deleted.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <ApplicantFormViewer applicant={applicant} />
    </div>
  )
}
