"use client"

import { useRouter } from "next/navigation"
import { FileCheck, Plus } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { usePermission } from "@/lib/hooks/use-permission"
import { PermissionModule } from "@/lib/utils/permissions-new"
import { BatchClaimsTable } from "./components/BatchClaimsTable"

export default function BilledClaimsPage() {
  const router = useRouter()
  const { create: canCreate, edit: canEdit } = usePermission()
  const canCreateBatch = canCreate(PermissionModule.BILLED_CLAIMS)
  const canEditBatch = canEdit(PermissionModule.BILLED_CLAIMS)

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
            <FileCheck className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
              Billed Claims
            </h1>
            <p className="text-slate-600 mt-1">Group billable appointments into batches and generate claims</p>
          </div>
          {canCreateBatch && (
            <div className="ml-auto">
              <Button
                className="gap-2"
                onClick={() => router.push("/my-company/billing/billed-claims/create")}
              >
                <Plus className="h-4 w-4" />
                New Batch Claim
              </Button>
            </div>
          )}
        </div>

        <BatchClaimsTable canEdit={canEditBatch} />
      </div>
    </div>
  )
}
