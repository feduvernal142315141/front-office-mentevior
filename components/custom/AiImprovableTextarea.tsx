"use client"

import { useRef, useState } from "react"
import { Eraser, Loader2, Sparkles, Undo2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { FloatingTextarea, type FloatingTextareaProps } from "./FloatingTextarea"
import { useImproveAppointmentNoteSummary } from "@/lib/modules/appointment-notes/hooks/use-improve-appointment-note-summary"
import type { AppointmentNoteSummaryType } from "@/lib/types/appointment-note-ai-summary.types"
import type { FieldGuidance } from "@/lib/constants/field-guidance"

/** Guía del campo ABC: notas crudas que alimentan la generación, no el texto facturable. */
export const AI_ABC_GUIDANCE: FieldGuidance = {
  intro: "Capture the raw observations the AI should turn into the narrative. Keep it factual — Antecedent, Behavior, Consequence, plus anything else that mattered in the session.",
  bullets: [
    { text: "A — Antecedent: what happened right before (demand, transition, denied access…)." },
    { text: "B — Behavior: what the client did (topography, frequency, duration, intensity)." },
    { text: "C — Consequence: what followed (attention, escape, redirection, reinforcer…)." },
  ],
  examplesLabel: "Example:",
  examples: [
    "A: asked to put toys away. B: screamed and threw chair ×3. C: demand removed for 2 min; then restarted with prompt.",
  ],
}

interface AiImprovableTextareaProps extends FloatingTextareaProps {
  billingCode: string
  summaryType?: AppointmentNoteSummaryType
  /** Resolved fresh on every click so it always reflects the current form state */
  buildMetadata: () => Record<string, unknown>
  /**
   * Ephemeral ABC / observation notes. Lifted to the parent so section toggles
   * (97155) don't wipe them. Never sent on note save — only as `text` to the AI.
   */
  abcNotes: string
  onAbcNotesChange: (value: string) => void
}

/**
 * FloatingTextarea + an ephemeral ABC field above it. Generate / Improve always
 * sends the ABC content as `text` (never the summary draft). The AI result is
 * written into the summary. ABC clears after a successful generate; Undo restores
 * both the previous summary and the ABC notes.
 */
export function AiImprovableTextarea({
  billingCode,
  summaryType,
  buildMetadata,
  abcNotes,
  onAbcNotesChange,
  value,
  onChange,
  disabled,
  label,
  ...rest
}: AiImprovableTextareaProps) {
  const { improve, isLoading } = useImproveAppointmentNoteSummary()
  const previousValueRef = useRef<string | null>(null)
  const previousAbcRef = useRef<string | null>(null)
  const [canUndo, setCanUndo] = useState(false)

  const summaryText = value ?? ""
  const abc = abcNotes.trim()
  const hasAbc = abc.length > 0
  const hasSummary = summaryText.trim().length > 0
  const actionLabel = hasSummary ? "Improve with AI" : "Generate with AI"

  const handleImprove = async () => {
    if (!hasAbc || isLoading) return
    const suggested = await improve({
      billingCode,
      summaryType,
      text: abc,
      metadata: JSON.stringify(buildMetadata()),
    })
    if (suggested == null) return
    previousValueRef.current = summaryText
    previousAbcRef.current = abcNotes
    setCanUndo(true)
    onChange(suggested)
    onAbcNotesChange("")
  }

  const handleUndo = () => {
    if (previousValueRef.current != null) onChange(previousValueRef.current)
    if (previousAbcRef.current != null) onAbcNotesChange(previousAbcRef.current)
    previousValueRef.current = null
    previousAbcRef.current = null
    setCanUndo(false)
  }

  const handleSummaryChange = (v: string) => {
    if (canUndo) setCanUndo(false)
    onChange(v)
  }

  const handleClearAbc = () => {
    onAbcNotesChange("")
  }

  return (
    <div className="space-y-3">
      {/* ABC — ephemeral clinician notes; this is what goes in `text` to the AI */}
      <div className="relative">
        <FloatingTextarea
          label="ABC"
          value={abcNotes}
          onChange={onAbcNotesChange}
          onBlur={() => {}}
          guidance={AI_ABC_GUIDANCE}
          rows={4}
          disabled={disabled}
        />
        {!disabled && (
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
            {hasAbc && (
              <button
                type="button"
                onClick={handleClearAbc}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-500 shadow-sm backdrop-blur transition-colors hover:border-slate-300 hover:text-slate-700"
              >
                <Eraser className="h-3 w-3" />
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={handleImprove}
              disabled={isLoading || !hasAbc}
              title={hasAbc ? undefined : "Write ABC notes before generating"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-[#037ECC]/30 bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#037ECC] shadow-sm backdrop-blur transition-colors",
                "hover:bg-[#037ECC]/10 hover:border-[#037ECC]/50",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              {actionLabel}
            </button>
          </div>
        )}
      </div>

      {/* Summary / Narrative — persisted clinical text; never sent as AI `text` */}
      <div className="relative">
        <FloatingTextarea
          label={label}
          value={summaryText}
          onChange={handleSummaryChange}
          disabled={disabled}
          {...rest}
        />
        {!disabled && canUndo && (
          <div className="absolute right-3 top-3 z-10">
            <button
              type="button"
              onClick={handleUndo}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-500 shadow-sm backdrop-blur transition-colors hover:border-slate-300 hover:text-slate-700"
            >
              <Undo2 className="h-3 w-3" />
              Undo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
