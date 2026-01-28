"use client"

import { useFormContext, type FieldValues } from "react-hook-form"
import { ImageUpload } from "@/components/custom/ImageUpload"
import type { FieldConfig } from "../FormBuilder.types"

interface DocumentFieldProps<TFormValues extends FieldValues = FieldValues> {
  field: FieldConfig<TFormValues>
  error?: string
  onFieldChange?: (name: string, value: any) => void
}

export function DocumentField<TFormValues extends FieldValues = FieldValues>({
  field,
  error,
  onFieldChange,
}: DocumentFieldProps<TFormValues>) {
  const { watch, setValue } = useFormContext<TFormValues>()
  const value = watch(field.name as any) || ""

  const handleChange = (newValue: string) => {
    setValue(field.name as any, newValue as any, { shouldValidate: true })
    onFieldChange?.(field.name, newValue)
  }

  return (
    <ImageUpload
      value={String(value)}
      onChange={handleChange}
      label={field.label}
      disabled={field.disabled}
    />
  )
}
