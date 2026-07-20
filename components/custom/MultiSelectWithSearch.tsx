"use client"

import { useRef, useState } from "react"
import { Check, ChevronDown, Loader2, Pencil, Plus, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { RecommendationCatalogItem } from "@/lib/types/client-service-plan.types"

const FILL_IN_BLANK_PATTERN = /_{4,}/

function hasFillInBlank(name: string): boolean {
  return FILL_IN_BLANK_PATTERN.test(name)
}

interface MultiSelectWithSearchProps {
  label: string
  items: RecommendationCatalogItem[]
  selectedIds: string[]
  onChange: (selectedIds: string[]) => void
  isLoading?: boolean
  grouped?: boolean
  allowCreate?: boolean
  onCreate?: (name: string) => Promise<string | void>
  fillInBlankValues?: Record<string, string>
  onFillInBlankChange?: (itemId: string, text: string) => void
  disabled?: boolean
  hasError?: boolean
  required?: boolean
}

export function MultiSelectWithSearch({
  label,
  items,
  selectedIds,
  onChange,
  isLoading = false,
  grouped = false,
  allowCreate = false,
  onCreate,
  fillInBlankValues = {},
  onFillInBlankChange,
  disabled = false,
  hasError = false,
  required = false,
}: MultiSelectWithSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [createName, setCreateName] = useState("")
  const [isSavingCreate, setIsSavingCreate] = useState(false)

  const searchRef = useRef<HTMLInputElement>(null)
  const createRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const normalizedSearch = searchTerm.trim().toLowerCase()

  const filteredItems = normalizedSearch
    ? items.filter((item) => item.name.toLowerCase().includes(normalizedSearch))
    : items

  // Group items by item.group when grouped=true
  const groupedItems: Map<string, RecommendationCatalogItem[]> = new Map()
  if (grouped) {
    for (const item of filteredItems) {
      const group = item.group ?? "Other"
      if (!groupedItems.has(group)) groupedItems.set(group, [])
      groupedItems.get(group)!.push(item)
    }
  }

  const selectedItems = items.filter((item) => selectedIds.includes(item.id))

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  const removeChip = (id: string) => {
    onChange(selectedIds.filter((s) => s !== id))
  }

  const handleOpen = () => {
    if (disabled) return
    setIsOpen(true)
    setTimeout(() => {
      searchRef.current?.focus()
      dropdownRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
    }, 50)
  }

  const handleSaveCreate = async () => {
    const trimmed = createName.trim()
    if (!trimmed || isSavingCreate || !onCreate) return
    setIsSavingCreate(true)
    try {
      const newId = await onCreate(trimmed)
      if (newId && !selectedIds.includes(newId)) {
        onChange([...selectedIds, newId])
      }
      toast.success("Item added to catalog")
      setCreateName("")
      setIsCreating(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add item")
    } finally {
      setIsSavingCreate(false)
    }
  }

  return (
    <div className="space-y-1.5">
      {/* Label row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-700">{label} {required && <span className="text-[#037ECC]">*</span>}</span>
        {allowCreate && !isCreating && (
          <button
            type="button"
            onClick={() => {
              setIsCreating(true)
              setTimeout(() => createRef.current?.focus(), 50)
            }}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            title="Add new item to catalog"
          >
            <Pencil className="h-3 w-3" />
            Add
          </button>
        )}
      </div>

      {/* Inline create form */}
      {isCreating && (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
          <input
            ref={createRef}
            type="text"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); void handleSaveCreate() }
              if (e.key === "Escape") { setIsCreating(false); setCreateName("") }
            }}
            placeholder="New item name..."
            disabled={isSavingCreate}
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
          />
          <button
            type="button"
            onClick={() => void handleSaveCreate()}
            disabled={!createName.trim() || isSavingCreate}
            className="flex items-center justify-center rounded-md bg-[#037ECC] p-1 text-white disabled:opacity-50"
          >
            {isSavingCreate ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => { setIsCreating(false); setCreateName("") }}
            disabled={isSavingCreate}
            className="rounded-md p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Chips of selected items */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedItems.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 rounded-full border border-[#037ECC]/20 bg-[#037ECC]/8 px-2.5 py-0.5 text-xs font-medium text-[#037ECC]"
            >
              <span>{item.name.replace(FILL_IN_BLANK_PATTERN, "___")}</span>
              <button
                type="button"
                onClick={() => removeChip(item.id)}
                disabled={disabled}
                className="ml-0.5 rounded-full p-0.5 hover:bg-[#037ECC]/20 transition-colors"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Fill-in-blank inputs for selected items */}
      {selectedItems
        .filter((item) => hasFillInBlank(item.name))
        .map((item) => (
          <div key={`fib-${item.id}`} className="space-y-0.5">
            <label className="text-xs text-slate-500">
              {item.name.replace(FILL_IN_BLANK_PATTERN, "(fill in)")}
            </label>
            <input
              type="text"
              value={fillInBlankValues[item.id] ?? ""}
              onChange={(e) => onFillInBlankChange?.(item.id, e.target.value)}
              placeholder="Enter value..."
              className="h-8 w-full rounded-lg border border-slate-200 px-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#037ECC]/50 focus:ring-2 focus:ring-[#037ECC]/10"
            />
          </div>
        ))}

      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled || isLoading}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors",
          isOpen
            ? "border-[#037ECC]/40 bg-white ring-2 ring-[#037ECC]/15"
            : hasError
              ? "premium-input-error bg-white"
              : "border-slate-200 bg-white hover:border-slate-300",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <span className={selectedIds.length === 0 ? "text-slate-400" : "text-slate-700"}>
          {isLoading
            ? "Loading..."
            : selectedIds.length === 0
              ? `Select ${label.toLowerCase()}...`
              : `${selectedIds.length} selected`}
        </span>
        {isLoading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />
        ) : (
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", isOpen && "rotate-180")} />
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => { setIsOpen(false); setSearchTerm("") }}
          />
          <div className="relative z-50">
            <div ref={dropdownRef} className="absolute top-1 left-0 right-0 rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
              {/* Search input */}
              <div className="border-b border-slate-100 p-2">
                <input
                  ref={searchRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#037ECC]/40 focus:ring-2 focus:ring-[#037ECC]/10"
                />
              </div>

              {/* Items list */}
              <div className="max-h-72 overflow-y-auto py-1">
                {filteredItems.length === 0 ? (
                  <p className="px-3 py-4 text-center text-sm text-slate-400">No items found</p>
                ) : grouped ? (
                  Array.from(groupedItems.entries()).map(([group, groupItems]) => (
                    <div key={group}>
                      <div className="sticky top-0 bg-slate-50 px-3 py-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          {group}
                        </span>
                      </div>
                      {groupItems.map((item) => (
                        <ItemRow
                          key={item.id}
                          item={item}
                          isSelected={selectedIds.includes(item.id)}
                          onToggle={toggle}
                        />
                      ))}
                    </div>
                  ))
                ) : (
                  filteredItems.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      isSelected={selectedIds.includes(item.id)}
                      onToggle={toggle}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ItemRow({
  item,
  isSelected,
  onToggle,
}: {
  item: RecommendationCatalogItem
  isSelected: boolean
  onToggle: (id: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(item.id)}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors",
        isSelected ? "bg-[#037ECC]/6 text-[#037ECC]" : "text-slate-700 hover:bg-slate-50"
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
          isSelected
            ? "border-[#037ECC] bg-[#037ECC] text-white"
            : "border-slate-300 bg-white"
        )}
      >
        {isSelected && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1 truncate">{item.name}</span>
    </button>
  )
}
