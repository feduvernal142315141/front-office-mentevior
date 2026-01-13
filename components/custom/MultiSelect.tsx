"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Option {
  value: string
  label: string
}

interface MultiSelectProps {
  label: string
  value: string[]
  onChange: (value: string[]) => void
  onBlur?: () => void
  options: Option[]
  hasError?: boolean
  disabled?: boolean
  searchable?: boolean
  required?: boolean
  placeholder?: string
}

export function MultiSelect({
  label,
  value,
  onChange,
  onBlur,
  options,
  hasError = false,
  disabled = false,
  searchable = false,
  required = false,
  placeholder = "Select items",
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  const hasValue = value && value.length > 0
  const selectedOptions = options.filter(opt => value.includes(opt.value))
  const displayText = hasValue 
    ? `${selectedOptions.length} selected` 
    : placeholder

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
  }, [isOpen])

  const filteredOptions = searchable && searchQuery
    ? options.filter(opt => 
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery("")
        onBlur?.()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onBlur])

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [isOpen, searchable])

  const handleSelect = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue]
    onChange(newValue)
  }

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(value.filter(v => v !== optionValue))
  }

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }

  const handleSelectAll = () => {
    if (value.length === options.length) {
      onChange([])
    } else {
      onChange(options.map(opt => opt.value))
    }
  }

  return (
    <div className="w-full" ref={containerRef}>
      <div className="relative w-full">
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={cn(
            `
            w-full
            premium-input
            min-h-[52px] 2xl:min-h-[56px]
            px-4 pr-12
            rounded-[16px]
            text-[15px] 2xl:text-[16px]
            
            text-left
            cursor-pointer
            
            disabled:opacity-50
            disabled:cursor-not-allowed
            
            transition-all duration-200
            
            flex flex-wrap items-center gap-2
          `,
            hasError && "premium-input-error",
            !hasValue && "text-gray-400",
          )}
        >
          {!hasValue ? (
            <span className="text-gray-400">{displayText}</span>
          ) : (
            <div className="flex flex-wrap gap-2 py-1">
              {selectedOptions.map((option) => (
                <span
                  key={option.value}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm"
                >
                  {option.label}
                  <button
                    type="button"
                    onClick={(e) => handleRemove(option.value, e)}
                    className="hover:bg-blue-100 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </button>

        <div className="absolute right-4 top-4 pointer-events-none">
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
          {label} {required && <span className="text-[#2563EB]">*</span>}
        </label>
      </div>

      {isOpen && (
        <div 
          className={cn(
            `
            fixed z-[9999]
            bg-white
            border border-gray-200
            rounded-[16px]
            shadow-[0_8px_30px_rgb(0,0,0,0.12)]
            overflow-hidden
            
            animate-in fade-in-0 zoom-in-95
            duration-200
            `
          )}
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`
          }}
        >
            {searchable && (
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}

            <div className="px-3 py-2 border-b border-gray-200">
              <button
                type="button"
                onClick={handleSelectAll}
                className="w-full px-2 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-left font-medium"
              >
                {value.length === options.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            <div className="max-h-[280px] overflow-y-auto py-2">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No results found
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = value.includes(option.value)
                  
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
                })
              )}
            </div>
          </div>
      )}
    </div>
  )
}
