"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { CustomTableColumn } from "@/components/custom/CustomTable"
import type { HRDocumentListItem } from "@/lib/types/hr-document.types"
import { useHRDocuments } from "@/lib/modules/hr-documents/hooks/use-hr-documents"
import { Edit2, Trash2 } from "lucide-react"
import { useDebouncedState } from "@/lib/hooks/use-debounced-state"
import { buildFilters } from "@/lib/utils/query-filters"
import { DeleteConfirmModal } from "@/components/custom/DeleteConfirmModal"
import { deleteHRDocument } from "@/lib/modules/hr-documents/services/hr-documents.service"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Check, X } from "lucide-react"

export function useHRDocumentsTable() {
  const router = useRouter()
  
  const [inputValue, setInputValue] = useState("")
  const [searchQuery, setSearchQuery] = useDebouncedState("", 500)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<HRDocumentListItem | null>(null)
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

  const { data, isLoading, error, refetch } = useHRDocuments({
    page: page - 1,
    pageSize,
    filters: filtersArray,
  })

  const hrDocuments = data?.hrDocuments || []
  const totalCount = data?.totalCount || 0

  useEffect(() => {
    refetch()
  }, [searchQuery, page, pageSize, refetch])

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

  const handleDeleteClick = (document: HRDocumentListItem) => {
    setDocumentToDelete(document)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return

    setIsDeleting(true)
    try {
      await deleteHRDocument(documentToDelete.id)
      toast.success("Document deleted successfully")
      setDeleteModalOpen(false)
      setDocumentToDelete(null)
      refetch()
    } catch (error) {
      console.error("Error deleting document:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to delete document"
      toast.error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false)
    setDocumentToDelete(null)
  }

  const BooleanBadge = ({ value }: { value: boolean }) => {
    if (value) {
      return (
        <Badge 
          variant="outline" 
          className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 transition-colors"
        >
          <Check className="w-3 h-3 mr-1" />
          Yes
        </Badge>
      )
    }
    return (
      <Badge 
        variant="outline" 
        className="bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 transition-colors"
      >
        <X className="w-3 h-3 mr-1" />
        No
      </Badge>
    )
  }

  const columns: CustomTableColumn<HRDocumentListItem>[] = useMemo(() => [
    {
      key: "name",
      header: "Document Name",
      render: (item: HRDocumentListItem) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-gray-900">{item.name}</span>
          {item.isFromCatalog && (
            <span className="text-xs text-slate-500">From Catalog</span>
          )}
        </div>
      ),
    },
    {
      key: "issuedDate",
      header: "Allow Issued Date",
      align: "center" as const,
      render: (item: HRDocumentListItem) => (
        <div className="flex justify-center">
          <BooleanBadge value={item.issuedDate} />
        </div>
      ),
    },
    {
      key: "expirationDate",
      header: "Allow Expiration Date",
      align: "center" as const,
      render: (item: HRDocumentListItem) => (
        <div className="flex justify-center">
          <BooleanBadge value={item.expirationDate} />
        </div>
      ),
    },
    {
      key: "uploadFile",
      header: "Allow Upload File",
      align: "center" as const,
      render: (item: HRDocumentListItem) => (
        <div className="flex justify-center">
          <BooleanBadge value={item.uploadFile} />
        </div>
      ),
    },
    {
      key: "downloadFile",
      header: "Allow Download File",
      align: "center" as const,
      render: (item: HRDocumentListItem) => (
        <div className="flex justify-center">
          <BooleanBadge value={item.downloadFile} />
        </div>
      ),
    },
    {
      key: "status",
      header: "Allow Status",
      align: "center" as const,
      render: (item: HRDocumentListItem) => (
        <div className="flex justify-center">
          <BooleanBadge value={item.status} />
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right" as const,
      render: (item: HRDocumentListItem) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => router.push(`/hr-documents/${item.id}/edit`)}
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
            title="Edit document"
            aria-label="Edit document"
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
            title="Delete document"
            aria-label="Delete document"
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
  ], [router])

  const deleteModal = (
    <DeleteConfirmModal
      isOpen={deleteModalOpen}
      onClose={handleDeleteCancel}
      onConfirm={handleDeleteConfirm}
      title="Delete HR Document"
      message="Are you sure you want to delete this document? This action cannot be undone."
      itemName={documentToDelete?.name}
      isDeleting={isDeleting}
    />
  )

  return {
    data: hrDocuments,
    columns,
    isLoading,
    error,
    filters: {
      inputValue,
      searchQuery,
      setSearchQuery: handleSearchChange,
    },
    pagination: {
      page,
      pageSize,
      total: totalCount,
      onPageChange: handlePageChange,
      onPageSizeChange: handlePageSizeChange,
    },
    clearFilters,
    refetch,
    deleteModal,
  }
}
