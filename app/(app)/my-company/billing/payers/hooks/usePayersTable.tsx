"use client"

import { useMemo, useState } from "react"
import { Edit2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useDebouncedState } from "@/lib/hooks/use-debounced-state"
import { usePayers } from "@/lib/modules/payers/hooks/use-payers"
import { getPayersService } from "@/lib/modules/payers/services/payers.service"
import { PAYER_SOURCE, type Payer, type PayerSource } from "@/lib/types/payer.types"
import type { CustomTableColumn } from "@/components/custom/CustomTable"
import { DeleteConfirmModal } from "@/components/custom/DeleteConfirmModal"
import { EditPayerModal } from "../components/phase-3/EditPayerModal"

function getSourceLabel(source: PayerSource): string {
  if (source === PAYER_SOURCE.CATALOG) return "Private Insurance"
  if (source === PAYER_SOURCE.FL_MEDICAID) return "FL Medicaid"
  return "Manual"
}

export function usePayersTable() {
  const [inputValue, setInputValue] = useState("")
  const [searchQuery, setSearchQuery] = useDebouncedState("", 400)
  const [payerIdToEdit, setPayerIdToEdit] = useState<string | null>(null)
  const [payerToDelete, setPayerToDelete] = useState<Payer | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { payers, isLoading, error, refresh } = usePayers(searchQuery as string)

  const handleSearchChange = (value: string) => {
    setInputValue(value)
    setSearchQuery(value)
  }

  const clearFilters = () => {
    setInputValue("")
    setSearchQuery("")
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
          <span className="font-medium text-gray-900">{payer.name}</span>
        ),
      },
      {
        key: "source",
        header: "Source",
        render: (payer) => (
          <span className="text-sm text-gray-600">{getSourceLabel(payer.source)}</span>
        ),
      },
      {
        key: "phone",
        header: "Phone",
        render: (payer) => (
          <span className="text-sm text-gray-600">{payer.phone || "—"}</span>
        ),
      },
      {
        key: "planType",
        header: "Plan Type",
        render: (payer) => (
          <span className="text-sm text-gray-600">{payer.planTypeName || "Not configured"}</span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "right" as const,
        render: (payer) => (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setPayerIdToEdit(payer.id)}
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
    [],
  )

  const modals = (
    <>
      <EditPayerModal
        payerId={payerIdToEdit}
        open={Boolean(payerIdToEdit)}
        onOpenChange={(next) => { if (!next) setPayerIdToEdit(null) }}
        onSaved={refresh}
      />
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
    clearFilters,
    refetch: refresh,
    modals,
  }
}
