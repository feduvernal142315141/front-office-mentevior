"use client"

import { SearchInput } from "@/components/custom/SearchInput"

interface PayersToolbarProps {
  search: string
  onSearchChange: (value: string) => void
}

export function PayersToolbar({ search, onSearchChange }: PayersToolbarProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm p-4 md:p-5 mb-6">
      <div className="w-full">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Search payers by name"
        />
      </div>
    </div>
  )
}
