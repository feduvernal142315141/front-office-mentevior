"use client"

import { useState, useEffect } from "react"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { formatPhoneInput } from "@/lib/utils/phone-format"

interface PhoneInputFieldProps {
  value: string
  onChange: (val: string) => void
  onBlur: () => void
  hasError: boolean
  errorMessage?: string
}

export function PhoneInputField({ value, onChange, onBlur, hasError, errorMessage }: PhoneInputFieldProps) {
  const [displayValue, setDisplayValue] = useState(() => formatPhoneInput(value || ""))

  useEffect(() => {
    setDisplayValue(formatPhoneInput(value || ""))
  }, [value])

  return (
    <div>
      <FloatingInput
        label="Phone"
        value={displayValue}
        onChange={(val) => {
          const formatted = formatPhoneInput(val, displayValue)
          setDisplayValue(formatted)
          onChange(formatted)
        }}
        onBlur={onBlur}
        type="tel"
        placeholder="(305) 555-0000"
        hasError={hasError}
      />
      {errorMessage && (
        <p className="text-sm text-red-600 mt-2">{errorMessage}</p>
      )}
    </div>
  )
}
