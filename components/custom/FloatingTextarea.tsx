"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { FieldGuidance } from "@/lib/constants/field-guidance"
import {
  getNarrativeLengthState,
  NARRATIVE_MAX_WORDS,
  NARRATIVE_MIN_CHARS,
  NARRATIVE_MIN_WORDS,
} from "@/lib/utils/narrative-length"

interface Props {
  label: string
  value: string
  onChange: (v: string) => void
  onBlur: () => void
  placeholder?: string
  /**
   * Guía del template que se muestra dentro del campo mientras está vacío y sin
   * foco. Al hacer click desaparece; si el campo queda vacío, vuelve.
   */
  guidance?: FieldGuidance
  /**
   * Muestra el contador de palabras/caracteres con las cotas clínicas.
   * La validación que bloquea el guardado vive en el `handleSubmit` del formulario.
   */
  showLengthCounter?: boolean
  hasError?: boolean
  maxLength?: number
  rows?: number
  disabled?: boolean
  required?: boolean
  className?: string
}

export function FloatingTextarea({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  guidance,
  showLengthCounter,
  hasError,
  maxLength,
  rows = 4,
  disabled,
  required,
  className: extraClassName,
}: Props) {
  const [isFocused, setIsFocused] = useState(false)
  // En una nota bloqueada/read-only la guía no aporta: el campo ya no se puede escribir
  const showHint = !value && !isFocused && !disabled
  const showGuidance = !!guidance && showHint
  // El placeholder nativo no se puede usar: el label flotante depende de
  // `placeholder=" "` + `placeholder:text-transparent`. Se pinta como overlay,
  // igual que la guía, y desaparece al enfocar.
  const showPlaceholder = !guidance && !!placeholder && showHint

  return (
    <div className="w-full">
      <div className="relative w-full">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false)
            onBlur()
          }}
          placeholder=" "
          maxLength={maxLength}
          rows={rows}
          disabled={disabled}
          className={cn(
            `
            peer
            premium-input
            px-4 py-3
            rounded-[16px]
            text-[15px] 2xl:text-[16px]
            resize-y

            placeholder:text-transparent
          `,
            hasError && "premium-input-error",
            extraClassName,
          )}
          style={{ minHeight: `${Math.max(100, rows * 24 + 24)}px` }}
        />

        {guidance && (
          <div
            aria-hidden="true"
            className={cn(
              "absolute inset-0 overflow-hidden rounded-[16px] px-4 pt-11 pb-3",
              // Los clicks tienen que llegar al textarea de abajo
              "pointer-events-none select-none",
              "transition-opacity duration-200 ease-out",
              showGuidance ? "opacity-100" : "opacity-0",
            )}
          >
            <GuidanceContent guidance={guidance} />
            {/* Degradado al color del input para cortar las guías largas sin tijeretazo */}
            <div className="absolute inset-x-0 bottom-0 h-9 bg-gradient-to-t from-[hsl(240_18%_96%)] via-[hsl(240_18%_96%)]/80 to-transparent" />
          </div>
        )}

        {placeholder && !guidance && (
          <p
            aria-hidden="true"
            className={cn(
              "absolute inset-x-0 top-0 px-4 pt-11",
              "pointer-events-none select-none",
              "text-[13px] leading-[1.5] text-slate-400",
              "transition-opacity duration-200 ease-out",
              showPlaceholder ? "opacity-100" : "opacity-0",
            )}
          >
            {placeholder}
          </p>
        )}

        <label
          className={cn(
            `
            absolute left-4 px-1
            pointer-events-none
            transition-all duration-200 ease-out

            bg-white/20
            backdrop-blur-md

            text-sm
            text-[var(--color-login-text-muted)]

            top-4

            peer-placeholder-shown:top-4
            peer-placeholder-shown:text-sm
            peer-placeholder-shown:text-[var(--color-login-text-muted)]

            peer-focus:top-0
            peer-focus:-translate-y-1/2
            peer-focus:text-xs
            peer-focus:text-[#2563EB]

            peer-[&:not(:placeholder-shown)]:top-0
            peer-[&:not(:placeholder-shown)]:-translate-y-1/2
            peer-[&:not(:placeholder-shown)]:text-xs
          `
          )}
        >
          {label} {required && <span className="text-[#037ECC]">*</span>}
        </label>

        {maxLength && (
          <div className="absolute right-4 bottom-3 text-xs text-gray-400">
            {value.length}/{maxLength}
          </div>
        )}
      </div>

      {showLengthCounter && !disabled && <LengthCounter value={value} />}
    </div>
  )
}

/**
 * Contador en vivo bajo el campo. Va fuera de la caja para no chocar con el
 * overlay de guía ni con el handle de resize.
 */
function LengthCounter({ value }: { value: string }) {
  const { words, chars, isEmpty, isValid } = getNarrativeLengthState(value)

  const tone = isEmpty
    ? "neutral"
    : isValid
      ? "valid"
      : words > NARRATIVE_MAX_WORDS
        ? "over"
        : "under"

  return (
    <div className="mt-1.5 flex items-center justify-end gap-2 px-1 text-[11px] tabular-nums">
      <span
        className={cn(
          "transition-colors",
          tone === "neutral" && "text-slate-400",
          tone === "valid" && "text-emerald-600",
          tone === "under" && "text-amber-600",
          tone === "over" && "text-red-500",
        )}
      >
        {words} / {NARRATIVE_MIN_WORDS}–{NARRATIVE_MAX_WORDS} words
      </span>
      <span className="text-slate-300" aria-hidden="true">
        ·
      </span>
      <span
        className={cn(
          "transition-colors",
          isEmpty || chars >= NARRATIVE_MIN_CHARS ? "text-slate-400" : "text-amber-600",
        )}
      >
        {chars} / {NARRATIVE_MIN_CHARS} chars
      </span>
    </div>
  )
}

/** Render del bloque Guidance/Example tal como aparece en los templates CASP */
function GuidanceContent({ guidance }: { guidance: FieldGuidance }) {
  const { intro, bullets, examples, examplesLabel = "Example:" } = guidance

  return (
    <div className="space-y-2 text-[13px] leading-[1.5] text-slate-400">
      <div className="space-y-1">
        <p className="font-semibold text-slate-500">Guidance:</p>
        {intro && <p className="pl-3">{intro}</p>}
        {bullets && bullets.length > 0 && (
          <ul className="space-y-1 pl-3">
            {bullets.map((bullet, index) => (
              <li key={index}>
                <span className="flex gap-1.5">
                  <span aria-hidden="true">•</span>
                  <span>{bullet.text}</span>
                </span>
                {bullet.children && bullet.children.length > 0 && (
                  <ul className="mt-1 space-y-1 pl-4">
                    {bullet.children.map((child, childIndex) => (
                      <li key={childIndex} className="flex gap-1.5">
                        <span aria-hidden="true">◦</span>
                        <span>{child}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {examples && examples.length > 0 && (
        <div className="space-y-1">
          <p className="font-semibold text-slate-500">{examplesLabel}</p>
          <ul className="space-y-1 pl-3">
            {examples.map((example, index) => (
              <li key={index} className="italic">
                {example}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
