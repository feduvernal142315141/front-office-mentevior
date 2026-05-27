"use client"

import { useEffect, useRef } from "react"

import { Button } from "@/components/custom/Button"

interface CreateItemInlineFormProps {
  name: string
  isSaving: boolean
  onChangeName: (name: string) => void
  onCancel: () => void
  onSave: () => void
}

export function CreateItemInlineForm({
  name,
  isSaving,
  onChangeName,
  onCancel,
  onSave,
}: CreateItemInlineFormProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(event) => onChangeName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
            onSave()
          }
          if (event.key === "Escape") {
            onCancel()
          }
        }}
        disabled={isSaving}
        placeholder="Item name"
        className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 sm:flex-1"
      />
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <Button
          type="button"
          variant="primary"
          onClick={onSave}
          disabled={name.trim().length === 0 || isSaving}
          className="h-8 px-3 text-xs"
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  )
}
