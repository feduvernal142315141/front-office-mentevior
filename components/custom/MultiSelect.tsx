"use client"

import { useState, useRef, useEffect, useCallback, forwardRef } from "react"
import { ChevronDown, Check, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

interface Option {
  value: string
  label: string
  tagLabel?: string
}

interface MultiSelectProps {
  label: string
  value: string[]
  onChange: (value: string[]) => void
  onBlur?: () => void
  /** Called once when the dropdown opens — use for lazy data fetching */
  onOpen?: () => void
  options: Option[]
  hasError?: boolean
  disabled?: boolean
  searchable?: boolean
  required?: boolean
  placeholder?: string
  /** Placeholder for the search field when `searchable` is true (default: "Search...") */
  searchPlaceholder?: string
  /** Open the panel above the trigger (e.g. near bottom of a modal) */
  dropdownPosition?: "top" | "bottom"
  tone?: "brand" | "neutral"
  /**
   * `comfortable`: más alto, tags en wrap sin clip — para campos anchos donde
   * el multi-select debe leerse más grande que un select simple.
   */
  density?: "default" | "comfortable"
  /** Override the responsive maxVisibleTags calculation (e.g. when the field is narrower than full-width) */
  maxVisibleTags?: number
}

export const MultiSelect = forwardRef<HTMLButtonElement, MultiSelectProps>(function MultiSelect({
  label,
  value,
  onChange,
  onBlur,
  onOpen,
  options,
  hasError = false,
  disabled = false,
  searchable = false,
  required = false,
  placeholder = "Select items",
  searchPlaceholder = "Search...",
  dropdownPosition = "bottom",
  tone = "brand",
  density = "default",
  maxVisibleTags: maxVisibleTagsProp,
}, ref) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const isComfortable = density === "comfortable"
  
  const hasValue = value && value.length > 0
  const selectedOptions = options.filter(opt => value.includes(opt.value))
  
  // Sin tope por defecto: el campo crece y hace wrap. Quien necesite compacto
  // (billing codes, etc.) pasa `maxVisibleTags` explícito.
  const maxVisibleTags = maxVisibleTagsProp ?? Number.POSITIVE_INFINITY
  const visibleTags = Number.isFinite(maxVisibleTags)
    ? selectedOptions.slice(0, maxVisibleTags)
    : selectedOptions
  const remainingCount = Number.isFinite(maxVisibleTags)
    ? Math.max(0, selectedOptions.length - maxVisibleTags)
    : 0

  const selectedTagClass =
    tone === "neutral"
      ? "bg-slate-100 text-slate-700"
      : "bg-blue-50 text-blue-700"

  const removeTagClass =
    tone === "neutral" ? "hover:bg-slate-200" : "hover:bg-blue-100"

  const activeLabelClass = tone === "neutral" ? "text-slate-600" : "text-[#2563EB]"

  const requiredAsteriskClass = "text-[#037ECC]"

  const searchFocusClass =
    tone === "neutral"
      ? "focus:ring-slate-400 focus:border-transparent"
      : "focus:ring-blue-500 focus:border-transparent"

  const selectAllClass =
    tone === "neutral"
      ? "text-slate-700 hover:bg-slate-100"
      : "text-blue-600 hover:bg-blue-50"

  const selectedOptionClass =
    tone === "neutral"
      ? "bg-slate-100 text-slate-800 font-medium"
      : "bg-[#037ECC]/5 text-[#037ECC] font-medium"

  const selectedCheckClass = tone === "neutral" ? "text-slate-700" : "text-[#037ECC]"

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

  const computeDropdownStyle = useCallback(() => {
    if (dropdownPosition !== "top" || !buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const available = rect.top - 8
    const maxH = Math.min(available, 480)
    setDropdownStyle({
      position: "fixed",
      bottom: window.innerHeight - rect.top + 8,
      left: rect.left,
      width: rect.width,
      maxHeight: maxH,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    })
  }, [dropdownPosition])

  const handleToggle = () => {
    if (!disabled) {
      if (!isOpen) {
        onOpen?.()
        computeDropdownStyle()
      }
      setIsOpen(!isOpen)
    }
  }

  const handleSelectAll = () => {
    if (value.length === options.length) {
      onChange([])
    } else {
      onChange(options.map(opt => opt.value))
      setIsOpen(false)
      setSearchQuery("")
      onBlur?.()
    }
  }

  return (
    <div className="w-full" ref={containerRef}>
      <div className="relative w-full">
        <button
          ref={(node) => {
            buttonRef.current = node
            if (typeof ref === "function") ref(node)
            else if (ref) ref.current = node
          }}
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={cn(
            `
            w-full
            premium-input
            !h-auto
            min-h-[52px] 2xl:min-h-[56px]
            !px-4 !pr-12 !py-2.5
            rounded-[16px]
            text-[15px] 2xl:text-[16px]
            overflow-visible
            
            text-left
            cursor-pointer
            
            transition-all duration-200
            
            flex flex-wrap items-center gap-2
          `,
            isComfortable && "min-h-[64px] items-start !py-3",
            hasError && "premium-input-error",
            !hasValue && !disabled && "text-gray-400",
            disabled && "!cursor-not-allowed"
          )}
        >
          {hasValue && (
            <div className="flex min-w-0 w-full flex-wrap items-center gap-2 py-0.5 pr-1">
              {visibleTags.map((option) => (
                <span
                  key={option.value}
                  className={cn(
                    "inline-flex max-w-full items-center gap-1 rounded-lg px-2 py-1 text-sm",
                    disabled ? "bg-gray-100 text-gray-600" : selectedTagClass
                  )}
                >
                  <span className="min-w-0 truncate">
                    {option.tagLabel ?? option.label}
                  </span>
                  {!disabled && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => handleRemove(option.value, e)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          handleRemove(option.value, e as any)
                        }
                      }}
                      className={cn(
                        "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                        removeTagClass,
                      )}
                      aria-label={`Remove ${option.tagLabel ?? option.label}`}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  )}
                </span>
              ))}
              {remainingCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-gray-100 px-2 py-1 text-sm font-medium text-gray-600">
                      +{remainingCount} more
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={6} className="z-[9999] max-w-xs bg-slate-900 text-white">
                    <div className="flex flex-col gap-1">
                      {selectedOptions.slice(maxVisibleTags).map((opt) => (
                        <span key={opt.value}>{opt.tagLabel ?? opt.label}</span>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
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
            text-sm
            text-[var(--color-login-text-muted)]
          `,

            !hasValue && !isOpen && `
              top-[28px] -translate-y-1/2
              text-sm
              text-[var(--color-login-text-muted)]
            `,

            (hasValue || isOpen) && `
              top-0
              -translate-y-1/2
              text-xs
              bg-white
            `,
            (isOpen && !disabled) && activeLabelClass
          )}
        >
          {label} {required && <span className={requiredAsteriskClass}>*</span>}
        </label>

        {isOpen && (
        <div
          className={cn(
            "z-[9999] bg-white border border-gray-200 rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] animate-in fade-in-0 zoom-in-95 duration-200",
            dropdownPosition === "top"
              ? "origin-bottom"
              : "absolute left-0 right-0 top-full mt-2 origin-top overflow-hidden flex flex-col max-h-[360px]"
          )}
          style={dropdownPosition === "top" ? dropdownStyle : undefined}
        >
            {searchable && (
              <div className="p-3 border-b border-gray-200 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className={cn(
                      "w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2",
                      searchFocusClass,
                    )}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}

            <div className="px-3 py-2 border-b border-gray-200 flex-shrink-0">
              <button
                type="button"
                onClick={handleSelectAll}
                className={cn(
                  "w-full px-2 py-1.5 text-sm rounded-lg transition-colors text-left font-medium",
                  selectAllClass,
                )}
              >
                {value.length === options.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            <div className={cn("overflow-y-auto py-2", dropdownPosition === "top" ? "flex-1 min-h-0" : "max-h-[280px]")}>
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
                        isSelected && selectedOptionClass,
                        !isSelected && `
                          text-gray-700
                          hover:bg-gray-50
                          hover:text-gray-900
                        `
                      )}
                    >
                      <span>{option.label}</span>
                      {isSelected && (
                        <Check className={cn("w-5 h-5 flex-shrink-0", selectedCheckClass)} />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
})
