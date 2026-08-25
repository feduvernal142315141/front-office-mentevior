"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { usePayerCatalogSearch } from "@/lib/modules/payers/hooks/use-payer-catalog-search"
import type { PayerCatalogSearchItem } from "@/lib/types/payer.types"

interface PayerExternalIdFieldProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  hasError?: boolean
  errorMessage?: string
  disabled?: boolean
  required?: boolean
  clearingHouseId: string
  searchText: string
  payerState?: string
}

export function PayerExternalIdField({
  value,
  onChange,
  onBlur,
  hasError,
  errorMessage,
  disabled,
  required,
  clearingHouseId,
  searchText,
  payerState,
}: PayerExternalIdFieldProps) {
  const [open, setOpen] = useState(false)
  const clickedInputRef = useRef(false)
  const autoFilledForRef = useRef<string>("")
  const isEmpty = !value.trim()
  const canSearch = Boolean(clearingHouseId && searchText.trim() && !disabled)
  const { items, isLoading } = usePayerCatalogSearch({
    clearingHouseId,
    searchText,
    payerState,
    enabled: canSearch && (isEmpty || open),
  })

  const searchKey = `${clearingHouseId}|${searchText.trim().toLowerCase()}|${payerState ?? ""}`

  useEffect(() => {
    if (disabled || !isEmpty || items.length !== 1) return
    if (autoFilledForRef.current === searchKey) return
    autoFilledForRef.current = searchKey
    onChange(items[0].externalPayerId)
    setOpen(false)
  }, [disabled, isEmpty, items, onChange, searchKey])

  useEffect(() => {
    if (!disabled && isEmpty && items.length > 1) {
      setOpen(true)
    }
  }, [disabled, isEmpty, items.length])

  const handleSelect = (item: PayerCatalogSearchItem) => {
    autoFilledForRef.current = searchKey
    onChange(item.externalPayerId)
    setOpen(false)
  }

  const showList = open && items.length > 0
  const showEmpty = open && canSearch && !isLoading && items.length === 0 && Boolean(searchText.trim())
  const showHint = open && !clearingHouseId
  const showNeedName = open && Boolean(clearingHouseId) && !searchText.trim()

  return (
    <div>
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (!next && clickedInputRef.current) {
            clickedInputRef.current = false
            return
          }
          clickedInputRef.current = false
          setOpen(next)
        }}
        modal={false}
      >
        <PopoverAnchor asChild>
          <div className="relative w-full">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onMouseDown={() => {
                clickedInputRef.current = true
                if (!disabled) setOpen(true)
              }}
              onFocus={() => {
                if (!disabled) setOpen(true)
              }}
              onBlur={() => onBlur?.()}
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
            {isLoading && (
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
              External ID {required && <span className="text-[#037ECC]">*</span>}
            </label>
          </div>
        </PopoverAnchor>

        <PopoverContent
          align="start"
          sideOffset={8}
          className={cn(
            "p-0 z-[100] w-[var(--radix-popover-trigger-width)] max-h-[min(340px,50vh)] overflow-hidden",
            "rounded-[16px] border border-gray-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onWheel={(e) => e.stopPropagation()}
        >
          {isLoading && items.length === 0 && (
            <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-[#037ECC]" />
              Searching catalog…
            </div>
          )}
          {showHint && (
            <div className="px-4 py-3 text-sm text-slate-500">
              Select a clearing house to suggest an External ID
            </div>
          )}
          {showNeedName && (
            <div className="px-4 py-3 text-sm text-slate-500">
              Enter the payer name to search the catalog
            </div>
          )}
          {showEmpty && (
            <div className="px-4 py-3 text-sm text-slate-500">No matching payer IDs found</div>
          )}
          {showList && (
            <div className="max-h-[min(300px,45vh)] overflow-y-auto overscroll-contain py-2">
              <p className="px-4 pb-2 text-xs text-slate-400">
                Suggestions from the selected clearing house
              </p>
              {items.map((item) => (
                <button
                  key={`${item.externalPayerId}-${item.catalogName}-${item.payerState ?? ""}`}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(item)}
                  className={cn(
                    "w-full px-4 py-3 text-left transition-colors duration-150",
                    "hover:bg-[#037ECC]/5 border-b border-slate-100 last:border-b-0",
                  )}
                >
                  <div className="text-sm font-semibold text-slate-900">
                    {item.externalPayerId}
                    <span className="font-normal text-slate-500"> — {item.catalogName}</span>
                  </div>
                  {(item.alternateNames?.length || item.payerState) && (
                    <p className="mt-1 text-xs text-slate-500">
                      {[item.alternateNames?.join(", "), item.payerState].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
      {!disabled && errorMessage && (
        <p className="text-sm text-red-600 mt-2">{errorMessage}</p>
      )}
    </div>
  )
}
