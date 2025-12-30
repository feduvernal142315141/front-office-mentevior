
import { useFormContext } from "react-hook-form"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

export interface FormDateFieldProps {
  name: string
  label: string
  required?: boolean
  description?: string
  disabled?: boolean
  min?: string
  max?: string
  className?: string
}

export function FormDateField({
  name,
  label,
  required = false,
  description,
  disabled = false,
  min,
  max,
  className,
}: FormDateFieldProps) {
  const { control } = useFormContext()

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            {label}
            {required && <span className="text-[#2563EB] ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <Input
              type="date"
              disabled={disabled}
              min={min}
              max={max}
              {...field}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
