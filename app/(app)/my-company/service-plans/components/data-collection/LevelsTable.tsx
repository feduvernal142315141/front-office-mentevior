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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  }

  const handleAddFromLibrary = () => {
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

      {/* Add levels — menu portals outside collapsible/drawer overflow */}
      <div className="flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="primary"
              disabled={disabled}
              className="text-sm h-9 px-4 rounded-lg data-[state=open]:[&_svg:last-child]:rotate-180"
            >
              <Plus className="w-4 h-4" />
              Add levels
              <ChevronDown className="w-3.5 h-3.5 transition-transform duration-150" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="center"
            sideOffset={6}
            className="min-w-[180px] rounded-xl border border-gray-200 bg-white p-1 shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
          >
            <DropdownMenuItem
              onClick={handleAddManual}
              className="cursor-pointer rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:bg-gray-50"
            >
              <Plus className="w-4 h-4 text-gray-400" />
              Manual
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleAddFromLibrary}
              className="cursor-pointer rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:bg-gray-50"
            >
              <BookOpen className="w-4 h-4 text-gray-400" />
              From Library
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
