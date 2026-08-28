"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Edit2, FileCheck, Lock } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { useBatchClaimById } from "@/lib/modules/batch-claims/hooks/use-batch-claim-by-id"
import { getBatchDecision } from "@/lib/modules/batch-claims/claim-md-status"
import { usePermission } from "@/lib/hooks/use-permission"
import { PermissionModule } from "@/lib/utils/permissions-new"
import { BatchClaimDetailView } from "../components/BatchClaimDetailView"

export default function BatchClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { edit: canEditModule } = usePermission()
  const { batchClaim, isLoading, error, refetch, isPolling, pollTimedOut } = useBatchClaimById(id, {
    poll: true,
  })

  const canEdit = canEditModule(PermissionModule.BILLED_CLAIMS)
  const decision = getBatchDecision(batchClaim?.claimMdTransmissionStatus)

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
              Batch Claim
            </h1>
            <p className="mt-1 text-slate-600">
              Review the batch, preview CMS-1500 forms and submit it to Claim.MD
            </p>
          </div>
          {canEdit && batchClaim && (
            <div className="ml-auto">
              {/*
                Una vez existe transmisión el batch queda congelado: editarlo dejaría el
                837P ya subido sin correspondencia con lo que muestra la pantalla.
              */}
              {decision.isLocked ? (
                <span
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-500"
                  title="This batch was already submitted to Claim.MD and can no longer be edited"
                >
                  <Lock className="h-4 w-4" />
                  Locked after submission
                </span>
              ) : (
                <Button
                  variant="secondary"
                  className="gap-2"
                  onClick={() => router.push(`/my-company/billing/billed-claims/${id}/edit`)}
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          )}
        </div>

        {isLoading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="animate-pulse space-y-4">
              <div className="mx-auto h-4 w-1/3 rounded bg-slate-200" />
              <div className="mx-auto h-4 w-1/2 rounded bg-slate-200" />
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="rounded-2xl border border-red-200 bg-white p-12 text-center shadow-sm">
            <p className="text-red-600">{error.message}</p>
          </div>
        )}

        {!isLoading && !error && !batchClaim && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="text-slate-500">Batch claim not found.</p>
          </div>
        )}

        {!isLoading && !error && batchClaim && (
          <BatchClaimDetailView
            batchClaim={batchClaim}
            canSubmit={canEdit}
            isPolling={isPolling}
            pollTimedOut={pollTimedOut}
            onRefresh={refetch}
          />
        )}
      </div>
    </div>
  )
}
