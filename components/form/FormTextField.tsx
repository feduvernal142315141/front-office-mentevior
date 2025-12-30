
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

export interface FormTextFieldProps {
  name: string
  label: string
  placeholder?: string
  type?: "text" | "email" | "password" | "tel" | "url" | "number"
  required?: boolean
  description?: string
  disabled?: boolean
  className?: string
}

export function FormTextField({
  name,
  label,
  placeholder,
  type = "text",
  required = false,
  description,
  disabled = false,
  className,
}: FormTextFieldProps) {
  const { control } = useFormContext()

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              disabled={disabled}
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
