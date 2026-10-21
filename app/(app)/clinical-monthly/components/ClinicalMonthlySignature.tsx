"use client"

import { useState } from "react"
import { PenLine } from "lucide-react"
import { SignatureEditorModal } from "@/app/(app)/my-profile/manager/credentials-signature/components/SignatureEditorModal"
import { Button } from "@/components/custom/Button"
import { CustomModal } from "@/components/custom/CustomModal"
import { useSignature } from "@/lib/modules/signature/hooks/use-signature"
import { cn } from "@/lib/utils"

interface ClinicalMonthlySignatureProps {
  memberUserId: string | null
  signature: string | null
  onChange: (dataUrl: string | null) => void
  disabled?: boolean
  hasError?: boolean
}

export function ClinicalMonthlySignature({
  memberUserId,
  signature,
  onChange,
  disabled = false,
  hasError = false,
}: ClinicalMonthlySignatureProps) {
  const [editing, setEditing] = useState(false)
  const [choosing, setChoosing] = useState(false)
  const { signature: registeredSignature, isLoading: isLoadingRegisteredSignature } = useSignature(
    memberUserId,
    !disabled,
  )

  const handleEdit = () => {
    if (disabled || isLoadingRegisteredSignature) return
    if (registeredSignature?.url) {
      setChoosing(true)
      return
    }
    setEditing(true)
  }

  const handleUseRegisteredSignature = () => {
    if (!registeredSignature?.url) return
    onChange(registeredSignature.url)
    setChoosing(false)
  }

  const handleSave = (base64: string) => {
    onChange(`data:image/png;base64,${base64}`)
    setEditing(false)
  }

  const isDisabled = disabled || isLoadingRegisteredSignature

  return (
    <div className="space-y-3" data-section="creator-signature">
      <div className={cn(
        "overflow-hidden rounded-2xl border bg-white",
        hasError ? "border-red-300" : "border-[#037ECC]/20",
      )}>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="border-b px-6 py-5 sm:border-b-0 sm:border-r border-[#037ECC]/10">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-[#037ECC]/70">
              Report creator
            </span>
            <p className="text-sm font-semibold text-slate-800">Your signature</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Choose a registered signature or draw a new one for this report.
            </p>
          </div>

          <div className="px-6 py-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#037ECC]/70">
                Signature
              </span>
              {!isDisabled && (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:border-[#037ECC]/40 hover:text-[#037ECC]"
                  title="Edit signature"
                  aria-label="Edit creator signature"
                >
                  <PenLine className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="relative flex min-h-[64px] items-end pb-3">
              {signature ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={signature}
                  alt="Creator signature"
                  className="max-h-[52px] max-w-full object-contain brightness-50 contrast-150"
                />
              ) : (
                <button
                  type="button"
                  onClick={handleEdit}
                  disabled={isDisabled}
                  className="text-xs italic text-slate-300 transition-colors hover:text-[#037ECC] disabled:hover:text-slate-300"
                >
                  {isLoadingRegisteredSignature ? "Loading registered signature..." : "Click to sign"}
                </button>
              )}
              <div className="absolute bottom-0 left-0 right-0 border-b border-[#037ECC]/20" />
            </div>
          </div>
        </div>
      </div>

      {hasError && (
        <p className="text-xs font-medium text-red-500">The creator signature is required</p>
      )}

      <SignatureEditorModal
        open={editing}
        onOpenChange={(open) => !open && setEditing(false)}
        onSave={handleSave}
      />

      <CustomModal
        open={choosing}
        onOpenChange={(open) => !open && setChoosing(false)}
        title="Creator signature"
        description="You already have a registered signature. Choose how to sign this Clinical Monthly."
        maxWidthClassName="sm:max-w-[520px]"
      >
        <div className="space-y-4 p-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            {/* The registered signature is read-only; choosing it never updates the saved signature. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={registeredSignature?.url}
              alt="Registered signature"
              className="max-h-24 max-w-full object-contain brightness-50 contrast-150"
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setChoosing(false)
                setEditing(true)
              }}
            >
              Use a new signature
            </Button>
            <Button onClick={handleUseRegisteredSignature}>
              Use registered signature
            </Button>
          </div>
        </div>
      </CustomModal>
    </div>
  )
}
