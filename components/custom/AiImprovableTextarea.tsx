"use client"

import { useRef, useState } from "react"
import { Loader2, Sparkles, Undo2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { FloatingTextarea, type FloatingTextareaProps } from "./FloatingTextarea"
import { useImproveAppointmentNoteSummary } from "@/lib/modules/appointment-notes/hooks/use-improve-appointment-note-summary"
import type { AppointmentNoteSummaryType } from "@/lib/types/appointment-note-ai-summary.types"

interface AiImprovableTextareaProps extends FloatingTextareaProps {
  billingCode: string
  summaryType?: AppointmentNoteSummaryType
  /** Resolved fresh on every click so it always reflects the current form state */
  buildMetadata: () => Record<string, unknown>
}

/**
 * FloatingTextarea + an "Improve with AI" action that calls the Bedrock
 * improve-summary endpoint and swaps the field's text in place (with Undo).
 */
export function AiImprovableTextarea({
  billingCode,
  summaryType,
  buildMetadata,
  value,
  onChange,
  disabled,
  ...rest
}: AiImprovableTextareaProps) {
  const { improve, isLoading } = useImproveAppointmentNoteSummary()
  const previousValueRef = useRef<string | null>(null)
  const [canUndo, setCanUndo] = useState(false)

  const handleImprove = async () => {
    const suggested = await improve({
      billingCode,
      summaryType,
      text: value,
      metadata: JSON.stringify(buildMetadata()),
    })
    if (suggested == null) return
    previousValueRef.current = value
    setCanUndo(true)
    onChange(suggested)
  }

  const handleUndo = () => {
    if (previousValueRef.current != null) onChange(previousValueRef.current)
    setCanUndo(false)
  }

  const handleChange = (v: string) => {
    if (canUndo) setCanUndo(false)
    onChange(v)
  }

  return (
    <div className="relative">
      <FloatingTextarea value={value} onChange={handleChange} disabled={disabled} {...rest} />
      {!disabled && (
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
          {canUndo && (
            <button
              type="button"
              onClick={handleUndo}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-500 shadow-sm backdrop-blur transition-colors hover:border-slate-300 hover:text-slate-700"
            >
              <Undo2 className="h-3 w-3" />
              Undo
            </button>
          )}
          <button
            type="button"
            onClick={handleImprove}
            disabled={isLoading}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-[#037ECC]/30 bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#037ECC] shadow-sm backdrop-blur transition-colors",
              "hover:bg-[#037ECC]/10 hover:border-[#037ECC]/50",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            Improve with AI
          </button>
        </div>
      )}
    </div>
  )
}
