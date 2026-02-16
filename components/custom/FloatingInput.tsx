"use client"

import { cn } from "@/lib/utils"

interface Props {
  label: string
  value: string
  onChange: (v: string) => void
  onBlur: () => void
  placeholder?: string
  type?: React.HTMLInputTypeAttribute
  hasError?: boolean
  isSuccess?: boolean
  autoComplete?: string
  maxLength?: number
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "email" | "url" | "search" | "none"
  pattern?: string
  disabled?: boolean
  required?: boolean
  name?: string
}

export function FloatingInput({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
  hasError,
  isSuccess,
  autoComplete = "off",
  maxLength,
  inputMode,
  pattern,
  disabled,
  required,
  name,
}: Props) {
  return (
    <div className="w-full">
      <div className="relative w-full">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder=" "
          autoComplete={autoComplete}
          maxLength={maxLength}
          inputMode={inputMode}
          pattern={pattern}
          disabled={disabled}
          name={name}
          className={cn(
            `
            peer
            premium-input
            h-[52px] 2xl:h-[56px]
            px-4 pr-12
            rounded-[16px]
            text-[15px] 2xl:text-[16px]

            placeholder:text-transparent
          `,
            hasError && "premium-input-error",
            isSuccess &&
              "border-green-500 focus:border-green-500 focus:ring-green-500/20"
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

            top-1/2 -translate-y-1/2

            peer-placeholder-shown:top-1/2
            peer-placeholder-shown:-translate-y-1/2
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
      </div>
    </div>
  )
}
