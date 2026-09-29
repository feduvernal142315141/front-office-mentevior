"use client"

import { useCallback, useState } from "react"

export interface AuditModalState<T> {
  open: boolean
  selectedItem: T | null
  onOpenChange: (open: boolean) => void
  openFor: (item: T) => void
}

export function useAuditModalState<T>(): AuditModalState<T> {
  const [open, setOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<T | null>(null)

  const onOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setSelectedItem(null)
    }
  }, [])

  const openFor = useCallback((item: T) => {
    setSelectedItem(item)
    setOpen(true)
  }, [])

  return {
    open,
    selectedItem,
    onOpenChange,
    openFor,
  }
}
