"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/custom/Button"
import { Checkbox } from "@/components/custom/Checkbox"
import { LEVELS_LIBRARY } from "@/lib/modules/service-plans/constants/data-collection.constants"
import type { DataCollectionLevel, LevelsLibraryItem } from "@/lib/types/data-collection.types"

interface LevelsLibraryModalProps {
  open: boolean
  onClose: () => void
  onInsert: (levels: DataCollectionLevel[]) => void
  existingLabels?: string[]
}

export function LevelsLibraryModal({
  open,
  onClose,
  onInsert,
  existingLabels = [],
}: LevelsLibraryModalProps) {
  const [activeGroupId, setActiveGroupId] = useState(LEVELS_LIBRARY[0]?.id ?? "")
  const [selectedItems, setSelectedItems] = useState<Map<string, LevelsLibraryItem>>(new Map())

  const activeGroup = LEVELS_LIBRARY.find((g) => g.id === activeGroupId)

  const groupSelectionState = useMemo(() => {
    const state: Record<string, "none" | "some" | "all"> = {}
    for (const group of LEVELS_LIBRARY) {
      const selectedCount = group.items.filter((item) => selectedItems.has(item.id)).length
      if (selectedCount === 0) state[group.id] = "none"
      else if (selectedCount === group.items.length) state[group.id] = "all"
      else state[group.id] = "some"
    }
    return state
  }, [selectedItems])

  const toggleItem = (item: LevelsLibraryItem) => {
    setSelectedItems((prev) => {
      const next = new Map(prev)
      if (next.has(item.id)) {
        next.delete(item.id)
      } else {
        next.set(item.id, item)
      }
      return next
    })
  }

  const toggleGroup = (groupId: string) => {
    const group = LEVELS_LIBRARY.find((g) => g.id === groupId)
    if (!group) return

    setSelectedItems((prev) => {
      const next = new Map(prev)
      const allSelected = group.items.every((item) => next.has(item.id))

      if (allSelected) {
        group.items.forEach((item) => next.delete(item.id))
      } else {
        group.items.forEach((item) => next.set(item.id, item))
      }
      return next
    })
  }

  const handleInsert = () => {
    const newLevels: DataCollectionLevel[] = Array.from(selectedItems.values())
      .filter((item) => !existingLabels.includes(item.abbreviation))
      .map((item) => ({
        id: crypto.randomUUID(),
        label: item.abbreviation,
        description: item.name,
      }))
    onInsert(newLevels)
    handleClose()
  }

  const handleClose = () => {
    setSelectedItems(new Map())
    setActiveGroupId(LEVELS_LIBRARY[0]?.id ?? "")
    onClose()
  }

  const totalSelected = selectedItems.size

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="sm:max-w-[620px] !rounded-2xl p-0 gap-0 overflow-hidden bg-white shadow-[0_25px_60px_rgba(0,0,0,0.15)]"
        showCloseButton
      >
        <DialogTitle className="px-6 py-5 border-b border-slate-100 text-lg font-semibold text-slate-800">
          Levels
        </DialogTitle>

        <div className="flex min-h-[340px] max-h-[440px]">
          {/* Left panel — groups */}
          <div className="w-[210px] border-r border-slate-100 overflow-y-auto bg-slate-50/50">
            <div className="py-2">
              {LEVELS_LIBRARY.map((group) => {
                const isActive = group.id === activeGroupId
                const selState = groupSelectionState[group.id]

                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setActiveGroupId(group.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-4 py-3.5 text-left transition-all duration-150",
                      isActive
                        ? "bg-white border-r-2 border-r-[#037ECC] shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                        : "hover:bg-white/60"
                    )}
                  >
                    <Checkbox
                      checked={selState === "all"}
                      indeterminate={selState === "some"}
                      onCheckedChange={() => toggleGroup(group.id)}
                      size="sm"
                    />
                    <span
                      className={cn(
                        "text-sm flex-1 truncate leading-tight",
                        isActive ? "font-semibold text-[#037ECC]" : "text-slate-600"
                      )}
                    >
                      {group.name}
                    </span>
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 flex-shrink-0 transition-colors",
                        isActive ? "text-[#037ECC]" : "text-slate-300"
                      )}
                    />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right panel — items */}
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="py-2">
              {activeGroup?.items.map((item) => {
                const isSelected = selectedItems.has(item.id)
                const alreadyExists = existingLabels.includes(item.abbreviation)

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => !alreadyExists && toggleItem(item)}
                    disabled={alreadyExists}
                    className={cn(
                      "w-full flex items-center gap-3 px-5 py-3 text-left transition-all duration-150",
                      isSelected && "bg-blue-50/70",
                      !isSelected && !alreadyExists && "hover:bg-slate-50",
                      alreadyExists && "opacity-35 cursor-not-allowed"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleItem(item)}
                      disabled={alreadyExists}
                      size="sm"
                    />
                    <span
                      className={cn(
                        "text-sm leading-tight",
                        isSelected ? "font-medium text-[#037ECC]" : "text-slate-700"
                      )}
                    >
                      {item.name}
                      <span className={cn(
                        "ml-1",
                        isSelected ? "text-[#037ECC]/60" : "text-slate-400"
                      )}>
                        ({item.abbreviation})
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/40">
          <Button type="button" variant="secondary" onClick={handleClose} className="min-w-[90px]">
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleInsert}
            disabled={totalSelected === 0}
            className="min-w-[90px]"
          >
            Insert{totalSelected > 0 ? ` (${totalSelected})` : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
