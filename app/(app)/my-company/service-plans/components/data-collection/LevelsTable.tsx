"use client"

import { useState } from "react"
import { ChevronDown, Plus, Trash2, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/custom/Button"
import type { DataCollectionLevel } from "@/lib/types/data-collection.types"
import { LevelsLibraryModal } from "./LevelsLibraryModal"

interface LevelsTableProps {
  levels: DataCollectionLevel[]
  onChange: (levels: DataCollectionLevel[]) => void
  showValueToggle?: boolean
  showCumulative?: boolean
  cumulative?: boolean
  onCumulativeChange?: (v: boolean) => void
  disabled?: boolean
}

export function LevelsTable({
  levels,
  onChange,
  showValueToggle = false,
  showCumulative = false,
  cumulative = false,
  onCumulativeChange,
  disabled = false,
}: LevelsTableProps) {
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)

  const handleLabelChange = (id: string, newLabel: string) => {
    onChange(levels.map((l) => (l.id === id ? { ...l, label: newLabel } : l)))
  }

  const handleDescriptionChange = (id: string, newDesc: string) => {
    onChange(levels.map((l) => (l.id === id ? { ...l, description: newDesc } : l)))
  }

  const handleValueChange = (id: string, newValue: boolean) => {
    onChange(levels.map((l) => (l.id === id ? { ...l, value: newValue } : l)))
  }

  const handleDelete = (id: string) => {
    onChange(levels.filter((l) => l.id !== id))
  }

  const handleAddManual = () => {
    const newLevel: DataCollectionLevel = {
      id: crypto.randomUUID(),
      label: "",
      description: "",
      value: showValueToggle ? false : undefined,
    }
    onChange([...levels, newLevel])
    setAddMenuOpen(false)
  }

  const handleAddFromLibrary = () => {
    setAddMenuOpen(false)
    setLibraryOpen(true)
  }

  const handleInsertFromLibrary = (newLevels: DataCollectionLevel[]) => {
    onChange([...levels, ...newLevels])
    setLibraryOpen(false)
  }

  const existingLabels = levels.map((l) => l.label)

  return (
    <div className="space-y-3">
      {/* Header with Cumulative toggle */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-slate-700">Levels</h4>
        {showCumulative && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Cumulative</span>
            <SwitchPrimitives.Root
              checked={cumulative}
              onCheckedChange={(v) => onCumulativeChange?.(v)}
              disabled={disabled}
              className={cn(
                "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50",
                cumulative ? "bg-[#037ECC]" : "bg-gray-200"
              )}
            >
              <SwitchPrimitives.Thumb
                className={cn(
                  "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
                  "data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
                )}
              />
            </SwitchPrimitives.Root>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80">
              <TableHead className="w-[90px] text-xs font-semibold text-slate-500">Label</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500">Description</TableHead>
              {showValueToggle && (
                <TableHead className="w-[80px] text-center text-xs font-semibold text-slate-500">Value</TableHead>
              )}
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {levels.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showValueToggle ? 4 : 3}
                  className="text-center text-sm text-gray-400 py-6"
                >
                  No levels added yet
                </TableCell>
              </TableRow>
            ) : (
              levels.map((level) => (
                <TableRow key={level.id} className="group">
                  <TableCell className="p-1.5">
                    <input
                      type="text"
                      value={level.label}
                      onChange={(e) => handleLabelChange(level.id, e.target.value)}
                      disabled={disabled}
                      placeholder="..."
                      className={cn(
                        "w-full px-2.5 py-2 text-sm text-center rounded-lg border border-gray-200",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400",
                        "transition-all duration-150",
                        "bg-white hover:border-gray-300",
                        disabled && "opacity-50 cursor-not-allowed"
                      )}
                    />
                  </TableCell>
                  <TableCell className="p-1.5">
                    <input
                      type="text"
                      value={level.description}
                      onChange={(e) => handleDescriptionChange(level.id, e.target.value)}
                      disabled={disabled}
                      placeholder="Enter description"
                      className={cn(
                        "w-full px-3 py-2 text-sm rounded-lg border border-gray-200",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400",
                        "transition-all duration-150",
                        "bg-white hover:border-gray-300",
                        disabled && "opacity-50 cursor-not-allowed"
                      )}
                    />
                  </TableCell>
                  {showValueToggle && (
                    <TableCell className="p-1.5 text-center">
                      <SwitchPrimitives.Root
                        checked={level.value ?? false}
                        onCheckedChange={(v) => handleValueChange(level.id, v)}
                        disabled={disabled}
                        className={cn(
                          "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                          "disabled:cursor-not-allowed disabled:opacity-50",
                          level.value ? "bg-green-500" : "bg-gray-200"
                        )}
                      >
                        <SwitchPrimitives.Thumb
                          className={cn(
                            "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
                            "data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
                          )}
                        />
                      </SwitchPrimitives.Root>
                    </TableCell>
                  )}
                  <TableCell className="p-1.5">
                    <button
                      type="button"
                      onClick={() => handleDelete(level.id)}
                      disabled={disabled}
                      className={cn(
                        "p-1.5 rounded-lg transition-all duration-150",
                        "text-gray-300 hover:text-red-500 hover:bg-red-50",
                        "opacity-0 group-hover:opacity-100",
                        disabled && "pointer-events-none"
                      )}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add levels button with dropdown */}
      <div className="flex justify-center relative">
        <div className="relative">
          <Button
            type="button"
            variant="primary"
            onClick={() => setAddMenuOpen(!addMenuOpen)}
            disabled={disabled}
            className="text-sm h-9 px-4 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Add levels
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 transition-transform duration-150",
                addMenuOpen && "rotate-180"
              )}
            />
          </Button>

          {addMenuOpen && (
            <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-50 bg-white border border-gray-200 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden min-w-[180px] animate-in fade-in-0 duration-150">
              <button
                type="button"
                onClick={handleAddManual}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-400" />
                Manual
              </button>
              <div className="mx-3 border-t border-gray-100" />
              <button
                type="button"
                onClick={handleAddFromLibrary}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-gray-400" />
                From Library
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Levels Library Modal */}
      <LevelsLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onInsert={handleInsertFromLibrary}
        existingLabels={existingLabels}
      />
    </div>
  )
}
