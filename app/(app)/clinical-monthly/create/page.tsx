"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Hospital } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { ClinicalMonthlyForm } from "../components/ClinicalMonthlyForm"
import { useRequirePermission } from "@/lib/hooks/use-require-permission"
import { PermissionAction, PermissionModule } from "@/lib/utils/permissions-new"

export default function CreateClinicalMonthlyPage() {
  const router = useRouter()
  const canCreate = useRequirePermission(PermissionModule.CLINICAL_MONTHLY, PermissionAction.CREATE)

  if (!canCreate) {
    return null
  }

  return (
    <div className="px-6 py-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="secondary"
            className="h-10 w-10 p-0"
            onClick={() => router.push("/clinical-monthly")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
            <Hospital className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
              New Clinical Monthly
            </h1>
            <p className="text-slate-600 mt-1">
              Report monthly progress for each service plan item
            </p>
          </div>
        </div>

        <ClinicalMonthlyForm />
      </div>
    </div>
  )
}
