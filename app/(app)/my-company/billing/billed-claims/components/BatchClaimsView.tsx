"use client"

import { useRouter } from "next/navigation"
import { FileCheck, FileX, Plus } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { usePermission } from "@/lib/hooks/use-permission"
import { PermissionModule } from "@/lib/utils/permissions-new"
import { BatchClaimsTable } from "./BatchClaimsTable"

export function BatchClaimsView({ deniedOnly = false }: { deniedOnly?: boolean }) {
  const router = useRouter()
  const { view, create: canCreate, edit: canEdit, remove: canDelete } = usePermission()
  const canCreateBatch = !deniedOnly && canCreate(PermissionModule.BILLED_CLAIMS)
  const canEditBatch = canEdit(PermissionModule.BILLED_CLAIMS)
  const Icon = deniedOnly ? FileX : FileCheck

  if (deniedOnly && !view(PermissionModule.BILLED_CLAIMS)) return null

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
            <Icon className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
              {deniedOnly ? "Denied Batch Claim" : "Batch Claims"}
            </h1>
            <p className="text-slate-600 mt-1">
              {deniedOnly
                ? "Review denied and rejected batch claims"
                : "Group billable appointments into batches and generate claims"}
            </p>
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

        <BatchClaimsTable
          deniedOnly={deniedOnly}
          canEdit={canEditBatch}
          canDelete={canDelete(PermissionModule.BILLED_CLAIMS)}
        />
      </div>
    </div>
  )
}
