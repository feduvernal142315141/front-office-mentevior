"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Edit2, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { useDebouncedState } from "@/lib/hooks/use-debounced-state"
import { usePayers } from "@/lib/modules/payers/hooks/use-payers"
import { getPayersService } from "@/lib/modules/payers/services/payers.service"
import type { Payer } from "@/lib/types/payer.types"
import type { CustomTableColumn } from "@/components/custom/CustomTable"
import { DeleteConfirmModal } from "@/components/custom/DeleteConfirmModal"
import { parseLocalDate } from "@/lib/date"

function PayerNameCell({ payer }: { payer: Payer }) {
  const [imageError, setImageError] = useState(false)
  const showImage = Boolean(payer.logoUrl) && !imageError
  const initials = (payer.name || "PI")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")

  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-slate-200/70 bg-gradient-to-br from-white to-slate-50 shadow-sm shadow-slate-900/5">
        {showImage ? (
          <img
            src={payer.logoUrl ?? ""}
            alt={`${payer.name} logo`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#037ECC]/15 via-[#079CFB]/10 to-[#037ECC]/20 text-xs font-semibold tracking-wide text-[#037ECC]">
            {initials}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <span className="block truncate font-semibold text-slate-900">{payer.name}</span>
      </div>
    </div>
  )
}

export function usePayersTable() {
  const router = useRouter()
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
    if (!payerToDelete) return

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

  const columns: CustomTableColumn<Payer>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        render: (payer) => (
          <PayerNameCell payer={payer} />
        ),
      },
      {
        key: "planType",
        header: "Allow Clearing Houses",
        render: (payer) => (
          <span className="text-sm text-gray-600">{payer.clearingHouseName || payer.planTypeName || "Not configured"}</span>
        ),
      },
      {
        key: "createdAt",
        header: "Created",
        render: (payer) => (
          <span className="text-sm text-gray-600">
            {payer.createdAt ? format(parseLocalDate(payer.createdAt), "MMM dd, yyyy") : "-"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "right" as const,
        render: (payer) => (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => router.push(`/my-company/billing/payers/${payer.id}/edit`)}
              className="
                group/edit relative h-9 w-9
                flex items-center justify-center rounded-xl
                bg-gradient-to-b from-blue-50 to-blue-100/80
                border border-blue-200/60 shadow-sm shadow-blue-900/5
                hover:from-blue-100 hover:to-blue-200/90 hover:border-blue-300/80
                hover:shadow-md hover:shadow-blue-900/10 hover:-translate-y-0.5
                active:translate-y-0 active:shadow-sm
                transition-all duration-200 ease-out
                focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2
              "
              title="Edit payer"
              aria-label="Edit payer"
            >
              <Edit2 className="w-4 h-4 text-blue-600 group-hover/edit:text-blue-700 transition-colors duration-200" />
            </button>

            <button
              onClick={() => setPayerToDelete(payer)}
              className="
                group/delete relative h-9 w-9
                flex items-center justify-center rounded-xl
                bg-gradient-to-b from-red-50 to-red-100/80
                border border-red-200/60 shadow-sm shadow-red-900/5
                hover:from-red-100 hover:to-red-200/90 hover:border-red-300/80
                hover:shadow-md hover:shadow-red-900/10 hover:-translate-y-0.5
                active:translate-y-0 active:shadow-sm
                transition-all duration-200 ease-out
                focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:ring-offset-2
              "
              title="Delete payer"
              aria-label="Delete payer"
            >
              <Trash2 className="w-4 h-4 text-red-600 group-hover/delete:text-red-700 transition-colors duration-200" />
            </button>
          </div>
        ),
      },
    ],
    [router],
  )

  const modals = (
    <>
      <DeleteConfirmModal
        isOpen={Boolean(payerToDelete)}
        onClose={() => setPayerToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Payer"
        message="Are you sure you want to delete this payer? This action cannot be undone."
        itemName={payerToDelete?.name}
        isDeleting={isDeleting}
      />
    </>
  )

  return {
    data: payers,
    columns,
    isLoading,
    error,
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
    modals,
  }
}
