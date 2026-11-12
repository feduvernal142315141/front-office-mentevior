"use client"

import { cn } from "@/lib/utils"
import { Clock } from "lucide-react"
import { forwardRef, useEffect, useLayoutEffect, useRef, useState, type ForwardedRef } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatTimeTo12h, formatTimeTo24h } from "@/lib/utils/time-format"

// ============================================
// Manual input model
// ============================================
//
// The manual input is edited as two segments (hours / minutes, up to 2 digits each)
// instead of a flat digit mask, so a selection, a deletion or a single digit can never
// shift minutes into the hours (the old "83:0" → 12:00 class of bugs).

type Segment = "h" | "m"
type Period = "AM" | "PM"

interface TimeDraft {
  hours: string
  minutes: string
}

interface Cursor {
  seg: Segment
  offset: number
}

const EMPTY_DRAFT: TimeDraft = { hours: "", minutes: "" }

function isEmptyDraft(d: TimeDraft): boolean {
  return !d.hours && !d.minutes
}

function isCompleteDraft(d: TimeDraft): boolean {
  return d.hours.length === 2 && d.minutes.length === 2
}

/** "08:" once the hours are full, so the caret visibly flows into the minutes. */
function draftToDisplay({ hours, minutes }: TimeDraft): string {
  if (!hours && !minutes) return ""
  if (hours.length === 2 || minutes) return `${hours}:${minutes}`
  return hours
}

function locate(d: TimeDraft, pos: number): Cursor {
  const colon = draftToDisplay(d).indexOf(":")
  if (colon === -1 || pos <= colon) return { seg: "h", offset: Math.min(pos, d.hours.length) }
  return { seg: "m", offset: Math.min(pos - colon - 1, d.minutes.length) }
}

function caretFor(d: TimeDraft, { seg, offset }: Cursor): number {
  if (seg === "h") return offset
  const colon = draftToDisplay(d).indexOf(":")
  return (colon === -1 ? d.hours.length : colon + 1) + offset
}

/**
 * Writes one digit like a native time field: a first hour digit 2-9 means "0X",
 * "1" waits for a second digit (10-12, otherwise it becomes 01 and the digit
 * moves to the minutes), and a first minute digit 6-9 means "0X".
 * Returns null when the digit can't be placed.
 */
function writeDigit(d: TimeDraft, at: Cursor, digit: string): { draft: TimeDraft; cursor: Cursor } | null {
  const cursor = at.seg === "h" && at.offset >= 2 ? { seg: "m" as const, offset: 0 } : at

  if (cursor.seg === "h") {
    const hours = d.hours.slice(0, cursor.offset) + digit
    if (hours.length === 1) {
      if (Number(digit) >= 2) return { draft: { ...d, hours: `0${digit}` }, cursor: { seg: "m", offset: 0 } }
      return { draft: { ...d, hours }, cursor: { seg: "h", offset: 1 } }
    }
    const n = Number(hours)
    if (n >= 1 && n <= 12) return { draft: { ...d, hours }, cursor: { seg: "m", offset: 0 } }
    if (hours[0] === "1") return writeDigit({ ...d, hours: "01" }, { seg: "m", offset: 0 }, digit)
    return null
  }

  if (cursor.offset >= 2) return null
  let minutes = d.minutes.slice(0, cursor.offset) + digit
  if (minutes.length === 1 && Number(digit) >= 6) minutes = `0${digit}`
  return { draft: { ...d, minutes }, cursor: { seg: "m", offset: minutes.length } }
}

/** Removes the displayed range [start, end) without shifting digits across segments. */
function removeRange(d: TimeDraft, start: number, end: number): { draft: TimeDraft; cursor: Cursor } {
  const a = locate(d, start)
  const b = locate(d, end)
  if (a.seg === b.seg) {
    const key = a.seg === "h" ? "hours" : "minutes"
    const s = d[key]
    return { draft: { ...d, [key]: s.slice(0, a.offset) + s.slice(b.offset) }, cursor: a }
  }
  return { draft: { hours: d.hours.slice(0, a.offset), minutes: d.minutes.slice(b.offset) }, cursor: a }
}

/** Replays typed text (paste, mobile keyboards) through the same rules as the keyboard. */
function draftFromText(text: string): { draft: TimeDraft; period: Period | null } {
  const period = /p/i.test(text) ? "PM" : /a/i.test(text) ? "AM" : null
  const match = text.match(/(\d{1,2})\s*[:.h]\s*(\d{1,2})/i)
  let draft = EMPTY_DRAFT
  let cursor: Cursor = { seg: "h", offset: 0 }

  const feed = (digits: string) => {
    for (const ch of digits) {
      const res = writeDigit(draft, cursor, ch)
      if (res) {
        draft = res.draft
        cursor = res.cursor
      }
    }
  }

  if (match) {
    // Explicit separator: "8:30" → hours "8", minutes "30"
    feed(match[1]!)
    if (draft.hours.length === 1) draft = { ...draft, hours: `0${draft.hours}` }
    cursor = { seg: "m", offset: 0 }
    feed(match[2]!)
  } else {
    feed(text.replace(/\D/g, "").slice(0, 4))
  }
  return { draft, period }
}

function draftFromValue(value: string): { draft: TimeDraft; period: Period } | null {
  const formatted = formatTimeTo12h(value)
  if (!formatted) return null
  const [timePart = "", p] = formatted.split(" ")
  const [hours = "", minutes = ""] = timePart.split(":")
  return { draft: { hours, minutes }, period: p === "PM" ? "PM" : "AM" }
}

function wrap(n: number, min: number, max: number): number {
  const span = max - min + 1
  return ((((n - min) % span) + span) % span) + min
}

// ============================================
// Main component
// ============================================

interface FloatingTimePickerProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  label: string
  hasError?: boolean
  required?: boolean
  disabled?: boolean
  allowManualInput?: boolean
  defaultPeriod?: "AM" | "PM"
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
const MINUTES = ["00", "15", "30", "45"]

function setForwardedRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (typeof ref === "function") {
    ref(value)
    return
  }
  if (ref) {
    ref.current = value
  }
}

export const FloatingTimePicker = forwardRef<HTMLElement, FloatingTimePickerProps>(function FloatingTimePicker({
  value,
  onChange,
  onBlur,
  label,
  hasError,
  required,
  disabled,
  allowManualInput = false,
  defaultPeriod = "AM",
}, ref) {
  const [isOpen, setIsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const hourRef = useRef<HTMLDivElement>(null)
  const minuteRef = useRef<HTMLDivElement>(null)

  // Manual input state — the parent always receives a 24h "HH:mm" string
  const initial = allowManualInput && value ? draftFromValue(value) : null
  const [draft, setDraft] = useState<TimeDraft>(initial?.draft ?? EMPTY_DRAFT)
  const [period, setPeriod] = useState<Period>(initial?.period ?? defaultPeriod)
  const inputRef = useRef<HTMLInputElement>(null)
  const prevValueRef = useRef(value)
  const pendingCaretRef = useRef<number | null>(null)

  const displayValue = draftToDisplay(draft)
  const [selectedHour, selectedMinute] = value ? value.split(":") : ["", ""]
  const hasValue = allowManualInput ? displayValue.length > 0 : Boolean(value)

  // Sync from external 24h value → draft (12h)
  useEffect(() => {
    if (!allowManualInput) return
    if (value === prevValueRef.current) return
    prevValueRef.current = value

    if (!value) {
      setDraft(EMPTY_DRAFT)
      setPeriod(defaultPeriod)
      return
    }
    const parsed = draftFromValue(value)
    if (!parsed) return
    setDraft(parsed.draft)
    setPeriod(parsed.period)
  }, [allowManualInput, value, defaultPeriod])

  // Place the caret after React has rendered the new display value
  useLayoutEffect(() => {
    const input = inputRef.current
    const pos = pendingCaretRef.current
    if (pos === null || !input || document.activeElement !== input) return
    pendingCaretRef.current = null
    input.setSelectionRange(pos, pos)
  })

  const emit = (next: string) => {
    if (next === prevValueRef.current) return
    prevValueRef.current = next
    onChange(next)
  }

  /** Pads and validates the draft, then sends it to the parent as 24h.
   *  An unusable hour (e.g. a lone "0") reverts to the last committed time. */
  const commitDraft = (d: TimeDraft, p: Period) => {
    if (isEmptyDraft(d)) {
      setDraft(EMPTY_DRAFT)
      emit("")
      return
    }

    const h = Number(d.hours)
    if (!d.hours || h < 1 || h > 12) {
      const previous = prevValueRef.current ? draftFromValue(prevValueRef.current) : null
      setDraft(previous?.draft ?? EMPTY_DRAFT)
      if (previous) setPeriod(previous.period)
      return
    }

    const hh = String(h).padStart(2, "0")
    const mm = d.minutes ? d.minutes.padEnd(2, "0") : "00"
    setDraft({ hours: hh, minutes: mm })
    const val24 = formatTimeTo24h(`${hh}:${mm} ${p}`)
    if (val24) emit(val24)
  }

  /** Applies an edit: complete times and fully cleared inputs reach the parent at once,
   *  partial ones wait for blur so typing "1" doesn't flash "01:00". */
  const applyDraft = (d: TimeDraft, cursor: Cursor) => {
    pendingCaretRef.current = caretFor(d, cursor)
    if (isCompleteDraft(d)) {
      commitDraft(d, period)
      return
    }
    setDraft(d)
    if (isEmptyDraft(d)) emit("")
  }

  const changePeriod = (p: Period) => {
    setPeriod(p)
    if (isCompleteDraft(draft) || (!isEmptyDraft(draft) && !isFocused)) commitDraft(draft, p)
  }

  const stepSegment = (seg: Segment, delta: number) => {
    const hours = seg === "h" ? wrap((Number(draft.hours) || 12) + delta, 1, 12) : Number(draft.hours) || 12
    const minutes = seg === "m"
      ? wrap((draft.minutes ? Number(draft.minutes.padEnd(2, "0")) : delta > 0 ? -1 : 0) + delta, 0, 59)
      : Number(draft.minutes.padEnd(2, "0")) || 0
    const next = { hours: String(hours).padStart(2, "0"), minutes: String(minutes).padStart(2, "0") }
    pendingCaretRef.current = caretFor(next, { seg, offset: 2 })
    commitDraft(next, period)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // IME / some mobile keyboards don't report real keys → handled by onChange
    if (e.key === "Unidentified" || e.nativeEvent.isComposing) return
    if (e.metaKey || e.ctrlKey || e.altKey) return

    const input = e.currentTarget
    const start = input.selectionStart ?? 0
    const end = input.selectionEnd ?? start
    const hasSelection = start !== end

    if (/^\d$/.test(e.key)) {
      e.preventDefault()
      // Typing over a selection replaces it, like any text field
      const base = hasSelection ? removeRange(draft, start, end) : { draft, cursor: locate(draft, start) }
      const res = writeDigit(base.draft, base.cursor, e.key)
      if (res) applyDraft(res.draft, res.cursor)
      else if (hasSelection) applyDraft(base.draft, base.cursor)
      return
    }

    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault()
      if (hasSelection) {
        const res = removeRange(draft, start, end)
        applyDraft(res.draft, res.cursor)
        return
      }

      const at = locate(draft, start)
      if (e.key === "Backspace") {
        if (at.seg === "m" && at.offset === 0) {
          if (!draft.hours) return
          const hours = draft.hours.slice(0, -1)
          applyDraft({ ...draft, hours }, { seg: "h", offset: hours.length })
        } else if (at.offset > 0) {
          const key = at.seg === "h" ? "hours" : "minutes"
          const s = draft[key]
          applyDraft({ ...draft, [key]: s.slice(0, at.offset - 1) + s.slice(at.offset) }, { seg: at.seg, offset: at.offset - 1 })
        }
        return
      }

      if (at.seg === "h" && at.offset < draft.hours.length) {
        applyDraft({ ...draft, hours: draft.hours.slice(0, at.offset) + draft.hours.slice(at.offset + 1) }, at)
      } else if (at.seg === "h") {
        applyDraft({ ...draft, minutes: draft.minutes.slice(1) }, at)
      } else if (at.offset < draft.minutes.length) {
        applyDraft({ ...draft, minutes: draft.minutes.slice(0, at.offset) + draft.minutes.slice(at.offset + 1) }, at)
      }
      return
    }

    // ":" "." or space jump to the minutes ("8:" → "08:")
    if (e.key === ":" || e.key === "." || e.key === " ") {
      e.preventDefault()
      if (!draft.hours) return
      const hours = draft.hours.length === 1 ? `0${draft.hours}` : draft.hours
      if (Number(hours) < 1) return
      applyDraft({ ...draft, hours }, { seg: "m", offset: draft.minutes.length })
      return
    }

    if (/^[aApP]$/.test(e.key)) {
      e.preventDefault()
      changePeriod(/p/i.test(e.key) ? "PM" : "AM")
      return
    }

    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault()
      stepSegment(locate(draft, start).seg, e.key === "ArrowUp" ? 1 : -1)
      return
    }

    if (e.key === "Enter") {
      commitDraft(draft, period)
      return
    }

    const allowed = ["ArrowLeft", "ArrowRight", "Home", "End", "Tab", "Escape"]
    if (allowed.includes(e.key)) return

    e.preventDefault()
  }

  /** Fallback for keyboards without key events (mobile/IME): reparse the whole text. */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { draft: next, period: p } = draftFromText(e.target.value)
    if (p) setPeriod(p)
    applyDraft(next, { seg: next.minutes ? "m" : "h", offset: next.minutes ? next.minutes.length : next.hours.length })
  }

  const handleInputPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const { draft: next, period: p } = draftFromText(e.clipboardData.getData("text"))
    if (isEmptyDraft(next)) return
    const nextPeriod = p ?? period
    setPeriod(nextPeriod)
    pendingCaretRef.current = draftToDisplay(next).length
    if (isCompleteDraft(next)) commitDraft(next, nextPeriod)
    else setDraft(next)
  }

  const handleInputBlur = () => {
    setIsFocused(false)
    commitDraft(draft, period)
    onBlur?.()
  }

  // Scroll to selected hour/minute when dropdown opens
  useEffect(() => {
    if (!isOpen) return
    const scrollTo = (scrollRef: React.RefObject<HTMLDivElement | null>, val: string) => {
      requestAnimationFrame(() => {
        const el = scrollRef.current?.querySelector(`[data-value="${val}"]`) as HTMLElement
        if (el && scrollRef.current) {
          scrollRef.current.scrollTop = el.offsetTop - scrollRef.current.clientHeight / 2 + el.offsetHeight / 2
        }
      })
    }
    scrollTo(hourRef, selectedHour)
    scrollTo(minuteRef, selectedMinute)
  }, [isOpen])

  const handleSelect = (hour: string, minute: string) => {
    onChange(`${hour}:${minute}`)
  }

  const popoverDisplayValue = hasValue ? `${selectedHour} : ${selectedMinute}` : ""

  // ─── Manual input mode ───
  if (allowManualInput) {
    return (
      <div className="w-full">
        <div className="relative w-full">
          {/* Hidden peer for floating label CSS */}
          <input
            aria-hidden
            readOnly
            tabIndex={-1}
            value={displayValue}
            placeholder=" "
            className="sr-only peer"
          />

          {/* Container */}
          <div
            className={cn(
              "w-full h-[52px] 2xl:h-[56px] rounded-[16px]",
              "flex items-center gap-0",
              "bg-gradient-to-b from-[hsl(240_20%_99%)] to-[hsl(240_18%_96%)]",
              "border transition-all duration-200 ease-out",
              hasError
                ? "border-2 border-red-500/70"
                : isFocused
                  ? "border-[hsl(var(--primary))] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_0_0_4px_hsl(var(--primary)/0.12),0_6px_14px_hsl(var(--primary)/0.18)] -translate-y-[1px] bg-gradient-to-b from-white to-[hsl(240_20%_99%)]"
                  : "border-[hsl(240_20%_88%/0.6)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_2px_rgba(15,23,42,0.04)] hover:border-[hsl(240_35%_75%/0.6)]",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {/* Clock icon */}
            <div className="pl-4 pr-2 flex items-center pointer-events-none">
              <Clock className={cn(
                "w-4 h-4 transition-colors",
                isFocused ? "text-[#037ECC]" : "text-slate-400"
              )} />
            </div>

            {/* Single masked input — A / P switch the period, ↑ / ↓ step the segment under the caret */}
            <input
              ref={(node) => {
                inputRef.current = node
                setForwardedRef(ref, node)
              }}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={displayValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              onPaste={handleInputPaste}
              onFocus={() => setIsFocused(true)}
              onBlur={handleInputBlur}
              placeholder={isFocused ? "hh:mm" : ""}
              disabled={disabled}
              aria-label={`${label} (hh:mm, ${period})`}
              aria-invalid={hasError || undefined}
              maxLength={5}
              className="flex-1 min-w-0 bg-transparent text-base sm:text-[15px] 2xl:text-[16px] font-medium tabular-nums tracking-wide text-[var(--color-login-text-primary)] outline-none placeholder:text-slate-300 placeholder:font-normal"
            />

            {/* AM / PM toggle */}
            <div className="flex items-center gap-0.5 pr-3">
              <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
                <button
                  type="button"
                  disabled={disabled}
                  tabIndex={-1}
                  aria-pressed={period === "AM"}
                  // Keep the caret in the input: the period is also typed with A / P
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => changePeriod("AM")}
                  className={cn(
                    "h-7 w-9 rounded-md text-[11px] font-bold tracking-wide transition-all duration-150",
                    period === "AM"
                      ? "bg-[#037ECC] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  AM
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  tabIndex={-1}
                  aria-pressed={period === "PM"}
                  // Keep the caret in the input: the period is also typed with A / P
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => changePeriod("PM")}
                  className={cn(
                    "h-7 w-9 rounded-md text-[11px] font-bold tracking-wide transition-all duration-150",
                    period === "PM"
                      ? "bg-[#037ECC] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          {/* Floating label */}
          <label
            className={cn(
              "absolute left-4 px-1 pointer-events-none transition-all duration-200 ease-out",
              "bg-white/20 backdrop-blur-md",
              isFocused || hasValue
                ? "top-0 -translate-y-1/2 text-xs"
                : "top-1/2 -translate-y-1/2 text-sm",
              isFocused
                ? "text-[#2563EB]"
                : "text-[var(--color-login-text-muted)]"
            )}
          >
            {label} {required && <span className="text-[#037ECC]">*</span>}
          </label>
        </div>
      </div>
    )
  }

  // ─── Popover mode (non-manual) ───
  return (
    <div className="w-full">
      <Popover
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open)
          if (!open) onBlur?.()
        }}
      >
        <PopoverTrigger asChild disabled={disabled}>
          <div className="relative">
            <button
              ref={(node) => setForwardedRef(ref, node)}
              type="button"
              disabled={disabled}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={cn(
                "flex items-center gap-3",
                "w-full",
                "h-[52px] 2xl:h-[56px]",
                "px-4 pr-12",
                "rounded-[16px]",
                "text-left",
                "text-base sm:text-[15px] 2xl:text-[16px]",
                "text-[var(--color-login-text-primary)]",
                "bg-gradient-to-b from-[hsl(240_20%_99%)] to-[hsl(240_18%_96%)]",
                hasError
                  ? "border-2 border-red-500/70"
                  : "border border-[hsl(240_20%_88%/0.6)]",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_2px_rgba(15,23,42,0.04)]",
                "hover:border-[hsl(240_35%_75%/0.6)]",
                "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_2px_6px_rgba(15,23,42,0.06)]",
                "focus:outline-none",
                "focus:border-[hsl(var(--primary))]",
                "focus:bg-gradient-to-b focus:from-white focus:to-[hsl(240_20%_99%)]",
                "focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_0_0_4px_hsl(var(--primary)/0.12),0_6px_14px_hsl(var(--primary)/0.18)]",
                "focus:-translate-y-[1px]",
                "transition-all duration-200 ease-out",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {hasValue && (
                <>
                  <Clock className="w-4 h-4 text-[#037ECC] shrink-0" />
                  <span>{popoverDisplayValue}</span>
                </>
              )}
            </button>

            <label
              className={cn(
                "absolute left-4 px-1 pointer-events-none",
                "transition-all duration-200 ease-out",
                isFocused || hasValue || isOpen
                  ? "top-0 -translate-y-1/2 text-xs bg-white"
                  : "top-1/2 -translate-y-1/2 text-sm",
                isFocused || isOpen
                  ? "text-[#2563EB]"
                  : "text-[var(--color-login-text-muted)]"
              )}
            >
              {label} {required && <span className="text-[#037ECC]">*</span>}
            </label>

            {!hasValue && (
              <Clock
                className={cn(
                  "absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none transition-colors",
                  isOpen ? "text-[#037ECC]" : "text-gray-400"
                )}
              />
            )}
          </div>
        </PopoverTrigger>

        <PopoverContent
          className="p-0 w-[200px] bg-white/95 backdrop-blur-xl border border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.12)] rounded-[16px]"
          align="start"
          sideOffset={8}
        >
          <div className="p-3 bg-gradient-to-br from-white to-gray-50/60 rounded-[16px]">
            {/* Header */}
            <div className="flex items-center justify-center gap-1 mb-3 pb-3 border-b border-slate-100">
              <Clock className="w-4 h-4 text-[#037ECC]" />
              <span className="text-xs font-semibold text-slate-600 tracking-wide uppercase">
                Select time
              </span>
            </div>

            {/* Columns */}
            <div className="flex gap-2">
              {/* Hours */}
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-slate-400 tracking-[0.15em] uppercase text-center mb-2">
                  Hr
                </p>
                <div
                  ref={hourRef}
                  className="h-[180px] overflow-y-auto overscroll-contain scrollbar-hide space-y-0.5"
                >
                  {HOURS.map((h) => {
                    const isSelected = h === selectedHour
                    return (
                      <button
                        key={h}
                        type="button"
                        data-value={h}
                        onClick={() => handleSelect(h, selectedMinute || "00")}
                        className={cn(
                          "w-full py-2 rounded-lg text-sm font-medium text-center transition-colors cursor-pointer",
                          isSelected
                            ? "bg-[#037ECC] text-white shadow-sm"
                            : "text-slate-700 hover:bg-[#037ECC]/10 hover:text-[#037ECC]"
                        )}
                      >
                        {h}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center">
                <span className="text-slate-300 font-light text-lg">:</span>
              </div>

              {/* Minutes */}
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-slate-400 tracking-[0.15em] uppercase text-center mb-2">
                  Min
                </p>
                <div
                  ref={minuteRef}
                  className="h-[180px] overflow-y-auto overscroll-contain scrollbar-hide space-y-0.5"
                >
                  {MINUTES.map((m) => {
                    const isSelected = m === selectedMinute
                    return (
                      <button
                        key={m}
                        type="button"
                        data-value={m}
                        onClick={() => {
                          handleSelect(selectedHour || "08", m)
                          setIsOpen(false)
                        }}
                        className={cn(
                          "w-full py-2 rounded-lg text-sm font-medium text-center transition-colors cursor-pointer",
                          isSelected
                            ? "bg-[#037ECC] text-white shadow-sm"
                            : "text-slate-700 hover:bg-[#037ECC]/10 hover:text-[#037ECC]"
                        )}
                      >
                        {m}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
})
