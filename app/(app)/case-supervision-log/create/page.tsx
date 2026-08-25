"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, ClipboardCheck } from "lucide-react"
import { CaseSupervisionLogForm } from "../components/CaseSupervisionLogForm"
import { useRequirePermission } from "@/lib/hooks/use-require-permission"
import { PermissionAction, PermissionModule } from "@/lib/utils/permissions-new"

export default function CreateCaseSupervisionLogPage() {
  const router = useRouter()
  const canCreate = useRequirePermission(PermissionModule.CASE_SUPERVISION, PermissionAction.CREATE)

  if (!canCreate) {
    return null
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center gap-4">
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
              New Case Supervision Log
            </h1>
            <p className="mt-1 text-slate-600">
              Pick the period and review what will be recorded
            </p>
          </div>
        </div>

        <CaseSupervisionLogForm />
      </div>
    </div>
  )
}
