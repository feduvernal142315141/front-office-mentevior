"use client"

import { CheckCircle2, Loader2, SearchCheck, XCircle } from "lucide-react"

import { Button } from "@/components/custom/Button"
import { CustomModal } from "@/components/custom/CustomModal"
import type { ClaimMdResolveUnknownResult } from "@/lib/types/claim-md.types"

interface ClaimMdVerifyUnknownModalProps {
  open: boolean
  onClose: () => void
  isResolving: boolean
  result: ClaimMdResolveUnknownResult | null
  onVerify: () => void
  onRetry: () => void
}

/**
 * Flujo de resolución de UNKNOWN. La consulta al `uploadlist` de Claim.MD no reenvía
 * nada: sólo determina si el archivo llegó, que es lo que decide si el retry es seguro
 * o duplicaría los claims.
 */
export function ClaimMdVerifyUnknownModal({
  open,
  onClose,
  isResolving,
  result,
  onVerify,
  onRetry,
}: ClaimMdVerifyUnknownModalProps) {
  const wasReceived = result?.foundInUploadList === true
  const wasNotReceived = result != null && result.foundInUploadList === false

  return (
    <CustomModal
      open={open}
      onOpenChange={(next) => {
        if (!next && !isResolving) onClose()
      }}
      title="Verify in Claim.MD"
      description="Check whether Claim.MD received the file before doing anything else"
      maxWidthClassName="sm:max-w-[560px]"
      constrainHeight
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {!result && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                The upload finished without a clear answer, so we cannot tell whether Claim.MD
                received the 837P file.
              </p>
              <p className="text-sm text-slate-600">
                This check reads Claim.MD&apos;s upload list. It does not resend anything. Once we
                know the answer, retrying is either unnecessary or safe.
              </p>
            </div>
          )}

          {wasReceived && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Claim.MD has the file</p>
                  <p className="mt-1 text-sm text-emerald-700">
                    Do not resend it — that would duplicate the claims. The claim status will
                    refresh when you close this.
                  </p>
                </div>
              </div>
              {result?.message && <p className="text-xs text-slate-500">{result.message}</p>}
            </div>
          )}

          {wasNotReceived && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    Claim.MD never received the file
                  </p>
                  <p className="mt-1 text-sm text-amber-700">
                    Retrying the upload is safe now. The stored 837P is reused as-is.
                  </p>
                </div>
              </div>
              {result?.message && <p className="text-xs text-slate-500">{result.message}</p>}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isResolving}>
            {result ? "Close" : "Cancel"}
          </Button>

          {!result && (
            <Button type="button" className="gap-2" onClick={onVerify} disabled={isResolving}>
              {isResolving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SearchCheck className="h-4 w-4" />
              )}
              Check Claim.MD
            </Button>
          )}

          {wasNotReceived && (
            <Button type="button" onClick={onRetry} disabled={isResolving}>
              Retry upload
            </Button>
          )}
        </div>
      </div>
    </CustomModal>
  )
}
