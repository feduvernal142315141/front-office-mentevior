"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, Check } from "lucide-react"

interface PremiumSelectProps {
  value: number
  onChange: (value: number) => void
  options: number[]
  label?: string
  className?: string
}

export function PremiumSelect({
  value,
  onChange,
  options,
  label,
  className,
}: PremiumSelectProps) {
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

  const handleSelect = (option: number) => {
    onChange(option)
    setIsOpen(false)
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {label && (
        <label className="text-sm text-gray-600 whitespace-nowrap">
          {label}
        </label>
      )}
      
      <div ref={containerRef} className="relative inline-block">

      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          /* Size */
          "min-w-[80px]",
          "h-10",
          "pl-3.5 pr-9 py-2",
          
          /* Shape */
          "rounded-lg",
          
          /* Layout */
          "flex items-center justify-between",
          "relative",
          
          /* Text */
          "text-[13px] font-semibold",
          "text-gray-700",
          
          /* Background */
          "bg-white",
          
          /* Border */
          "border border-gray-300/80",
          
          /* Shadow */
          "shadow-sm",
          
          /* Hover */
          "hover:bg-gray-50/50",
          "hover:border-gray-400/80",
          "hover:shadow",
          
          /* Focus */
          "focus:outline-none",
          "focus:ring-2",
          "focus:ring-blue-500/30",
          "focus:ring-offset-1",
          "focus:border-blue-400",
          
          /* Active/Open */
          isOpen && "ring-2 ring-blue-500/30 border-blue-400",
          
          /* Transitions */
          "transition-all duration-150 ease-out"
        )}
      >
        <span>{value}</span>
        
        {/* Chevron Icon */}
        <ChevronDown 
          className={cn(
            "absolute right-2.5 w-4 h-4 text-gray-500",
            "transition-transform duration-200",
            isOpen && "rotate-180"
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
          <div className="py-1">
            {options.map((option) => {
              const isSelected = option === value

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
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
                  <span>{option}</span>
                  
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
    </div>
  )
}
