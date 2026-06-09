"use client"

import { useState, useRef, useEffect, useCallback, forwardRef } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, Check, Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface GroupedOption {
  group: string
  options: { value: string; label: string }[]
}

interface GroupedSelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  groups: GroupedOption[]
  hasError?: boolean
  disabled?: boolean
  searchable?: boolean
  required?: boolean
  dropdownPosition?: "top" | "bottom"
}

export const GroupedSelect = forwardRef<HTMLButtonElement, GroupedSelectProps>(function GroupedSelect({
  label,
  value,
  onChange,
  onBlur,
  groups,
  hasError = false,
  disabled = false,
  searchable = false,
  required = false,
  dropdownPosition,
}, ref) {
  const [isOpen, setIsOpen] = useState(false)
  const [openUpward, setOpenUpward] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const DROPDOWN_HEIGHT = 400

  const hasValue = value && value !== ""

  // Find selected option label across all groups
  const selectedLabel = (() => {
    for (const group of groups) {
      const found = group.options.find((opt) => opt.value === value)
      if (found) return found.label
    }
    return ""
  })()

  // Filter groups based on search
  const filteredGroups = searchable && searchQuery
    ? groups
        .map((g) => ({
          ...g,
          options: g.options.filter((opt) =>
            opt.label.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((g) => g.options.length > 0)
    : groups

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const clickedInsideContainer = containerRef.current?.contains(target)
      const clickedInsideDropdown = dropdownRef.current?.contains(target)

      if (!clickedInsideContainer && !clickedInsideDropdown) {
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
    onChange(optionValue)
    setIsOpen(false)
    setSearchQuery("")
    onBlur?.()
  }

  const computePosition = useCallback(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const shouldOpenUp =
      dropdownPosition === "top" ||
      (dropdownPosition !== "bottom" && spaceBelow < DROPDOWN_HEIGHT && rect.top > DROPDOWN_HEIGHT)

    setOpenUpward(shouldOpenUp)
    setDropdownStyle({
      position: "fixed",
      left: rect.left,
      width: rect.width,
      pointerEvents: "auto",
      ...(shouldOpenUp
        ? { bottom: window.innerHeight - rect.top + 8 }
        : { top: rect.bottom + 8 }),
    })
  }, [dropdownPosition])

  // Close on resize; close on scroll only if the scroll is outside the dropdown
  useEffect(() => {
    if (!isOpen) return
    const close = () => {
      setIsOpen(false)
      setSearchQuery("")
    }
    const handleScroll = (e: Event) => {
      if (dropdownRef.current?.contains(e.target as Node)) return
      close()
    }
    window.addEventListener("resize", close)
    window.addEventListener("scroll", handleScroll, true)
    return () => {
      window.removeEventListener("resize", close)
      window.removeEventListener("scroll", handleScroll, true)
    }
  }, [isOpen])

  // Prevent Radix FocusScope from stealing focus and
  // react-remove-scroll from blocking wheel on our portal dropdown.
  // FocusScope uses document-level focusin/focusout in bubbling phase;
  // we intercept in capture phase so it never sees focus leave the dialog.
  useEffect(() => {
    if (!isOpen) return
    const el = dropdownRef.current
    if (!el) return

    const handleFocusIn = (e: Event) => {
      if (el.contains(e.target as Node)) e.stopPropagation()
    }
    const handleFocusOut = (e: FocusEvent) => {
      if (el.contains(e.relatedTarget as Node)) e.stopPropagation()
    }
    const stopWheel = (e: Event) => e.stopPropagation()

    document.addEventListener("focusin", handleFocusIn, true)
    document.addEventListener("focusout", handleFocusOut, true)
    el.addEventListener("wheel", stopWheel, { passive: true })

    return () => {
      document.removeEventListener("focusin", handleFocusIn, true)
      document.removeEventListener("focusout", handleFocusOut, true)
      el.removeEventListener("wheel", stopWheel)
    }
  }, [isOpen])

  const handleToggle = () => {
    if (disabled) return
    if (!isOpen) {
      computePosition()
    }
    setIsOpen(!isOpen)
  }

  return (
    <div className="w-full relative" ref={containerRef}>
      <div className="relative w-full">
        <button
          ref={ref}
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
            transition-all duration-200
          `,
            hasError && "premium-input-error",
            !hasValue && !disabled && "text-gray-400",
            hasValue && !disabled && "text-gray-900",
            disabled && "!cursor-not-allowed"
          )}
        >
          {selectedLabel}
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
            !hasValue && !isOpen &&
              `
              top-[28] -translate-y-1/2
              text-sm
              text-[var(--color-login-text-muted)]
            `,
            (hasValue || isOpen) &&
              `
              top-0
              -translate-y-1/2
              text-xs
            `,
            isOpen && !disabled && "text-[#2563EB]"
          )}
        >
          {label} {required && <span className="text-[#037ECC]">*</span>}
        </label>
      </div>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className={cn(
            "z-[9999]",
            "bg-white border border-gray-200 rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden",
            "animate-in fade-in-0 duration-150"
          )}
          data-portal-dropdown
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

          <div className="max-h-[340px] overflow-y-auto py-1">
            {filteredGroups.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No results found
              </div>
            ) : (
              filteredGroups.map((group, groupIdx) => (
                <div key={group.group}>
                  {groupIdx > 0 && (
                    <div className="mx-3 my-1 border-t border-gray-100" />
                  )}
                  <div className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {group.group}
                  </div>
                  {group.options.map((option) => {
                    const isSelected = option.value === value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleSelect(option.value)}
                        className={cn(
                          `
                          w-full px-4 py-2.5
                          text-left text-[15px]
                          transition-all duration-150
                          flex items-center justify-between
                          gap-3
                        `,
                          isSelected &&
                            `
                          bg-[#037ECC]/5
                          text-[#037ECC]
                          font-medium
                        `,
                          !isSelected &&
                            `
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
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
})
