"use client"

import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface Props {
  label: string
  value: string
  onChange: (v: string) => void
  onBlur: () => void
  placeholder: string
  hasError?: boolean
  isSuccess?: boolean
}

export function PasswordField({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  hasError,
  isSuccess,
}: Props) {
  const [show, setShow] = useState(false)

  return (
    <div className="w-full">
      <div className="relative w-full">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder=" "
          autoComplete="off"
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

        {/* FLOATING LABEL */}
        <label
          className={cn(
            `
            absolute left-4 px-1
            pointer-events-none
            transition-all duration-200 ease-out

            bg-white/20 dark:bg-[#0F162A]
            backdrop-blur-md

            text-sm
            text-slate-500 dark:text-slate-400

            top-1/2 -translate-y-1/2

            peer-placeholder-shown:top-1/2
            peer-placeholder-shown:-translate-y-1/2
            peer-placeholder-shown:text-sm
            peer-placeholder-shown:text-slate-500

            peer-focus:top-0
            peer-focus:-translate-y-1/2
            peer-focus:text-xs
            peer-focus:text-[#2563EB]

            peer-[&:not(:placeholder-shown)]:top-0
            peer-[&:not(:placeholder-shown)]:-translate-y-1/2
            peer-[&:not(:placeholder-shown)]:text-xs
            peer-[&:not(:placeholder-shown)]:text-[#2563EB]
          `
          )}
        >

          {label} <span className="text-[#2563EB]">*</span>
        </label>

        {/* TOGGLE VISIBILITY */}
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="
            absolute right-4 top-1/2 -translate-y-1/2
            text-[var(--color-login-text-muted)]
            hover:text-[var(--color-login-text-secondary)]
            transition-colors duration-200
            z-10
          "
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  )
}
