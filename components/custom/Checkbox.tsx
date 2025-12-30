"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import React from "react"

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {

  checked?: boolean
  
  onCheckedChange?: (checked: boolean) => void
  
  label?: string

  description?: string

  size?: "sm" | "md" | "lg"
  
  indeterminate?: boolean
}

const sizeStyles = {
  sm: {
    checkbox: "w-4 h-4",
    icon: "w-3 h-3",
    label: "text-sm",
    description: "text-xs",
  },
  md: {
    checkbox: "w-5 h-5",
    icon: "w-3.5 h-3.5",
    label: "text-sm",
    description: "text-xs",
  },
  lg: {
    checkbox: "w-6 h-6",
    icon: "w-4 h-4",
    label: "text-base",
    description: "text-sm",
  },
}

export function Checkbox({
  checked = false,
  onCheckedChange,
  label,
  description,
  size = "md",
  disabled = false,
  indeterminate = false,
  className,
  id,
  ...props
}: CheckboxProps) {
  const generatedId = React.useId()
  const checkboxId = id || generatedId
  const sizes = sizeStyles[size]
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      onCheckedChange?.(e.target.checked)
      props.onChange?.(e)
    }
  }
  
  const hasLabel = !!(label || description)
  
  return (
    <div className={cn("flex items-start gap-2.5", className)}>
      {/* Custom Checkbox */}
      <div className="relative flex items-center justify-center flex-shrink-0 mt-0.5">
        {/* Hidden native input */}
        <input
          type="checkbox"
          id={checkboxId}
          checked={checked}
          disabled={disabled}
          onChange={handleChange}
          className="peer sr-only"
          {...props}
        />
        
        {/* Custom visual */}
        <label
          htmlFor={checkboxId}
          className={cn(
            sizes.checkbox,
            "relative flex items-center justify-center",
            "rounded-md",
            "border-2",
            "transition-all duration-200 ease-out",
            "cursor-pointer",
            
            // Default state
            "border-gray-300 bg-white",
            
            // Hover
            "hover:border-blue-400 hover:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]",
            
            // Checked
            "peer-checked:border-blue-600 peer-checked:bg-gradient-to-br peer-checked:from-blue-600 peer-checked:to-blue-500",
            "peer-checked:shadow-[0_2px_8px_rgba(37,99,235,0.3)]",
            
            // Focus
            "peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2",
            
            // Disabled
            disabled && "opacity-50 cursor-not-allowed hover:border-gray-300 hover:shadow-none",
            
            // Indeterminate
            indeterminate && "border-blue-600 bg-blue-600"
          )}
        >
          {/* Check icon */}
          <Check
            className={cn(
              sizes.icon,
              "text-white",
              "transition-all duration-200",
              "absolute",
              checked || indeterminate
                ? "opacity-100 scale-100"
                : "opacity-0 scale-50"
            )}
            strokeWidth={3}
          />
        </label>
      </div>
      
      {/* Label */}
      {hasLabel && (
        <div className="flex-1 min-w-0">
          {label && (
            <label
              htmlFor={checkboxId}
              className={cn(
                sizes.label,
                "font-medium text-gray-900 cursor-pointer select-none",
                "block leading-tight",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p
              className={cn(
                sizes.description,
                "text-gray-600 mt-1 leading-tight",
                disabled && "opacity-50"
              )}
            >
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Checkbox.Group - Helper para grupos de checkboxes
 */
Checkbox.Group = function CheckboxGroup({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {children}
    </div>
  )
}
