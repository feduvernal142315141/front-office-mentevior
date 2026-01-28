"use client"

import { useFormContext, type FieldValues } from "react-hook-form"
import { FloatingSelect as FloatingSelectComponent } from "@/components/custom/FloatingSelect"
import type { FieldConfig } from "../FormBuilder.types"

interface FloatingSelectProps<TFormValues extends FieldValues = FieldValues> {
  field: FieldConfig<TFormValues>
  options: { label: string; value: string }[]
  error?: string
  onFieldChange?: (name: string, value: any) => void
}

export function FloatingSelect<TFormValues extends FieldValues = FieldValues>({
  field,
  options,
  error,
  onFieldChange,
}: FloatingSelectProps<TFormValues>) {
  const { watch, setValue } = useFormContext<TFormValues>()
  const value = watch(field.name as any) || ""

  const handleChange = (newValue: string) => {
    setValue(field.name as any, newValue as any, { shouldValidate: true })
    onFieldChange?.(field.name, newValue)
  }

  return (
    <FloatingSelectComponent
      label={field.label}
      value={String(value)}
      onChange={handleChange}
      options={options}
      disabled={field.disabled}
      required={field.required}
      hasError={!!error}
    />
  )
}
