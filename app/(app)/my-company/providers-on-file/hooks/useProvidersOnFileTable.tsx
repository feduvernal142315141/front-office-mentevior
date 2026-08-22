"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Contact, Edit2, Trash2 } from "lucide-react"
import type { CustomTableColumn } from "@/components/custom/CustomTable"
import { Badge } from "@/components/ui/badge"
import { DeleteConfirmModal } from "@/components/custom/DeleteConfirmModal"
import { useDebouncedState } from "@/lib/hooks/use-debounced-state"
import { buildFilters } from "@/lib/utils/query-filters"
import { usePhysicianSpecialties } from "@/lib/modules/physicians/hooks/use-physician-specialties"
import { useDeleteProviderOnFile } from "@/lib/modules/provider-on-file/hooks/use-delete-provider-on-file"
import { useSaveProviderOnFile } from "@/lib/modules/provider-on-file/hooks/use-save-provider-on-file"
import { getProvidersOnFile } from "@/lib/modules/provider-on-file/services/provider-on-file.service"
import type { ProviderOnFile, SaveProviderOnFileDto } from "@/lib/types/provider-on-file.types"
import { cn } from "@/lib/utils"

export const EMPTY_PROVIDER_FORM: SaveProviderOnFileDto = {
  firstName: "",
  lastName: "",
  agencyName: "",
  specialyId: "",
  phone: "",
  email: "",
}

export function useProvidersOnFileTable() {
  const [providers, setProviders] = useState<ProviderOnFile[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const [searchQuery, setSearchQuery] = useDebouncedState("", 500)
  const [inputValue, setInputValue] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Modal create/edit (form de 6 campos; no amerita páginas dedicadas)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<ProviderOnFile | null>(null)
  const [form, setForm] = useState<SaveProviderOnFileDto>(EMPTY_PROVIDER_FORM)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof SaveProviderOnFileDto, string>>>({})

  const { save, isSaving } = useSaveProviderOnFile()
  const { remove, isDeleting } = useDeleteProviderOnFile()
  const { physicianSpecialties, isLoading: isLoadingSpecialties } = usePhysicianSpecialties()

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [providerToDelete, setProviderToDelete] = useState<ProviderOnFile | null>(null)

  const specialtyNameById = useMemo(
    () => new Map(physicianSpecialties.map((sp) => [sp.id, sp.name])),
    [physicianSpecialties],
  )

  const specialtyOptions = useMemo(
    () => physicianSpecialties.map((sp) => ({ value: sp.id, label: sp.name })),
    [physicianSpecialties],
  )

  const fetchProviders = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const filters = buildFilters(
        [],
        searchQuery ? { fields: ["firstName", "lastName"], search: searchQuery } : undefined,
      )
      const data = await getProvidersOnFile({
        page: page - 1,
        pageSize,
        filters: filters.length > 0 ? filters : undefined,
      })
      setProviders(data.providers)
      setTotalCount(data.totalCount)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch providers on file"))
      setProviders([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, page, pageSize])

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  useEffect(() => {
    setPage(1)
  }, [searchQuery])

  const onSearchChange = (value: string) => {
    setInputValue(value)
    setSearchQuery(value)
  }

  const onClearFilters = () => {
    setSearchQuery("")
    setInputValue("")
    setPage(1)
  }

  // ── Create / edit ──
  const openCreateModal = () => {
    setEditingProvider(null)
    setForm(EMPTY_PROVIDER_FORM)
    setFormErrors({})
    setIsFormModalOpen(true)
  }

  const openEditModal = (provider: ProviderOnFile) => {
    setEditingProvider(provider)
    setForm({
      firstName: provider.firstName,
      lastName: provider.lastName,
      agencyName: provider.agencyName,
      specialyId: provider.specialyId,
      phone: provider.phone,
      email: provider.email,
    })
    setFormErrors({})
    setIsFormModalOpen(true)
  }

  const closeFormModal = () => {
    setIsFormModalOpen(false)
    setEditingProvider(null)
    setForm(EMPTY_PROVIDER_FORM)
    setFormErrors({})
  }

  const updateFormField = (field: keyof SaveProviderOnFileDto, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setFormErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleSave = async () => {
    // Requeridos por backend: todo salvo email
    const newErrors: Partial<Record<keyof SaveProviderOnFileDto, string>> = {}
    if (!form.firstName.trim()) newErrors.firstName = "First name is required"
    if (!form.lastName.trim()) newErrors.lastName = "Last name is required"
    if (!form.agencyName.trim()) newErrors.agencyName = "Agency name is required"
    if (!form.specialyId) newErrors.specialyId = "Specialty is required"
    if (!form.phone.trim()) newErrors.phone = "Phone is required"
    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors)
      return
    }

    const id = await save(
      {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        agencyName: form.agencyName.trim(),
        specialyId: form.specialyId,
        phone: form.phone.trim(),
        email: form.email.trim(),
      },
      editingProvider?.id,
    )
    if (!id) return

    closeFormModal()
    await fetchProviders()
  }

  // ── Delete ──
  const handleDeleteClick = (provider: ProviderOnFile) => {
    setProviderToDelete(provider)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!providerToDelete) return
    const ok = await remove(providerToDelete.id)
    if (!ok) return
    setDeleteModalOpen(false)
    setProviderToDelete(null)
    await fetchProviders()
  }

  const columns: CustomTableColumn<ProviderOnFile>[] = [
    {
      key: "name",
      header: "Name",
      render: (provider) => (
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600">
            <Contact className="w-4 h-4" />
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {provider.firstName} {provider.lastName}
            </div>
            {provider.email && <div className="text-xs text-gray-500">{provider.email}</div>}
          </div>
        </div>
      ),
    },
    {
      key: "agencyName",
      header: "Agency",
      render: (provider) => <span className="text-gray-900">{provider.agencyName || "-"}</span>,
    },
    {
      key: "specialty",
      header: "Specialty",
      render: (provider) => {
        const specialty = provider.specialyName || specialtyNameById.get(provider.specialyId)
        return specialty ? (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            {specialty}
          </Badge>
        ) : (
          <span className="text-gray-400">-</span>
        )
      },
    },
    {
      key: "phone",
      header: "Phone",
      render: (provider) => <span className="text-gray-600">{provider.phone || "-"}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right" as const,
      render: (provider) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => openEditModal(provider)}
            className={cn(
              "group/edit relative h-9 w-9 flex items-center justify-center rounded-xl",
              "bg-gradient-to-b from-blue-50 to-blue-100/80 border border-blue-200/60",
              "shadow-sm shadow-blue-900/5",
              "hover:from-blue-100 hover:to-blue-200/90 hover:border-blue-300/70",
              "hover:shadow-md hover:shadow-blue-900/10 hover:-translate-y-0.5",
              "active:translate-y-0 active:shadow-sm transition-all duration-200 ease-out",
            )}
            title="Edit provider"
            aria-label="Edit provider"
          >
            <Edit2 className="h-4 w-4 text-blue-600 group-hover/edit:text-blue-700 transition-colors duration-200" />
          </button>
          <button
            onClick={() => handleDeleteClick(provider)}
            disabled={isDeleting}
            className={cn(
              "group/delete relative h-9 w-9 flex items-center justify-center rounded-xl",
              "bg-gradient-to-b from-red-50 to-red-100/80 border border-red-200/60",
              "shadow-sm shadow-red-900/5",
              "hover:from-red-100 hover:to-red-200/90 hover:border-red-300/70",
              "hover:shadow-md hover:shadow-red-900/10 hover:-translate-y-0.5",
              "active:translate-y-0 active:shadow-sm",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
              "transition-all duration-200 ease-out",
            )}
            title="Delete provider"
            aria-label="Delete provider"
          >
            <Trash2 className="h-4 w-4 text-red-600 group-hover/delete:text-red-700 transition-colors duration-200" />
          </button>
        </div>
      ),
    },
  ]

  return {
    providers,
    columns,
    isLoading,
    error,
    totalRecords: totalCount,
    currentPage: page,
    pageSize,
    onPageChange: setPage,
    onPageSizeChange: setPageSize,
    searchQuery: inputValue,
    onSearchChange,
    onClearFilters,
    // Create / edit modal
    isFormModalOpen,
    editingProvider,
    form,
    formErrors,
    updateFormField,
    openCreateModal,
    closeFormModal,
    handleSave,
    isSaving,
    specialtyOptions,
    isLoadingSpecialties,
    deleteModal: (
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setProviderToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Provider"
        message="Are you sure you want to delete this provider? This action cannot be undone."
        itemName={providerToDelete ? `${providerToDelete.firstName} ${providerToDelete.lastName}` : undefined}
        isDeleting={isDeleting}
      />
    ),
  }
}

export type ProvidersOnFileTableState = ReturnType<typeof useProvidersOnFileTable>
