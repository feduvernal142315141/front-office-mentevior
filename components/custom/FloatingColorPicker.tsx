"use client"

import { cn } from "@/lib/utils"
import { Check, Pipette } from "lucide-react"
import { useRef, useState } from "react"
import { HexColorPicker } from "react-colorful"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface FloatingColorPickerProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  label: string
  hasError?: boolean
  required?: boolean
  disabled?: boolean
}

const QUICK_COLORS = [
  "#037ECC", "#079CFB", "#2563EB", "#7C3AED", "#C026D3",
  "#DC2626", "#EA580C", "#CA8A04", "#16A34A", "#0F766E",
  "#0F172A", "#475569", "#94A3B8", "#F1F5F9", "#FFFFFF",
]

function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex)
}

export function FloatingColorPicker({
  value,
  onChange,
  onBlur,
  label,
  hasError,
  required,
  disabled,
}: FloatingColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [hexInput, setHexInput] = useState(value || "")
  const [hexError, setHexError] = useState(false)

  const hasValue = isValidHex(value)

  const handlePickerChange = (hex: string) => {
    onChange(hex)
    setHexInput(hex.toUpperCase())
    setHexError(false)
  }

  const handleHexInputChange = (raw: string) => {
    let v = raw.trim()
    if (v && !v.startsWith("#")) v = "#" + v
    v = v.slice(0, 7)
    setHexInput(v)
    if (isValidHex(v)) {
      onChange(v)
      setHexError(false)
    } else {
      setHexError(v.length > 1)
    }
  }

  const handleHexBlur = () => {
    if (!isValidHex(hexInput)) {
      setHexInput(value || "")
      setHexError(false)
    }
  }

  return (
    <div className="w-full">
      <Popover
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open)
          if (!open) {
            setHexInput(value || "")
            setHexError(false)
            onBlur?.()
          } else {
            setHexInput(value ? value.toUpperCase() : "")
          }
        }}
      >
        <PopoverTrigger asChild disabled={disabled}>
          <div className="relative">
            <button
              type="button"
              disabled={disabled}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={cn(
                "flex items-center gap-3",
                "w-full h-[52px] 2xl:h-[56px]",
                "px-4 pr-12 rounded-[16px]",
                "text-left text-[15px] 2xl:text-[16px]",
                "text-[var(--color-login-text-primary)]",
                "bg-gradient-to-b from-[hsl(240_20%_99%)] to-[hsl(240_18%_96%)]",
                hasError
                  ? "border-2 border-red-500/70"
                  : "border border-[hsl(240_20%_88%/0.6)]",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_2px_rgba(15,23,42,0.04)]",
                "hover:border-[hsl(240_35%_75%/0.6)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_2px_6px_rgba(15,23,42,0.06)]",
                "focus:outline-none focus:border-[hsl(var(--primary))]",
                "focus:bg-gradient-to-b focus:from-white focus:to-[hsl(240_20%_99%)]",
                "focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_0_0_4px_hsl(var(--primary)/0.12),0_6px_14px_hsl(var(--primary)/0.18)]",
                "focus:-translate-y-[1px] transition-all duration-200 ease-out",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {hasValue && (
                <>
                  <span
                    className="w-5 h-5 rounded-md shrink-0 shadow-sm ring-1 ring-black/10"
                    style={{ backgroundColor: value }}
                  />
                  <span className="font-mono text-sm text-slate-700">
                    {value.toUpperCase()}
                  </span>
                </>
              )}
            </button>

            {/* Label flotante */}
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
              {label} {required && <span className="text-[#2563EB]">*</span>}
            </label>

            {/* Ícono derecha */}
            {hasValue ? (
              <span
                className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full shadow-sm ring-1 ring-black/10 pointer-events-none"
                style={{ backgroundColor: value }}
              />
            ) : (
              <Pipette
                className={cn(
                  "absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none transition-colors",
                  isOpen ? "text-[#037ECC]" : "text-gray-400"
                )}
              />
            )}
          </div>
        </PopoverTrigger>

        <PopoverContent
          className="p-0 w-[280px] bg-white/95 backdrop-blur-xl border border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.12)] rounded-[20px] overflow-hidden"
          align="start"
          sideOffset={8}
        >
          <div className="bg-gradient-to-br from-white to-gray-50/60">
            {/* Gradient + Hue picker */}
            <div
              className="[&_.react-colorful]:w-full [&_.react-colorful]:rounded-none
                [&_.react-colorful__saturation]:rounded-none [&_.react-colorful__saturation]:h-[160px]
                [&_.react-colorful__hue]:h-4 [&_.react-colorful__hue]:rounded-none [&_.react-colorful__hue]:mx-0
                [&_.react-colorful__pointer]:w-5 [&_.react-colorful__pointer]:h-5 [&_.react-colorful__pointer]:border-2 [&_.react-colorful__pointer]:border-white [&_.react-colorful__pointer]:shadow-md"
            >
              <HexColorPicker
                color={isValidHex(value) ? value : "#037ECC"}
                onChange={handlePickerChange}
              />
            </div>

            <div className="p-3 space-y-3">
              {/* Quick colors */}
              <div>
                <p className="text-[10px] font-semibold text-slate-400 tracking-[0.15em] uppercase mb-2">
                  Quick pick
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_COLORS.map((hex) => {
                    const isSelected = value?.toUpperCase() === hex.toUpperCase()
                    const isWhite = hex === "#FFFFFF"
                    return (
                      <button
                        key={hex}
                        type="button"
                        title={hex}
                        onClick={() => handlePickerChange(hex)}
                        className={cn(
                          "w-7 h-7 rounded-lg transition-all duration-150 shrink-0",
                          "hover:scale-110",
                          isWhite
                            ? "ring-1 ring-slate-200"
                            : "shadow-sm ring-1 ring-black/10",
                          isSelected && "ring-2 ring-offset-1 ring-[#037ECC] scale-110"
                        )}
                        style={{ backgroundColor: hex }}
                      >
                        {isSelected && (
                          <Check
                            className="w-3.5 h-3.5 mx-auto"
                            style={{
                              color:
                                parseInt(hex.replace("#", ""), 16) > 0x888888 ? "#000" : "#fff",
                            }}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Hex input */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg shrink-0 shadow-sm ring-1 ring-black/10 transition-colors duration-150"
                    style={{
                      backgroundColor: isValidHex(hexInput) ? hexInput : "#e2e8f0",
                    }}
                  />
                  <input
                    type="text"
                    value={hexInput}
                    onChange={(e) => handleHexInputChange(e.target.value)}
                    onBlur={handleHexBlur}
                    placeholder="#000000"
                    maxLength={7}
                    spellCheck={false}
                    className={cn(
                      "flex-1 h-9 px-3 rounded-lg text-sm font-mono border transition-colors",
                      "focus:outline-none focus:ring-2 focus:ring-[#037ECC]/20 focus:border-[#037ECC]/40",
                      hexError
                        ? "border-red-400 bg-red-50 text-red-700"
                        : "border-slate-200 bg-white text-slate-800"
                    )}
                  />
                </div>
                {hexError && (
                  <p className="text-[10px] text-red-500 mt-1">
                    Enter a valid hex (#RRGGBB)
                  </p>
                )}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
