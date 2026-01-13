"use client"

import { cn } from "@/lib/utils"

interface Props {
  label: string
  value: string
  onChange: (v: string) => void
  onBlur: () => void
  placeholder?: string
  hasError?: boolean
  maxLength?: number
  rows?: number
  disabled?: boolean
  required?: boolean
}

export function FloatingTextarea({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  hasError,
  maxLength,
  rows = 4,
  disabled,
  required,
}: Props) {
  return (
    <div className="w-full">
      <div className="relative w-full">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder=" "
          maxLength={maxLength}
          rows={rows}
          disabled={disabled}
          className={cn(
            `
            peer
            premium-input
            min-h-[100px]
            px-4 py-3
            rounded-[16px]
            text-[15px] 2xl:text-[16px]
            resize-y

            placeholder:text-transparent
          `,
            hasError && "premium-input-error"
          )}
        />

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
          {label} {required && <span className="text-[#2563EB]">*</span>}
        </label>

        {maxLength && (
          <div className="absolute right-4 bottom-3 text-xs text-gray-400">
            {value.length}/{maxLength}
          </div>
        )}
      </div>
    </div>
  )
}
