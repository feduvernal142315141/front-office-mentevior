"use client"

import { cn } from "@/lib/utils"
import { Clock } from "lucide-react"
import { forwardRef, useCallback, useEffect, useRef, useState, type ForwardedRef } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatTimeTo12h, formatTimeTo24h } from "@/lib/utils/time-format"

// ============================================
// Segmented time input helpers
// ============================================

/** Clamp a numeric string to [min, max] and pad to 2 digits */
function clampAndPad(value: string, min: number, max: number): string {
  const n = parseInt(value, 10)
  if (Number.isNaN(n)) return String(min).padStart(2, "0")
  return String(Math.min(Math.max(n, min), max)).padStart(2, "0")
}

// ============================================
// SegmentInput — a single HH or MM field
// ============================================

interface SegmentInputProps {
  value: string
  onChange: (v: string) => void
  onFocus: () => void
  onBlur: () => void
  /** Move focus to the next segment */
  onNext?: () => void
  /** Move focus to the previous segment */
  onPrev?: () => void
  min: number
  max: number
  placeholder: string
  disabled?: boolean
  "aria-label"?: string
}

const SegmentInput = forwardRef<HTMLInputElement, SegmentInputProps>(function SegmentInput({
  value,
  onChange,
  onFocus,
  onBlur,
  onNext,
  onPrev,
  min,
  max,
  placeholder,
  disabled,
  "aria-label": ariaLabel,
}, segmentRef) {
  const inputRef = useRef<HTMLInputElement>(null)
  const bufferRef = useRef("")

  const commitBuffer = useCallback(() => {
    const buf = bufferRef.current
    if (!buf) return
    onChange(clampAndPad(buf, min, max))
    bufferRef.current = ""
  }, [onChange, min, max])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const { key } = e

    if (key === "Tab") {
      commitBuffer()
      return // let browser handle Tab naturally
    }

    if (key === "ArrowRight" || key === ":") {
      e.preventDefault()
      commitBuffer()
      onNext?.()
      return
    }

    if (key === "ArrowLeft") {
      e.preventDefault()
      commitBuffer()
      onPrev?.()
      return
    }

    if (key === "ArrowUp") {
      e.preventDefault()
      const n = parseInt(value || String(min), 10)
      const next = n >= max ? min : n + 1
      onChange(String(next).padStart(2, "0"))
      bufferRef.current = ""
      return
    }

    if (key === "ArrowDown") {
      e.preventDefault()
      const n = parseInt(value || String(min), 10)
      const next = n <= min ? max : n - 1
      onChange(String(next).padStart(2, "0"))
      bufferRef.current = ""
      return
    }

    if (key === "Backspace" || key === "Delete") {
      e.preventDefault()
      if (bufferRef.current.length > 0) {
        bufferRef.current = bufferRef.current.slice(0, -1)
        if (bufferRef.current.length === 0) {
          onChange("")
        } else {
          onChange(clampAndPad(bufferRef.current, min, max))
        }
      } else {
        onChange("")
        onPrev?.()
      }
      return
    }

    // Only allow digits
    if (!/^\d$/.test(key)) {
      e.preventDefault()
      return
    }

    e.preventDefault()
    const buf = bufferRef.current + key

    if (buf.length >= 2) {
      onChange(clampAndPad(buf, min, max))
      bufferRef.current = ""
      onNext?.()
    } else {
      // If first digit already determines the value must be single-digit range
      // e.g. for hours (1-12): typing "2"-"9" immediately completes to "02"-"09"
      const firstDigit = parseInt(buf, 10)
      if (firstDigit > Math.floor(max / 10)) {
        onChange(clampAndPad(buf, min, max))
        bufferRef.current = ""
        onNext?.()
      } else {
        bufferRef.current = buf
        // Show the partial digit as preview
        onChange(buf.padStart(2, "0"))
      }
    }
  }

  return (
    <input
      ref={(node) => {
        inputRef.current = node
        setForwardedRef(segmentRef, node)
      }}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={value}
      readOnly
      placeholder={placeholder}
      disabled={disabled}
      aria-label={ariaLabel}
      onFocus={(e) => {
        bufferRef.current = ""
        e.target.select()
        onFocus()
      }}
      onBlur={() => {
        commitBuffer()
        onBlur()
      }}
      onKeyDown={handleKeyDown}
      className={cn(
        "w-[28px] text-center bg-transparent outline-none",
        "text-[15px] 2xl:text-[16px] font-medium tabular-nums tracking-wide",
        "text-[var(--color-login-text-primary)]",
        "placeholder:text-slate-300 placeholder:font-normal",
        "select-all cursor-default",
        "rounded-md transition-colors duration-100",
        "focus:bg-[#037ECC]/10",
      )}
    />
  )
})

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

  // Segmented state
  const [hours12, setHours12] = useState("")
  const [minutes, setMinutes] = useState("")
  const [period, setPeriod] = useState<"AM" | "PM">(defaultPeriod)

  const hourInputRef = useRef<HTMLInputElement>(null)
  const minuteInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [selectedHour, selectedMinute] = value ? value.split(":") : ["", ""]
  const hasValue = allowManualInput ? (hours12.length > 0 || minutes.length > 0) : Boolean(value)

  // Sync from external value → segments
  useEffect(() => {
    if (!allowManualInput) return

    if (!value) {
      setHours12("")
      setMinutes("")
      setPeriod(defaultPeriod)
      return
    }

    const formatted12h = formatTimeTo12h(value)
    if (!formatted12h) return

    const [timePart, parsedPeriod] = formatted12h.split(" ")
    const [h, m] = timePart.split(":")
    setHours12(h)
    setMinutes(m)
    setPeriod(parsedPeriod === "PM" ? "PM" : "AM")
  }, [allowManualInput, value])

  // Commit segments → 24h value
  const commitValue = useCallback((h: string, m: string, p: "AM" | "PM") => {
    if (!h && !m) {
      onChange("")
      return
    }

    const hVal = h || "12"
    const mVal = m || "00"
    const normalized = formatTimeTo24h(`${hVal}:${mVal} ${p}`)
    if (normalized) {
      onChange(normalized)
    }
  }, [onChange])

  // Auto-commit when both segments have a complete value
  useEffect(() => {
    if (!allowManualInput) return
    if (hours12.length === 2 && minutes.length === 2) {
      commitValue(hours12, minutes, period)
    }
  }, [allowManualInput, hours12, minutes, period, commitValue])

  // Handle focus leaving the entire component
  const handleContainerBlur = useCallback((e: React.FocusEvent) => {
    // Check if focus moved outside the container
    const container = containerRef.current
    if (!container) return
    const relatedTarget = e.relatedTarget as Node | null
    if (relatedTarget && container.contains(relatedTarget)) return

    // Focus left the component
    setIsFocused(false)

    // Normalize empty segments
    const h = hours12 || ""
    const m = minutes || ""
    if (h || m) {
      const hNorm = h ? clampAndPad(h, 1, 12) : ""
      const mNorm = m ? clampAndPad(m, 0, 59) : "00"
      if (hNorm) {
        setHours12(hNorm)
        setMinutes(mNorm)
        commitValue(hNorm, mNorm, period)
      }
    }

    onBlur?.()
  }, [hours12, minutes, period, commitValue, onBlur])

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

  const displayValue = hasValue ? `${selectedHour} : ${selectedMinute}` : ""

  if (allowManualInput) {
    return (
      <div className="w-full">
        <div
          ref={(node) => {
            containerRef.current = node
            setForwardedRef(ref, node)
          }}
          onBlur={handleContainerBlur}
          className={cn(
            "relative w-full h-[52px] 2xl:h-[56px] rounded-[16px]",
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

          {/* Segmented time input: [HH] : [MM] */}
          <div className="flex items-center gap-0.5 flex-1 min-w-0">
            <SegmentInput
              ref={hourInputRef}
              value={hours12}
              onChange={setHours12}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {}}
              onNext={() => minuteInputRef.current?.focus()}
              min={1}
              max={12}
              placeholder="hh"
              disabled={disabled}
              aria-label="Hours"
            />
            <span className={cn(
              "text-[15px] 2xl:text-[16px] font-medium select-none",
              hours12 || minutes ? "text-[var(--color-login-text-primary)]" : "text-slate-300"
            )}>
              :
            </span>
            <SegmentInput
              ref={minuteInputRef}
              value={minutes}
              onChange={setMinutes}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {}}
              onPrev={() => hourInputRef.current?.focus()}
              min={0}
              max={59}
              placeholder="mm"
              disabled={disabled}
              aria-label="Minutes"
            />
          </div>

          {/* AM / PM toggle */}
          <div className="flex items-center gap-0.5 pr-3">
            <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
              <button
                type="button"
                disabled={disabled}
                tabIndex={-1}
                onClick={() => {
                  setPeriod("AM")
                  if (hours12) commitValue(hours12, minutes || "00", "AM")
                }}
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
                onClick={() => {
                  setPeriod("PM")
                  if (hours12) commitValue(hours12, minutes || "00", "PM")
                }}
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
                "text-[15px] 2xl:text-[16px]",
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
                  <span>{displayValue}</span>
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
