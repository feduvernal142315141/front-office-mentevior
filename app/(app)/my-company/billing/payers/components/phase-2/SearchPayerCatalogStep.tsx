"use client"

import { useRef, useEffect, useState } from "react"
import { Check, Loader2, Search, X } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { Checkbox } from "@/components/custom/Checkbox"
import type { PayerCatalogItem } from "@/lib/types/payer.types"

interface SearchPayerCatalogStepProps {
  description: string
  items: PayerCatalogItem[]
  isLoading: boolean
  error: string | null
  search: string
  onSearchChange: (value: string) => void
  onSelect: (item: PayerCatalogItem) => void
  onBulkCreate: (ids: string[]) => void
  isBulkLoading?: boolean
}

export function SearchPayerCatalogStep({
  description,
  items,
  isLoading,
  error,
  search,
  onSearchChange,
  onSelect,
  onBulkCreate,
  isBulkLoading,
}: SearchPayerCatalogStepProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)))
    }
  }

  const isAllSelected = items.length > 0 && selectedIds.size === items.length
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < items.length
  const selectedCount = selectedIds.size

  const handleAddPayer = () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 1) {
      const item = items.find((i) => i.id === ids[0])
      if (item) onSelect(item)
    } else {
      onBulkCreate(ids)
    }
  }

  const buttonLabel = selectedCount > 1 ? `Add ${selectedCount} payers` : "Add payer"

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        <p className="text-gray-500 text-sm">{description}</p>
      </div>

      {/* Search + Select All */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-200 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name..."
            className="w-full h-12 pl-12 pr-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm transition-all outline-none"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {items.length > 0 && (
          <div className="flex justify-end">
            <button
              onClick={toggleSelectAll}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-medium transition-all whitespace-nowrap
                ${isAllSelected
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : isSomeSelected
                    ? "border-blue-400 bg-blue-50 text-blue-600"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }
              `}
            >
              {(isAllSelected || isSomeSelected) && (
                <Check className="w-4 h-4" strokeWidth={2.5} />
              )}
              Select All
            </button>
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pb-24">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-48 px-6 text-center">
            <p className="text-red-600 text-sm font-medium">Failed to load catalog</p>
            <p className="text-gray-500 text-sm mt-1">{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 px-6 text-center">
            <Search className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">
              {search.trim() ? "No results found. Try a different name." : "No items available."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => {
              const isSelected = selectedIds.has(item.id)
              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelection(item.id)}
                  className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-colors ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}`}
                >
                  <div className="pt-0.5">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelection(item.id)}
                      size="md"
                    />
                  </div>
                  <span className={`text-sm font-medium transition-colors ${isSelected ? "text-blue-700" : "text-gray-800"}`}>
                    {item.name}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Sticky footer */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-gray-600">
            {selectedCount > 0 && (
              <span className="font-medium text-gray-900">{selectedCount} selected</span>
            )}
          </span>
          <Button
            variant="primary"
            onClick={handleAddPayer}
            disabled={selectedCount === 0}
            loading={isBulkLoading}
            className="min-w-[160px]"
          >
            {buttonLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
