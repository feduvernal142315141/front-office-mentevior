"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, FileCheck, Lock } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { useAuth } from "@/lib/hooks/use-auth"
import { usePermission } from "@/lib/hooks/use-permission"
import { getBatchDecision } from "@/lib/modules/batch-claims/claim-md-status"
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

  /*
   * Un batch enviado a Claim.MD ya no se puede editar (confirmado con backend): el
   * 837P subido quedaría sin corresponder con lo que muestra la pantalla. El botón
   * del detalle ya no lleva aquí, pero la ruta es accesible por URL directa.
   */
  const isLocked = getBatchDecision(form.batchClaim?.claimMdEffectiveStatus).isLocked

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

        {!form.isLoadingBatch && !form.batchError && isLocked && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
              <Lock className="h-6 w-6 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-800">This batch was already submitted to Claim.MD</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              Its service log selection can no longer change, because the 837P file sent to the
              clearing house was generated from it.
            </p>
            <Button
              type="button"
              className="mt-6"
              onClick={() => router.push(`/my-company/billing/billed-claims/${id}`)}
            >
              Back to batch
            </Button>
          </div>
        )}

        {!form.isLoadingBatch && !form.batchError && !isLocked && (
          <BatchClaimForm
            form={form}
            onSaved={(savedId) => router.push(`/my-company/billing/billed-claims/${savedId}`)}
          />
        )}
      </div>
    </div>
  )
}
