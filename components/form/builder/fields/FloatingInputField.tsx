"use client"

import { useFormContext, type FieldValues } from "react-hook-form"
import { FloatingInput } from "@/components/custom/FloatingInput"
import type { FieldConfig } from "../FormBuilder.types"

interface FloatingInputFieldProps<TFormValues extends FieldValues = FieldValues> {
  field: FieldConfig<TFormValues>
  error?: string
  onFieldChange?: (name: string, value: any) => void
}

export function FloatingInputField<TFormValues extends FieldValues = FieldValues>({
  field,
  error,
  onFieldChange,
}: FloatingInputFieldProps<TFormValues>) {
  const { register, watch, setValue } = useFormContext<TFormValues>()
  const value = watch(field.name as any) || ""

  const handleChange = (newValue: string) => {
    setValue(field.name as any, newValue as any, { shouldValidate: true })
    onFieldChange?.(field.name, newValue)
  }

  return (
    <FloatingInput
      label={field.label}
      value={String(value)}
      onChange={handleChange}
      onBlur={() => {}}
      type={field.type === "email" ? "email" : field.type === "number" ? "number" : "text"}
      hasError={!!error}
      disabled={field.disabled}
      required={field.required}
    />
  )
}
