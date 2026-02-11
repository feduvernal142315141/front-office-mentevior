"use client"

import { FileSignature, PenLine, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { UserSignature } from "@/lib/types/user-credentials.types"

interface SignatureCardProps {
  signature: UserSignature | null
  blocked?: boolean
  onOpenEditor: () => void
  onDelete?: () => void
}

export function SignatureCard({
  signature,
  blocked = false,
  onOpenEditor,
  onDelete,
}: SignatureCardProps) {
  if (!signature) {
    return (
      <button
        type="button"
        onClick={onOpenEditor}
        disabled={blocked}
        className={cn(
          "w-full rounded-xl border-2 border-dashed px-4 py-6 text-left transition-all duration-200",
          "border-blue-200 bg-blue-50/30 hover:bg-blue-50/50 hover:border-[#037ECC]/50",
          blocked && "opacity-60 cursor-not-allowed hover:bg-blue-50/30 hover:border-blue-200"
        )}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#037ECC]/10 border border-[#037ECC]/20 flex items-center justify-center">
            <FileSignature className="h-5 w-5 text-[#037ECC]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">No signature on file</p>
            <p className="text-xs text-slate-600 mt-1">Click to create a digital signature.</p>
          </div>
        </div>
      </button>
    )
  }

  const imageDataUrl = `data:image/png;base64,${signature.imageBase64}`

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-500">Current signature preview</p>
        <div className="inline-flex items-center gap-1.5">
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={blocked}
              className={cn(
                "h-7 w-7 rounded-lg border border-gray-200 bg-white inline-flex items-center justify-center",
                "text-gray-500 hover:text-red-600 hover:border-red-300 transition-all duration-150",
                blocked && "opacity-50 cursor-not-allowed hover:text-gray-500 hover:border-gray-200"
              )}
              title="Delete signature"
              aria-label="Delete signature"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onOpenEditor}
            disabled={blocked}
            className={cn(
              "h-7 w-7 rounded-lg border border-gray-200 bg-white inline-flex items-center justify-center",
              "text-gray-500 hover:text-[#037ECC] hover:border-[#037ECC]/40 transition-all duration-150",
              blocked && "opacity-50 cursor-not-allowed hover:text-gray-500 hover:border-gray-200"
            )}
            title="Edit signature"
            aria-label="Edit signature"
          >
            <PenLine className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="rounded-lg bg-white border border-gray-200 px-3 py-2 min-h-[82px] flex items-center">
        <img src={imageDataUrl} alt="Digital signature preview" className="max-h-[70px] object-contain" />
      </div>

      {signature.updatedAt && (
        <p className="text-xs text-gray-500 mt-2">
          Last update: {new Date(signature.updatedAt).toLocaleString()}
        </p>
      )}
    </div>
  )
}
