"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Option {
  value: string
  label: string
}

interface FloatingSelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  options: Option[]
  hasError?: boolean
  disabled?: boolean
}

export function FloatingSelect({
  label,
  value,
  onChange,
  onBlur,
  options,
  hasError = false,
  disabled = false,
}: FloatingSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const hasValue = value && value !== ""
  const selectedOption = options.find(opt => opt.value === value)
  const displayText = selectedOption?.label

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        onBlur?.()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onBlur])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    onBlur?.()
  }

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }

  return (
    <div className="w-full" ref={containerRef}>
      <div className="relative w-full">
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={cn(
            `
            w-full
            premium-input
            h-[52px] 2xl:h-[56px]
            px-4 pr-12
            rounded-[16px]
            text-[15px] 2xl:text-[16px]
            
            text-left
            cursor-pointer
            
            disabled:opacity-50
            disabled:cursor-not-allowed
            
            transition-all duration-200
          `,
            hasError && "premium-input-error",
            !hasValue && "text-gray-400",
            hasValue && "text-gray-900"
          )}
        >
          {displayText}
        </button>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <ChevronDown 
            className={cn(
              "w-5 h-5 text-gray-400 transition-transform duration-200",
              isOpen && "rotate-180"
            )} 
          />
        </div>

        <label
          className={cn(
            `
            absolute left-4 px-1
            pointer-events-none
            transition-all duration-200 ease-out

            bg-white/20
            backdrop-blur-md
            
            text-sm
            text-[var(--color-login-text-muted)]
          `,

            !hasValue && !isOpen && `
              top-[28] -translate-y-1/2
              text-sm
              text-[var(--color-login-text-muted)]
            `,

            (hasValue || isOpen) && `
              top-0
              -translate-y-1/2
              text-xs
              text-[#2563EB]
            `
          )}
        >
          {label} <span className="text-[#2563EB]">*</span>
        </label>

        {/* Dropdown Menu */}
        {isOpen && (
          <div 
            className={cn(
              `
              absolute z-50 w-full mt-2
              bg-white
              border border-gray-200
              rounded-[16px]
              shadow-[0_8px_30px_rgb(0,0,0,0.12)]
              overflow-hidden
              
              animate-in fade-in-0 zoom-in-95
              duration-200
              `
            )}
          >
            <div className="max-h-[280px] overflow-y-auto py-2">
              {options.map((option) => {
                const isSelected = option.value === value
                
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      `
                      w-full px-4 py-3
                      text-left text-[15px]
                      
                      transition-all duration-150
                      
                      flex items-center justify-between
                      gap-3
                      `,
                      isSelected && `
                        bg-[#037ECC]/5
                        text-[#037ECC]
                        font-medium
                      `,
                      !isSelected && `
                        text-gray-700
                        hover:bg-gray-50
                        hover:text-gray-900
                      `
                    )}
                  >
                    <span>{option.label}</span>
                    {isSelected && (
                      <Check className="w-5 h-5 text-[#037ECC] flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
