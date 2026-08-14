"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, FileCheck } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { useAuth } from "@/lib/hooks/use-auth"
import { usePermission } from "@/lib/hooks/use-permission"
import { PermissionModule } from "@/lib/utils/permissions-new"
import { BatchClaimForm } from "../../components/BatchClaimForm"
import { useBatchClaimForm } from "../../hooks/useBatchClaimForm"

export default function EditBatchClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const { edit: canEdit } = usePermission()
  const form = useBatchClaimForm({ batchClaimId: id })

  const canEditBatch = canEdit(PermissionModule.BILLED_CLAIMS)
  useEffect(() => {
    if (user && !canEditBatch) router.replace("/my-company/billing/billed-claims")
  }, [user, canEditBatch, router])

  if (!canEditBatch) return null

  return (
    <div className="px-6 py-6">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="secondary"
            className="h-10 w-10 p-0"
            onClick={() => router.push(`/my-company/billing/billed-claims/${id}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="rounded-xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 p-3">
            <FileCheck className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-3xl font-bold text-transparent">
              Edit Batch Claim
            </h1>
            <p className="mt-1 text-slate-600">
              Saving replaces the batch&apos;s service log selection with the current one
            </p>
          </div>
        </div>

        {form.isLoadingBatch && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="animate-pulse space-y-4">
              <div className="mx-auto h-4 w-1/3 rounded bg-slate-200" />
              <div className="mx-auto h-4 w-1/2 rounded bg-slate-200" />
            </div>
          </div>
        )}

        {form.batchError && !form.isLoadingBatch && (
          <div className="rounded-2xl border border-red-200 bg-white p-12 text-center shadow-sm">
            <p className="text-red-600">{form.batchError.message}</p>
          </div>
        )}

        {!form.isLoadingBatch && !form.batchError && (
          <BatchClaimForm
            form={form}
            onSaved={(savedId) => router.push(`/my-company/billing/billed-claims/${savedId}`)}
          />
        )}
      </div>
    </div>
  )
}
