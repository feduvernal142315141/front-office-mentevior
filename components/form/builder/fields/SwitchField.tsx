"use client"

import { useFormContext, type FieldValues } from "react-hook-form"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import type { FieldConfig } from "../FormBuilder.types"

interface SwitchFieldProps<TFormValues extends FieldValues = FieldValues> {
  field: FieldConfig<TFormValues>
  error?: string
  onFieldChange?: (name: string, value: any) => void
}

export function SwitchField<TFormValues extends FieldValues = FieldValues>({
  field,
  error,
  onFieldChange,
}: SwitchFieldProps<TFormValues>) {
  const { watch, setValue } = useFormContext<TFormValues>()
  const value = watch(field.name as any) || false

  const handleChange = (newValue: boolean) => {
    setValue(field.name as any, newValue as any, { shouldValidate: true })
    onFieldChange?.(field.name, newValue)
  }

  return (
    <PremiumSwitch
      checked={Boolean(value)}
      onCheckedChange={handleChange}
      label={field.label}
      disabled={field.disabled}
    />
  )
}
