import { useFormContext } from "react-hook-form"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface FormSelectFieldProps<T = any> {
  name: string
  label: string
  placeholder?: string
  options: T[]
  optionLabel?: keyof T | ((option: T) => string)
  optionValue?: keyof T | ((option: T) => string)
  required?: boolean
  description?: string
  disabled?: boolean
  className?: string
}

export function FormSelectField<T = any>({
  name,
  label,
  placeholder = "Select an option",
  options,
  optionLabel = "label" as keyof T,
  optionValue = "value" as keyof T,
  required = false,
  description,
  disabled = false,
  className,
}: FormSelectFieldProps<T>) {
  const { control } = useFormContext()

  const getLabel = (option: T): string => {
    if (typeof optionLabel === "function") {
      return optionLabel(option)
    }
    return String(option[optionLabel])
  }

  const getValue = (option: T): string => {
    if (typeof optionValue === "function") {
      return optionValue(option)
    }
    return String(option[optionValue])
  }

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
            <Select
              onValueChange={field.onChange}
              value={field.value}  
              disabled={disabled}
            >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option, index) => {
                const value = getValue(option)
                const label = getLabel(option)
                return (
                  <SelectItem key={`${value}-${index}`} value={value}>
                    {label}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
