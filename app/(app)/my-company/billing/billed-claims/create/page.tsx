"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, FileCheck } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { useAuth } from "@/lib/hooks/use-auth"
import { usePermission } from "@/lib/hooks/use-permission"
import { PermissionModule } from "@/lib/utils/permissions-new"
import { BatchClaimForm } from "../components/BatchClaimForm"
import { useBatchClaimForm } from "../hooks/useBatchClaimForm"

export default function CreateBatchClaimPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { create: canCreate } = usePermission()
  const form = useBatchClaimForm()

  const canCreateBatch = canCreate(PermissionModule.BILLED_CLAIMS)
  useEffect(() => {
    if (user && !canCreateBatch) router.replace("/my-company/billing/billed-claims")
  }, [user, canCreateBatch, router])

  if (!canCreateBatch) return null

  return (
    <div className="px-6 py-6">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="secondary"
            className="h-10 w-10 p-0"
            onClick={() => router.push("/my-company/billing/billed-claims")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="rounded-xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 p-3">
            <FileCheck className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-3xl font-bold text-transparent">
              New Batch Claim
            </h1>
            <p className="mt-1 text-slate-600">Select a payer plan and the service logs to include in the batch</p>
          </div>
        </div>

        <BatchClaimForm
          form={form}
          onSaved={(id) => router.push(`/my-company/billing/billed-claims/${id}`)}
        />
      </div>
    </div>
  )
}
