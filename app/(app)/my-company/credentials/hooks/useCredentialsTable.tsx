"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { CustomTableColumn } from "@/components/custom/CustomTable"
import type { CredentialListItem } from "@/lib/types/credential.types"
import { useCredentials } from "@/lib/modules/credentials/hooks/use-credentials"
import { Edit2, Trash2 } from "lucide-react"
import { useDebouncedState } from "@/lib/hooks/use-debounced-state"
import { buildFilters } from "@/lib/utils/query-filters"
import { DeleteConfirmModal } from "@/components/custom/DeleteConfirmModal"
import { deleteCredential } from "@/lib/modules/credentials/services/credentials.service"
import { toast } from "sonner"

export function useCredentialsTable() {
  const router = useRouter()
  
  const [inputValue, setInputValue] = useState("")
  const [searchQuery, setSearchQuery] = useDebouncedState("", 500)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [credentialToDelete, setCredentialToDelete] = useState<CredentialListItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filtersArray = useMemo(() => {
    return buildFilters(
      [],
      {
        fields: ["name"],
        search: searchQuery,
      }
    )
  }, [searchQuery])

  const { credentials, totalCount, isLoading, error, refetch } = useCredentials({
    page: page - 1,
    pageSize,
    filters: filtersArray,
  })

  useEffect(() => {
    refetch({
      page: page - 1,
      pageSize,
      filters: filtersArray,
    })
  }, [searchQuery, page, pageSize, filtersArray, refetch])

  const handleSearchChange = (value: string) => {
    setInputValue(value)
    setSearchQuery(value)
    setPage(1)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setInputValue("")
    setPage(1)
  }
  
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1)
  }

  const handleDeleteClick = (credential: CredentialListItem) => {
    setCredentialToDelete(credential)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!credentialToDelete) return

    setIsDeleting(true)
    try {
      await deleteCredential(credentialToDelete.id)
      toast.success("Credential deleted successfully")
      setDeleteModalOpen(false)
      setCredentialToDelete(null)
      refetch({ page: page - 1, pageSize, filters: filtersArray })
    } catch (error) {
      console.error("Error deleting credential:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to delete credential"
      toast.error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false)
    setCredentialToDelete(null)
  }

  const columns: CustomTableColumn<CredentialListItem>[] = useMemo(() => [
    {
      key: "name",
      header: "Name",
      render: (item: CredentialListItem) => (
        <span className="text-lg font-bold text-gray-900">{item.name}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right" as const,
      render: (item: CredentialListItem) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => router.push(`/my-company/credentials/${item.id}/edit`)}
            className="
              group/edit
              relative
              h-9 w-9
              flex items-center justify-center
              rounded-xl
              bg-gradient-to-b from-blue-50 to-blue-100/80
              border border-blue-200/60
              shadow-sm shadow-blue-900/5
              hover:from-blue-100 hover:to-blue-200/90
              hover:border-blue-300/80
              hover:shadow-md hover:shadow-blue-900/10
              hover:-translate-y-0.5
              active:translate-y-0 active:shadow-sm
              transition-all duration-200 ease-out
              focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2
            "
            title="Edit credential"
            aria-label="Edit credential"
          >
            <Edit2 className="
              w-4 h-4
              text-blue-600
              group-hover/edit:text-blue-700
              transition-colors duration-200
            " />
          </button>
          
          <button
            onClick={() => handleDeleteClick(item)}
            className="
              group/delete
              relative
              h-9 w-9
              flex items-center justify-center
              rounded-xl
              bg-gradient-to-b from-red-50 to-red-100/80
              border border-red-200/60
              shadow-sm shadow-red-900/5
              hover:from-red-100 hover:to-red-200/90
              hover:border-red-300/80
              hover:shadow-md hover:shadow-red-900/10
              hover:-translate-y-0.5
              active:translate-y-0 active:shadow-sm
              transition-all duration-200 ease-out
              focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:ring-offset-2
            "
            title="Delete credential"
            aria-label="Delete credential"
          >
            <Trash2 className="
              w-4 h-4
              text-red-600
              group-hover/delete:text-red-700
              transition-colors duration-200
            " />
          </button>
        </div>
      ),
    },
  ], [router, handleDeleteClick])

  const pagination = {
    page,
    pageSize,
    total: totalCount,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
    pageSizeOptions: [10, 25, 50, 100],
  }

  return {
    data: credentials,
    columns,
    isLoading,
    error,
    filters: {
      searchQuery,
      inputValue,
      setSearchQuery: handleSearchChange,
      setInputValue,
    },
    pagination,
    totalCount,
    filteredCount: credentials.length,
    clearFilters,
    refetch: () => refetch({ page: page - 1, pageSize, filters: filtersArray }),
    deleteModal: (
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Credential"
        message="Are you sure you want to delete this credential? This action cannot be undone."
        itemName={credentialToDelete?.name}
        isDeleting={isDeleting}
      />
    ),
  }
}
