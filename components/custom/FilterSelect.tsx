"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, Check } from "lucide-react"

interface FilterSelectOption {
  value: string
  label: string
}

interface FilterSelectProps {
  value: string
  onChange: (value: string) => void
  options: FilterSelectOption[]
  placeholder?: string
  className?: string
}

export function FilterSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className,
}: FilterSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Update position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      })
    }
  }, [isOpen])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  const selectedOption = options.find((opt) => opt.value === value)
  const displayLabel = selectedOption?.label || placeholder

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          /* Size */
          "min-w-[140px]",
          "h-[52px] 2xl:h-[56px]",
          "px-4 pr-10",
          
          /* Shape */
          "rounded-[16px]",
          
          /* Layout */
          "flex items-center justify-between",
          "relative",
          
          /* Text */
          "text-[15px] 2xl:text-[16px]",
          "text-gray-700 font-medium",
          
          /* Background gradient - Same as SearchInput */
          "bg-gradient-to-b from-[hsl(240_20%_99%)] to-[hsl(240_18%_96%)]",
          
          /* Border */
          "border border-[hsl(240_20%_88%/0.6)]",
          
          /* Shadow */
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_2px_rgba(15,23,42,0.04)]",
          
          /* Hover */
          "hover:border-[hsl(240_35%_75%/0.6)]",
          "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_2px_6px_rgba(15,23,42,0.06)]",
          
          /* Focus */
          "focus:outline-none",
          "focus:border-[hsl(var(--primary))]",
          "focus:bg-gradient-to-b focus:from-white focus:to-[hsl(240_20%_99%)]",
          "focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_0_0_4px_hsl(var(--primary)/0.12),0_6px_14px_hsl(var(--primary)/0.18)]",
          "focus:-translate-y-[1px]",
          
          /* Active/Open */
          isOpen && "border-[hsl(var(--primary))] bg-gradient-to-b from-white to-[hsl(240_20%_99%)]",
          
          /* Transitions */
          "transition-all duration-200 ease-out"
        )}
      >
        <span className={cn(
          "truncate",
          value === "all" && "text-gray-500"
        )}>
          {displayLabel}
        </span>
        
        {/* Chevron Icon */}
        <ChevronDown 
          className={cn(
            "absolute right-3 w-4 h-4 text-gray-500",
            "transition-transform duration-200",
            isOpen && "rotate-180 text-blue-600"
          )} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: `${position.width}px`,
          }}
          className={cn(
            /* Position */
            "z-[9999]",
            
            /* Shape */
            "rounded-xl",
            "overflow-hidden",
            
            /* Background */
            "bg-white",
            
            /* Border */
            "border border-gray-200/80",
            
            /* Shadow premium */
            "shadow-xl shadow-gray-900/10"
          )}
        >
          {/* Options List */}
          <div className="py-1 max-h-[280px] overflow-y-auto">
            {options.map((option) => {
              const isSelected = option.value === value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    /* Layout */
                    "w-full",
                    "flex items-center justify-between",
                    "px-3.5 py-2.5",
                    
                    /* Text */
                    "text-[13px]",
                    
                    /* States - Not Selected */
                    !isSelected && [
                      "text-gray-700",
                      "font-medium",
                      "hover:bg-gray-50",
                    ],
                    
                    /* States - Selected */
                    isSelected && [
                      "bg-gradient-to-r from-blue-500 to-blue-600",
                      "text-white",
                      "font-semibold",
                    ],
                    
                    /* Transitions */
                    "transition-all duration-150"
                  )}
                >
                  <span>{option.label}</span>
                  
                  {/* Check Icon for selected */}
                  {isSelected && (
                    <Check className="w-4 h-4 ml-2" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
