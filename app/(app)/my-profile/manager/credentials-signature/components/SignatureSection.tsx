"use client"

import { FileSignature } from "lucide-react"
import { SignatureCard } from "./SignatureCard"
import type { UserSignature } from "@/lib/types/user-credentials.types"

interface SignatureSectionProps {
  signature: UserSignature | null
  blocked: boolean
  isLoadingSignature?: boolean
  onOpenEditor: () => void
  onDelete: () => void
}

export function SignatureSection({
  signature,
  blocked,
  isLoadingSignature = false,
  onOpenEditor,
  onDelete,
}: SignatureSectionProps) {
  return (
    <div className="w-full lg:w-1/2">
      <div className="flex items-center gap-3 mb-4">
                <div>
          <h3 className="text-lg font-semibold text-gray-900">Signature</h3>
          <p className="text-sm text-gray-600">Single active digital signature per user.</p>
        </div>
      </div>

      {blocked && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50/60 p-3">
          <p className="text-sm text-red-800 font-medium">
            This user cannot sign documents because at least one credential is expired.
          </p>
        </div>
      )}

      <SignatureCard
        signature={signature}
        blocked={blocked}
        isLoading={isLoadingSignature}
        onOpenEditor={onOpenEditor}
        onDelete={onDelete}
      />
    </div>
  )
}
