"use client"

import { useFormContext, type FieldValues } from "react-hook-form"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import type { FieldConfig } from "../FormBuilder.types"

interface TextAreaFieldProps<TFormValues extends FieldValues = FieldValues> {
  field: FieldConfig<TFormValues>
  error?: string
  onFieldChange?: (name: string, value: any) => void
}

export function TextAreaField<TFormValues extends FieldValues = FieldValues>({
  field,
  error,
  onFieldChange,
}: TextAreaFieldProps<TFormValues>) {
  const { watch, setValue } = useFormContext<TFormValues>()
  const value = watch(field.name as any) || ""

  const handleChange = (newValue: string) => {
    setValue(field.name as any, newValue as any, { shouldValidate: true })
    onFieldChange?.(field.name, newValue)
  }

  return (
    <FloatingTextarea
      label={field.label}
      value={String(value)}
      onChange={handleChange}
      onBlur={() => {}}
      hasError={!!error}
      disabled={field.disabled}
      required={field.required}
    />
  )
}
