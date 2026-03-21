"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { SearchInput } from "@/components/custom/SearchInput"

interface PayersToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  onNewPayer: () => void
}

export function PayersToolbar({
  search,
  onSearchChange,
  onNewPayer,
}: PayersToolbarProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm p-4 md:p-5 mb-6">
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div className="w-full lg:max-w-xl">
          <SearchInput
            value={search}
            onChange={onSearchChange}
            placeholder="Search payers by name"
          />
        </div>

        <Button variant="primary" onClick={onNewPayer} className="gap-2 w-full lg:w-auto">
          <Plus className="w-4 h-4" />
          Add payer
        </Button>
      </div>
    </div>
  )
}
