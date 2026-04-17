"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useDiagnosisCatalogSearch } from "@/lib/modules/diagnoses/hooks/use-diagnosis-catalog-search"
import type { DiagnosisCatalogItem } from "@/lib/types/diagnosis-catalog.types"

const MIN_SEARCH = 2

interface DiagnosisCodeComboboxProps {
  value: string
  onChange: (code: string) => void
  onBlur?: () => void
  onCatalogPick: (item: DiagnosisCatalogItem) => void
  hasError?: boolean
  required?: boolean
  disabled?: boolean
}

export function DiagnosisCodeCombobox({
  value,
  onChange,
  onBlur,
  onCatalogPick,
  hasError,
  required,
  disabled,
}: DiagnosisCodeComboboxProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const { items, totalCount, isLoading, termForFetch } = useDiagnosisCatalogSearch(inputValue, open)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleInputChange = (v: string) => {
    setInputValue(v)
    onChange(v)
    setOpen(true)
  }

  const handleSelect = (item: DiagnosisCatalogItem) => {
    onCatalogPick(item)
    setInputValue(item.code)
    setOpen(false)
  }

  const trimmed = termForFetch.trim()
  const isSearchMode = trimmed.length >= MIN_SEARCH
  const showInitialLoading = open && !isSearchMode && isLoading && items.length === 0
  const showSearchLoading = open && isSearchMode && isLoading && items.length === 0
  const showHint = open && inputValue.trim().length === 1 && !isSearchMode
  const showList = open && items.length > 0
  const showEmptySearch = open && isSearchMode && !isLoading && items.length === 0

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverAnchor asChild>
        <div className="relative w-full">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              setOpen(true)
            }}
            onBlur={() => {
              onBlur?.()
            }}
            placeholder=" "
            disabled={disabled}
            autoComplete="off"
            className={cn(
              "peer w-full premium-input h-[52px] 2xl:h-[56px] px-4 pr-10 rounded-[16px] text-[15px] 2xl:text-[16px]",
              "placeholder:text-transparent",
              hasError && "premium-input-error",
              disabled && "opacity-60 cursor-not-allowed",
            )}
          />
          {isLoading && !showInitialLoading && !showSearchLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Loader2 className="h-4 w-4 animate-spin text-[#037ECC]" />
            </div>
          )}
          <label
            className={cn(
              "absolute left-4 px-1 pointer-events-none transition-all duration-200 ease-out whitespace-nowrap",
              "bg-white/20 backdrop-blur-md text-sm text-[var(--color-login-text-muted)]",
              "top-1/2 -translate-y-1/2 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm",
              "peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-[#2563EB]",
              "peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:-translate-y-1/2 peer-[&:not(:placeholder-shown)]:text-xs",
            )}
          >
            Code {required && <span className="text-[#037ECC]">*</span>}
          </label>
        </div>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        sideOffset={8}
        className={cn(
          "p-0 z-[100] w-[min(calc(100vw-48px),560px)] max-h-[min(340px,50vh)] overflow-hidden",
          "rounded-[16px] border border-gray-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
        )}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onWheel={(e) => e.stopPropagation()}
      >
        {showInitialLoading && (
          <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-[#037ECC]" />
            Loading catalog…
          </div>
        )}

        {showSearchLoading && (
          <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-[#037ECC]" />
            Searching…
          </div>
        )}

        {showHint && (
          <div className="px-4 py-2 text-xs text-slate-400 border-b border-slate-100">
            Type one more character to search the full catalog, or choose from the list below
          </div>
        )}

        {showEmptySearch && (
          <div className="px-4 py-3 text-sm text-slate-500">No diagnosis codes found</div>
        )}

        {showList && (
          <div
            className="max-h-[min(300px,45vh)] overflow-y-auto overscroll-contain py-2"
            onWheel={(e) => e.stopPropagation()}
          >
            {!isSearchMode && totalCount > items.length && (
              <p className="px-4 pb-2 text-xs text-slate-400">
                Showing first {items.length.toLocaleString()} of {totalCount.toLocaleString()} — type to search
              </p>
            )}
            {isSearchMode && totalCount > items.length && (
              <p className="px-4 pb-2 text-xs text-slate-400">
                Showing {items.length} of {totalCount.toLocaleString()} matches — refine search to narrow results
              </p>
            )}
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(item)}
                className={cn(
                  "w-full px-4 py-3 text-left transition-colors duration-150",
                  "hover:bg-[#037ECC]/5 border-b border-slate-100 last:border-b-0",
                )}
              >
                <div className="text-sm font-semibold text-slate-900">
                  {item.code}
                  <span className="font-normal text-slate-500"> — {item.shortDescription}</span>
                </div>
                {item.longDescription && item.longDescription !== item.shortDescription && (
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{item.longDescription}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
