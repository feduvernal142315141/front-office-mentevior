"use client"

import { cn } from "@/lib/utils"
import { Clock } from "lucide-react"
import { forwardRef, useEffect, useRef, useState, type ForwardedRef } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatTimeTo12h, formatTimeTo24h } from "@/lib/utils/time-format"

interface FloatingTimePickerProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  label: string
  hasError?: boolean
  required?: boolean
  disabled?: boolean
  allowManualInput?: boolean
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
}, ref) {
  const [isOpen, setIsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const hourRef = useRef<HTMLDivElement>(null)
  const minuteRef = useRef<HTMLDivElement>(null)
  const [manualValue, setManualValue] = useState("")
  const [period, setPeriod] = useState<"AM" | "PM">("AM")

  const [selectedHour, selectedMinute] = value ? value.split(":") : ["", ""]
  const hasValue = allowManualInput ? manualValue.length > 0 : Boolean(value)

  useEffect(() => {
    if (!allowManualInput) return

    if (!value) {
      setManualValue("")
      setPeriod("AM")
      return
    }

    const formatted12h = formatTimeTo12h(value)
    if (!formatted12h) {
      setManualValue(value)
      return
    }

    const [timePart, parsedPeriod] = formatted12h.split(" ")
    setManualValue(timePart)
    setPeriod(parsedPeriod === "PM" ? "PM" : "AM")
  }, [allowManualInput, value])

  // Scroll to selected hour/minute when dropdown opens
  useEffect(() => {
    if (!isOpen) return
    const scrollTo = (ref: React.RefObject<HTMLDivElement | null>, value: string) => {
      requestAnimationFrame(() => {
        const el = ref.current?.querySelector(`[data-value="${value}"]`) as HTMLElement
        if (el && ref.current) {
          ref.current.scrollTop = el.offsetTop - ref.current.clientHeight / 2 + el.offsetHeight / 2
        }
      })
    }
    scrollTo(hourRef, selectedHour)
    scrollTo(minuteRef, selectedMinute)
  }, [isOpen])

  const handleSelect = (hour: string, minute: string) => {
    onChange(`${hour}:${minute}`)
  }

  const commitManualTime = (input: string, selectedPeriod: "AM" | "PM") => {
    const trimmed = input.trim()

    if (!trimmed) {
      onChange("")
      return
    }

    const withPeriod = /\b(am|pm)$/i.test(trimmed)
      ? trimmed
      : `${trimmed} ${selectedPeriod}`
    const normalized = formatTimeTo24h(withPeriod)

    if (normalized) {
      onChange(normalized)
    }
  }

  const displayValue = hasValue ? `${selectedHour} : ${selectedMinute}` : ""

  if (allowManualInput) {
    return (
      <div className="w-full">
        <div className="relative">
          <div
            className={cn(
              "w-full h-[52px] 2xl:h-[56px] px-4 rounded-[16px]",
              "bg-gradient-to-b from-[hsl(240_20%_99%)] to-[hsl(240_18%_96%)]",
              "border transition-all duration-200 ease-out",
              hasError
                ? "border-2 border-red-500/70"
                : "border-[hsl(240_20%_88%/0.6)]",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_2px_rgba(15,23,42,0.04)]",
              "focus-within:border-[hsl(var(--primary))]",
              "focus-within:bg-gradient-to-b focus-within:from-white focus-within:to-[hsl(240_20%_99%)]",
              "focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_0_0_4px_hsl(var(--primary)/0.12),0_6px_14px_hsl(var(--primary)/0.18)]",
              "focus-within:-translate-y-[1px]",
              disabled && "opacity-50"
            )}
          >
            <div className="flex h-full items-center gap-2 pt-4">
              <Clock className="w-4 h-4 text-[#037ECC] shrink-0" />
              <input
                ref={(node) => setForwardedRef(ref, node)}
                type="text"
                value={manualValue}
                onChange={(event) => setManualValue(event.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                  setIsFocused(false)
                  commitManualTime(manualValue, period)
                  onBlur?.()
                }}
                placeholder="hh:mm"
                disabled={disabled}
                inputMode="numeric"
                className="flex-1 bg-transparent text-[15px] 2xl:text-[16px] text-[var(--color-login-text-primary)] outline-none placeholder:text-gray-400"
              />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setPeriod("AM")
                    commitManualTime(manualValue, "AM")
                  }}
                  className={cn(
                    "h-7 px-2 rounded-md text-xs font-semibold transition-colors",
                    period === "AM"
                      ? "bg-[#037ECC] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  AM
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setPeriod("PM")
                    commitManualTime(manualValue, "PM")
                  }}
                  className={cn(
                    "h-7 px-2 rounded-md text-xs font-semibold transition-colors",
                    period === "PM"
                      ? "bg-[#037ECC] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          <label
            className={cn(
              "absolute left-10 px-1 pointer-events-none transition-all duration-200 ease-out",
              isFocused || hasValue
                ? "top-0 -translate-y-1/2 text-xs bg-white"
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
