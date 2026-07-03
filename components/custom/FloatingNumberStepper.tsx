"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface FloatingNumberStepperProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  hasError?: boolean
  required?: boolean
  suffix?: string
}

export function FloatingNumberStepper({
  label,
  value,
  onChange,
  min = 1,
  max = 50,
  hasError,
  required,
  suffix,
}: FloatingNumberStepperProps) {
  const [displayValue, setDisplayValue] = useState(String(value))
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync display when external value changes (and input is not focused)
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(String(value))
    }
  }, [value, isFocused])

  const hasValue = displayValue !== "" || Number.isFinite(value)

  const clamp = (next: number) => Math.max(min, Math.min(max, next))

  const handleFocus = useCallback(() => {
    setIsFocused(true)
    if (value === 0) {
      setDisplayValue("")
    }
  }, [value])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    const parsed = Number(displayValue)
    if (displayValue === "" || !Number.isFinite(parsed)) {
      onChange(min)
      setDisplayValue(String(min))
    } else {
      const clamped = clamp(parsed)
      onChange(clamped)
      setDisplayValue(String(clamped))
    }
  }, [displayValue, min, max, onChange])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      setDisplayValue(raw)
      const parsed = Number(raw)
      if (raw !== "" && Number.isFinite(parsed)) {
        onChange(clamp(parsed))
      }
    },
    [min, max, onChange]
  )

  return (
    <div className="w-full">
      <div className="relative w-full">
        <div
          className={cn(
            `
            premium-input
            h-[52px] 2xl:h-[56px]
            rounded-[16px]
            w-full
            flex items-center gap-1 px-2
          `,
            hasError && "premium-input-error"
          )}
        >
          <button
            type="button"
            onClick={() => {
              const next = clamp(value - 1)
              onChange(next)
              setDisplayValue(String(next))
            }}
            className="flex shrink-0 items-center justify-center w-9 h-9 rounded-xl border border-gray-200/80 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <input
            ref={inputRef}
            type="number"
            value={displayValue}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleInputChange}
            className="flex-1 min-w-0 h-full bg-transparent text-center text-[15px] 2xl:text-[16px] font-semibold text-gray-900 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />

          <button
            type="button"
            onClick={() => {
              const next = clamp(value + 1)
              onChange(next)
              setDisplayValue(String(next))
            }}
            className="flex shrink-0 items-center justify-center w-9 h-9 rounded-xl border border-gray-200/80 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {suffix && (
            <span className="shrink-0 pr-2 text-sm font-medium text-slate-500">{suffix}</span>
          )}
        </div>

        <label
          className={cn(
            `
            absolute left-4 px-1
            pointer-events-none
            transition-all duration-200 ease-out
            whitespace-nowrap
            bg-white/20
            backdrop-blur-md
            text-[var(--color-login-text-muted)]
          `,
            hasValue
              ? "top-0 -translate-y-1/2 text-xs"
              : "top-1/2 -translate-y-1/2 text-sm"
          )}
        >
          {label} {required && <span className="text-[#037ECC]">*</span>}
        </label>
      </div>
    </div>
  )
}
