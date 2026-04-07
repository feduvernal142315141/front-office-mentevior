"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useDebouncedState } from "@/lib/hooks/use-debounced-state"
import { usePayers } from "@/lib/modules/payers/hooks/use-payers"
import { getPayersService } from "@/lib/modules/payers/services/payers.service"
import type { Payer } from "@/lib/types/payer.types"
import { usePayersPermissionFallback } from "./usePayersPermissionFallback"

export function usePayersTable() {
  const [inputValue, setInputValue] = useState("")
  const [searchQuery, setSearchQuery] = useDebouncedState("", 500)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [payerToDelete, setPayerToDelete] = useState<Payer | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { payers, totalCount, isLoading, error, refresh } = usePayers(
    searchQuery as string,
    page - 1,
    pageSize,
  )
  const { canEditPayers, canDeletePayers } = usePayersPermissionFallback()

  const handleSearchChange = (value: string) => {
    setInputValue(value)
    setSearchQuery(value)
    setPage(1)
  }

  const clearFilters = () => {
    setInputValue("")
    setSearchQuery("")
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1)
  }

  const handleDeleteConfirm = async () => {
    if (!payerToDelete || !canDeletePayers) return

    setIsDeleting(true)
    try {
      await getPayersService().delete(payerToDelete.id)
      toast.success("Payer deleted successfully")
      setPayerToDelete(null)
      refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete payer"
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  return {
    data: payers,
    isLoading,
    error,
    totalCount,
    filters: {
      inputValue,
      searchQuery: searchQuery as string,
      setSearchQuery: handleSearchChange,
    },
    pagination: {
      page,
      pageSize,
      total: totalCount,
      onPageChange: handlePageChange,
      onPageSizeChange: handlePageSizeChange,
      pageSizeOptions: [10, 25, 50, 100],
    },
    clearFilters,
    refetch: refresh,
    canEditPayers,
    canDeletePayers,
    deleteState: {
      isOpen: Boolean(payerToDelete),
      payer: payerToDelete,
      isDeleting,
      open: (payer: Payer) => setPayerToDelete(payer),
      close: () => setPayerToDelete(null),
      confirm: handleDeleteConfirm,
    },
  }
}
