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

/**
 * Acciones sobre el campo, en una fila propia encima: dentro de la caja tapaban
 * la guía y el texto ya escrito.
 */
const PILL_BASE =
  "inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100"

const GHOST_PILL = cn(
  PILL_BASE,
  "border border-slate-200 bg-white text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
  "hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700",
)

const AI_PILL = cn(
  PILL_BASE,
  "border border-[#037ECC]/25 bg-gradient-to-b from-white to-[#037ECC]/[0.07] text-[#037ECC]",
  "shadow-[0_1px_2px_rgba(3,126,204,0.08)]",
  "hover:border-[#037ECC]/45 hover:from-[#037ECC]/[0.07] hover:to-[#079CFB]/[0.14]",
  "hover:shadow-[0_3px_12px_rgba(3,126,204,0.18)]",
  "disabled:border-slate-200 disabled:from-white disabled:to-white disabled:text-slate-400 disabled:shadow-none",
)

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
    <div className="space-y-4">
      {/* ABC — ephemeral clinician notes; this is what goes in `text` to the AI */}
      <div className="space-y-2">
        {!disabled && (
          <div className="flex items-center justify-end gap-2">
            {hasAbc && (
              <button type="button" onClick={handleClearAbc} className={GHOST_PILL}>
                <Eraser className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={handleImprove}
              disabled={isLoading || !hasAbc}
              title={hasAbc ? undefined : "Write ABC notes before generating"}
              className={AI_PILL}
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {actionLabel}
            </button>
          </div>
        )}
        <FloatingTextarea
          label="ABC"
          value={abcNotes}
          onChange={onAbcNotesChange}
          onBlur={() => {}}
          guidance={AI_ABC_GUIDANCE}
          rows={4}
          disabled={disabled}
        />
      </div>

      {/* Summary / Narrative — persisted clinical text; never sent as AI `text` */}
      <div className="space-y-2">
        {!disabled && canUndo && (
          <div className="flex items-center justify-end">
            <button type="button" onClick={handleUndo} className={GHOST_PILL}>
              <Undo2 className="h-3.5 w-3.5" />
              Undo
            </button>
          </div>
        )}
        <FloatingTextarea
          label={label}
          value={summaryText}
          onChange={handleSummaryChange}
          disabled={disabled}
          {...rest}
        />
      </div>
    </div>
  )
}
