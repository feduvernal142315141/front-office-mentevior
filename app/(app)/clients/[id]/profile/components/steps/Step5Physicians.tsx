"use client"

import { useEffect, useMemo, useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Check, Stethoscope, Trash2, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/custom/Button"
import { CustomModal } from "@/components/custom/CustomModal"
import { CustomTable, type CustomTableColumn } from "@/components/custom/CustomTable"
import { DeleteConfirmModal } from "@/components/custom/DeleteConfirmModal"
import { SearchInput } from "@/components/custom/SearchInput"
import { Tabs } from "@/components/custom/Tabs"
import { PhysicianFormFields } from "@/app/(app)/my-company/physicians/components/PhysicianFormFields"
import { physicianFormSchema, getPhysicianFormDefaults, type PhysicianFormData } from "@/lib/schemas/physician-form.schema"
import { useClientPhysicians } from "@/lib/modules/client-physicians/hooks/use-client-physicians"
import { useAssignClientPhysician } from "@/lib/modules/client-physicians/hooks/use-assign-client-physician"
import { useRemoveClientPhysician } from "@/lib/modules/client-physicians/hooks/use-remove-client-physician"
import { useCreateManualClientPhysician } from "@/lib/modules/client-physicians/hooks/use-create-manual-client-physician"
import { usePhysicians } from "@/lib/modules/physicians/hooks/use-physicians"
import { useClients } from "@/lib/modules/clients/hooks/use-clients"
import { usePhysicianTypes } from "@/lib/modules/physicians/hooks/use-physician-types"
import { usePhysicianSpecialties } from "@/lib/modules/physicians/hooks/use-physician-specialties"
import { useCountries } from "@/lib/modules/addresses/hooks/use-countries"
import { useStates } from "@/lib/modules/addresses/hooks/use-states"
import type { ClientPhysician } from "@/lib/types/client-physician.types"
import type { Physician } from "@/lib/types/physician.types"
import type { ClientListItem } from "@/lib/types/client.types"
import type { StepComponentProps } from "@/lib/types/wizard.types"
import { cn } from "@/lib/utils"

export function Step5Physicians({
  clientId,
  isCreateMode = false,
  onSaveSuccess,
  onProgressUpdate,
  registerSubmit,
  registerValidation,
  onStepStatusChange,
}: StepComponentProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [deletingPhysician, setDeletingPhysician] = useState<ClientPhysician | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const resolvedClientId = useMemo(() => {
    if (!isCreateMode && clientId !== "new") {
      return clientId
    }

    if (typeof window === "undefined") {
      return null
    }

    const segments = window.location.pathname.split("/")
    const clientsIndex = segments.findIndex((segment) => segment === "clients")
    const possibleClientId = clientsIndex >= 0 ? segments[clientsIndex + 1] : null

    if (!possibleClientId || possibleClientId === "new") {
      return null
    }

    return possibleClientId
  }, [clientId, isCreateMode])

  const { physicians, isLoading, error, refetch } = useClientPhysicians(resolvedClientId)
  const { assignMany, isLoading: isAssigning } = useAssignClientPhysician()
  const { remove, isLoading: isRemoving } = useRemoveClientPhysician()
  const { createManual, isLoading: isCreatingManual } = useCreateManualClientPhysician()

  const totalCount = physicians.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const paginatedPhysicians = useMemo(() => {
    const start = (page - 1) * pageSize
    return physicians.slice(start, start + pageSize)
  }, [physicians, page, pageSize])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  useEffect(() => {
    registerValidation(true)
  }, [registerValidation])

  useEffect(() => {
    registerSubmit(async () => {
      onSaveSuccess({ physiciansCount: physicians.length })
    })
  }, [physicians.length, onSaveSuccess, registerSubmit])

  useEffect(() => {
    onStepStatusChange?.("physicians", physicians.length > 0 ? "COMPLETE" : "PENDING")
  }, [physicians.length, onStepStatusChange])

  const handleOpenModal = () => {
    setIsAddModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsAddModalOpen(false)
  }

  const handleConfirmRemove = async () => {
    if (!deletingPhysician) return

    const progress = await remove(deletingPhysician.id)
    if (progress === null) return

    onProgressUpdate?.(progress)
    setIsDeleteModalOpen(false)
    setDeletingPhysician(null)
    await refetch()
  }

  const columns: CustomTableColumn<ClientPhysician>[] = [
    {
      key: "fullName",
      header: "Name",
      render: (physician) => (
        <span className="block min-w-0 truncate whitespace-nowrap font-medium" title={physician.fullName}>
          {physician.fullName || "-"}
        </span>
      ),
    },
    {
      key: "specialty",
      header: "Specialty",
      render: (physician) =>
        physician.specialtyName || physician.specialty ? (
          <span className="text-sm text-slate-700">{physician.specialtyName || physician.specialty}</span>
        ) : (
          <span className="text-slate-400 text-sm">—</span>
        ),
    },
    {
      key: "type",
      header: "Type",
      render: (physician) =>
        physician.typeName || physician.type ? (
          <Badge variant="outline" className="font-normal">
            {physician.typeName || physician.type}
          </Badge>
        ) : (
          <span className="text-slate-400 text-sm">—</span>
        ),
    },
    {
      key: "npi",
      header: "NPI",
      render: (physician) => (
        <span className="text-sm font-mono text-slate-600">{physician.npi || "—"}</span>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (physician) => (
        <span className="text-sm text-slate-600 whitespace-nowrap">{physician.phone || "—"}</span>
      ),
    },
    {
      key: "active",
      header: "Status",
      align: "center",
      className: "w-[120px] whitespace-nowrap",
      render: (physician) =>
        physician.active ? (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
            Active
          </Badge>
        ) : (
          <Badge className="bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100">
            Inactive
          </Badge>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      className: "w-[90px] whitespace-nowrap",
      render: (physician) => (
        <div className="flex justify-end">
          <button
            onClick={() => {
              setDeletingPhysician(physician)
              setIsDeleteModalOpen(true)
            }}
            className={cn(
              "group/delete relative h-9 w-9",
              "flex items-center justify-center rounded-xl",
              "bg-gradient-to-b from-red-50 to-red-100/80",
              "border border-red-200/60 shadow-sm shadow-red-900/5",
              "hover:from-red-100 hover:to-red-200/90",
              "hover:border-red-300/80 hover:shadow-md hover:shadow-red-900/10",
              "hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
              "transition-all duration-200 ease-out",
              "focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:ring-offset-2"
            )}
            title="Remove physician"
            aria-label="Remove physician"
          >
            <Trash2 className="w-4 h-4 text-red-600 group-hover/delete:text-red-700 transition-colors duration-200" />
          </button>
        </div>
      ),
    },
  ]

  if (!resolvedClientId) {
    return (
      <div className="w-full px-6 py-8 sm:px-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <p className="text-amber-700 font-medium">
            Please save the client first before managing physicians.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-6 py-8 sm:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Physicians</h2>
          <p className="text-slate-600 mt-1">Physicians assigned to this client</p>
        </div>

        <Button type="button" onClick={handleOpenModal}>
          Add physician
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
        </div>
      )}

      <CustomTable
        columns={columns}
        data={paginatedPhysicians}
        isLoading={isLoading}
        hideEmptyIcon
        emptyContent={
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <div className="relative mb-1">
              <div className="absolute inset-0 rounded-full bg-[#037ECC]/10 blur-2xl" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10">
                <Stethoscope className="h-10 w-10 text-[#037ECC]/60" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-700">No physicians assigned</p>
            <p className="max-w-md text-center text-sm text-slate-500">
              Add physicians from your agency, other clients, or create one manually.
            </p>
          </div>
        }
        getRowKey={(physician) => physician.id}
        pagination={{
          page,
          pageSize,
          total: totalCount,
          onPageChange: setPage,
          onPageSizeChange: (newPageSize) => {
            setPageSize(newPageSize)
            setPage(1)
          },
          pageSizeOptions: [10, 25, 50],
        }}
      />

      <CustomModal
        open={isAddModalOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseModal()
        }}
        title="Add physician"
        description="Select physicians to assign or add one manually"
        maxWidthClassName="sm:max-w-[860px]"
      >
        <div className="pb-2">
          <Tabs
            items={[
              {
                id: "agency",
                label: "Agency",
                content: (
                  <AgencyTab
                    resolvedClientId={resolvedClientId}
                    assignedPhysicianIds={new Set(physicians.map((p) => p.physicianId))}
                    assignMany={assignMany}
                    isAssigning={isAssigning}
                    onClose={handleCloseModal}
                    onAssigned={() => void refetch()}
                  />
                ),
              },
              {
                id: "other-clients",
                label: "Other Clients",
                content: (
                  <OtherClientsTab
                    resolvedClientId={resolvedClientId}
                    assignedPhysicianIds={new Set(physicians.map((p) => p.physicianId))}
                    assignMany={assignMany}
                    isAssigning={isAssigning}
                    onClose={handleCloseModal}
                    onAssigned={() => void refetch()}
                  />
                ),
              },
              {
                id: "manual",
                label: "Manual",
                content: (
                  <ManualTab
                    resolvedClientId={resolvedClientId}
                    createManual={createManual}
                    isCreatingManual={isCreatingManual}
                    onClose={handleCloseModal}
                    onCreated={() => void refetch()}
                  />
                ),
              },
            ]}
          />
        </div>
      </CustomModal>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setDeletingPhysician(null)
        }}
        onConfirm={() => void handleConfirmRemove()}
        title="Remove physician"
        message="Are you sure you want to remove this physician from the client?"
        itemName={deletingPhysician?.fullName}
        isDeleting={isRemoving}
      />
    </div>
  )
}

interface AgencyTabProps {
  resolvedClientId: string
  assignedPhysicianIds: Set<string>
  assignMany: (clientId: string, physicianIds: string[]) => Promise<boolean>
  isAssigning: boolean
  onClose: () => void
  onAssigned: () => void
}

function AgencyTab({
  resolvedClientId,
  assignedPhysicianIds,
  assignMany,
  isAssigning,
  onClose,
  onAssigned,
}: AgencyTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { physicians, isLoading } = usePhysicians({ page: 0, pageSize: 200 })

  const availablePhysicians = useMemo(
    () => physicians.filter((p) => !assignedPhysicianIds.has(p.id)),
    [physicians, assignedPhysicianIds]
  )

  const filteredPhysicians = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return availablePhysicians
    return availablePhysicians.filter(
      (p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        (p.specialty || "").toLowerCase().includes(q) ||
        (p.npi || "").includes(q)
    )
  }, [availablePhysicians, searchQuery])

  const allSelected = filteredPhysicians.length > 0 && filteredPhysicians.every((p) => selectedIds.has(p.id))
  const someSelected = filteredPhysicians.some((p) => selectedIds.has(p.id))
  const selectedCount = selectedIds.size

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filteredPhysicians.forEach((p) => next.delete(p.id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filteredPhysicians.forEach((p) => next.add(p.id))
        return next
      })
    }
  }

  const handleAssign = async () => {
    if (!selectedCount) return
    const ok = await assignMany(resolvedClientId, Array.from(selectedIds))
    if (!ok) return
    setSelectedIds(new Set())
    onClose()
    onAssigned()
  }

  return (
    <div className="flex flex-col gap-4">
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search by name, specialty or NPI"
        onClear={() => setSearchQuery("")}
      />

      {filteredPhysicians.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5">
          <button
            type="button"
            onClick={handleToggleAll}
            className="flex items-center gap-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            <div
              className={cn(
                "h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all duration-150",
                allSelected
                  ? "bg-[#037ECC] border-[#037ECC]"
                  : someSelected
                    ? "bg-[#037ECC]/20 border-[#037ECC]"
                    : "bg-white border-slate-300"
              )}
            >
              {allSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
              {someSelected && !allSelected && (
                <span className="h-0.5 w-2.5 rounded-full bg-[#037ECC]" />
              )}
            </div>
            {allSelected ? "Deselect all" : "Select all"}
          </button>

          {selectedCount > 0 && (
            <span className="text-xs font-semibold text-[#037ECC] bg-[#037ECC]/10 border border-[#037ECC]/20 rounded-full px-2.5 py-0.5">
              {selectedCount} selected
            </span>
          )}
        </div>
      )}

      <div className="overflow-y-auto max-h-[320px] rounded-xl border border-slate-200">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-sm text-slate-500">
            Loading physicians...
          </div>
        ) : filteredPhysicians.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Stethoscope className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-500">No physicians available to assign</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredPhysicians.map((physician) => {
              const isSelected = selectedIds.has(physician.id)
              return (
                <PhysicianSelectItem
                  key={physician.id}
                  physician={physician}
                  isSelected={isSelected}
                  onToggle={() => handleToggle(physician.id)}
                />
              )
            })}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isAssigning}>
          Cancel
        </Button>
        <Button
          type="button"
          loading={isAssigning}
          disabled={isAssigning || selectedCount === 0}
          onClick={() => void handleAssign()}
        >
          {selectedCount > 0
            ? `Assign ${selectedCount} physician${selectedCount > 1 ? "s" : ""}`
            : "Assign"}
        </Button>
      </div>
    </div>
  )
}

interface OtherClientsTabProps {
  resolvedClientId: string
  assignedPhysicianIds: Set<string>
  assignMany: (clientId: string, physicianIds: string[]) => Promise<boolean>
  isAssigning: boolean
  onClose: () => void
  onAssigned: () => void
}

function OtherClientsTab({
  resolvedClientId,
  assignedPhysicianIds,
  assignMany,
  isAssigning,
  onClose,
  onAssigned,
}: OtherClientsTabProps) {
  const [selectedClient, setSelectedClient] = useState<ClientListItem | null>(null)
  const [clientSearch, setClientSearch] = useState("")
  const [physicianSearch, setPhysicianSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { clients, isLoading: isLoadingClients } = useClients({ pageSize: 200 })
  const { physicians: sourcePhysicians, isLoading: isLoadingPhysicians } = useClientPhysicians(
    selectedClient ? selectedClient.id : null
  )

  const otherClients = useMemo(
    () => clients.filter((c) => c.id !== resolvedClientId),
    [clients, resolvedClientId]
  )

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase()
    if (!q) return otherClients
    return otherClients.filter((c) => c.fullName.toLowerCase().includes(q))
  }, [otherClients, clientSearch])

  const availablePhysicians = useMemo(
    () => sourcePhysicians.filter((p) => !assignedPhysicianIds.has(p.physicianId)),
    [sourcePhysicians, assignedPhysicianIds]
  )

  const filteredPhysicians = useMemo(() => {
    const q = physicianSearch.trim().toLowerCase()
    if (!q) return availablePhysicians
    return availablePhysicians.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        (p.specialty || "").toLowerCase().includes(q) ||
        (p.npi || "").includes(q)
    )
  }, [availablePhysicians, physicianSearch])

  const allSelected = filteredPhysicians.length > 0 && filteredPhysicians.every((p) => selectedIds.has(p.physicianId))
  const someSelected = filteredPhysicians.some((p) => selectedIds.has(p.physicianId))
  const selectedCount = selectedIds.size

  const handleToggle = (physicianId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(physicianId)) {
        next.delete(physicianId)
      } else {
        next.add(physicianId)
      }
      return next
    })
  }

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filteredPhysicians.forEach((p) => next.delete(p.physicianId))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filteredPhysicians.forEach((p) => next.add(p.physicianId))
        return next
      })
    }
  }

  const handleAssign = async () => {
    if (!selectedCount) return
    const ok = await assignMany(resolvedClientId, Array.from(selectedIds))
    if (!ok) return
    setSelectedIds(new Set())
    onClose()
    onAssigned()
  }

  if (!selectedClient) {
    return (
      <div className="flex flex-col gap-4">
        <SearchInput
          value={clientSearch}
          onChange={setClientSearch}
          placeholder="Search clients by name"
          onClear={() => setClientSearch("")}
        />

        <div className="overflow-y-auto max-h-[340px] rounded-xl border border-slate-200">
          {isLoadingClients ? (
            <div className="flex items-center justify-center py-10 text-sm text-slate-500">
              Loading clients...
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Users className="h-8 w-8 text-slate-300" />
              <p className="text-sm text-slate-500">No other clients found</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filteredClients.map((client) => (
                <li key={client.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClient(client)
                      setPhysicianSearch("")
                      setSelectedIds(new Set())
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors duration-150"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{client.fullName}</p>
                      {client.chartId && (
                        <p className="text-xs text-slate-500 mt-0.5">Chart: {client.chartId}</p>
                      )}
                    </div>
                    <span className="text-xs text-[#037ECC] font-medium">Select →</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setSelectedClient(null)
            setSelectedIds(new Set())
          }}
          className="flex items-center gap-1.5 text-sm text-[#037ECC] hover:text-[#025fa0] font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <span className="text-sm text-slate-400">/</span>
        <span className="text-sm font-semibold text-slate-700 truncate">{selectedClient.fullName}</span>
      </div>

      <SearchInput
        value={physicianSearch}
        onChange={setPhysicianSearch}
        placeholder="Search by name, specialty or NPI"
        onClear={() => setPhysicianSearch("")}
      />

      {filteredPhysicians.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5">
          <button
            type="button"
            onClick={handleToggleAll}
            className="flex items-center gap-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            <div
              className={cn(
                "h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all duration-150",
                allSelected
                  ? "bg-[#037ECC] border-[#037ECC]"
                  : someSelected
                    ? "bg-[#037ECC]/20 border-[#037ECC]"
                    : "bg-white border-slate-300"
              )}
            >
              {allSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
              {someSelected && !allSelected && (
                <span className="h-0.5 w-2.5 rounded-full bg-[#037ECC]" />
              )}
            </div>
            {allSelected ? "Deselect all" : "Select all"}
          </button>

          {selectedCount > 0 && (
            <span className="text-xs font-semibold text-[#037ECC] bg-[#037ECC]/10 border border-[#037ECC]/20 rounded-full px-2.5 py-0.5">
              {selectedCount} selected
            </span>
          )}
        </div>
      )}

      <div className="overflow-y-auto max-h-[280px] rounded-xl border border-slate-200">
        {isLoadingPhysicians ? (
          <div className="flex items-center justify-center py-10 text-sm text-slate-500">
            Loading physicians...
          </div>
        ) : filteredPhysicians.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Stethoscope className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-500">No physicians available to assign</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredPhysicians.map((physician) => {
              const isSelected = selectedIds.has(physician.physicianId)
              return (
                <ClientPhysicianSelectItem
                  key={physician.id}
                  physician={physician}
                  isSelected={isSelected}
                  onToggle={() => handleToggle(physician.physicianId)}
                />
              )
            })}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isAssigning}>
          Cancel
        </Button>
        <Button
          type="button"
          loading={isAssigning}
          disabled={isAssigning || selectedCount === 0}
          onClick={() => void handleAssign()}
        >
          {selectedCount > 0
            ? `Assign ${selectedCount} physician${selectedCount > 1 ? "s" : ""}`
            : "Assign"}
        </Button>
      </div>
    </div>
  )
}

interface ManualTabProps {
  resolvedClientId: string
  createManual: (data: import("@/lib/types/client-physician.types").CreateManualClientPhysicianDto) => Promise<string | null>
  isCreatingManual: boolean
  onClose: () => void
  onCreated: () => void
}

function ManualTab({
  resolvedClientId,
  createManual,
  isCreatingManual,
  onClose,
  onCreated,
}: ManualTabProps) {
  const { countries, isLoading: isLoadingCountries } = useCountries()
  const { physicianTypes, isLoading: isLoadingPhysicianTypes } = usePhysicianTypes()
  const { physicianSpecialties, isLoading: isLoadingPhysicianSpecialties } = usePhysicianSpecialties()

  const usaCountry = useMemo(
    () => countries.find((c) => c.name === "United States" || c.name === "USA"),
    [countries]
  )
  const { states, isLoading: isLoadingStates } = useStates(usaCountry?.id ?? null)

  const form = useForm<PhysicianFormData>({
    resolver: zodResolver(physicianFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: getPhysicianFormDefaults(),
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    const ok = await createManual({
      clientId: resolvedClientId,
      firstName: values.firstName,
      lastName: values.lastName,
      specialty: values.specialty,
      npi: values.npi,
      mpi: values.mpi,
      phone: values.phone,
      fax: values.fax || undefined,
      email: values.email || undefined,
      type: values.type,
      active: values.active,
      companyName: values.companyName || undefined,
      address: values.address || undefined,
      city: values.city || undefined,
      state: values.state || undefined,
      zipCode: values.zipCode || undefined,
      country: values.country || undefined,
      countryId: usaCountry?.id || undefined,
      stateId: values.stateId || undefined,
    })

    if (!ok) return

    form.reset(getPhysicianFormDefaults())
    onClose()
    onCreated()
  })

  return (
    <FormProvider {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void handleSubmit()
        }}
        className="flex flex-col gap-4"
      >
        {Object.keys(form.formState.errors).length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {Object.entries(form.formState.errors).map(([key, err]) => (
              <p key={key}>{String(err?.message ?? key)}</p>
            ))}
          </div>
        )}

        <div className="overflow-y-auto max-h-[420px] pr-1">
          <PhysicianFormFields
            isEditing={false}
            countries={countries.map((c) => ({ id: c.id, name: c.name }))}
            states={states.map((s) => ({ id: s.id, name: s.name }))}
            physicianTypes={physicianTypes}
            physicianSpecialties={physicianSpecialties}
            isLoadingCountries={isLoadingCountries}
            isLoadingStates={isLoadingStates}
            isLoadingPhysicianTypes={isLoadingPhysicianTypes}
            isLoadingPhysicianSpecialties={isLoadingPhysicianSpecialties}
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isCreatingManual}>
            Cancel
          </Button>
          <Button type="submit" loading={isCreatingManual} disabled={isCreatingManual}>
            Save physician
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}

function PhysicianSelectItem({
  physician,
  isSelected,
  onToggle,
}: {
  physician: Physician
  isSelected: boolean
  onToggle: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 text-left",
          "transition-colors duration-150",
          isSelected ? "bg-[#037ECC]/5 hover:bg-[#037ECC]/10" : "hover:bg-slate-50"
        )}
      >
        <div
          className={cn(
            "flex-shrink-0 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all duration-150",
            isSelected ? "bg-[#037ECC] border-[#037ECC]" : "bg-white border-slate-300"
          )}
        >
          {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium truncate", isSelected ? "text-[#037ECC]" : "text-slate-800")}>
            {physician.firstName} {physician.lastName}
          </p>
          {(physician.specialty || physician.npi) && (
            <p className="text-xs text-slate-500 mt-0.5">
              {[physician.specialty, physician.npi ? `NPI: ${physician.npi}` : null].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        {physician.active ? (
          <Badge className="flex-shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs">
            Active
          </Badge>
        ) : (
          <Badge className="flex-shrink-0 bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100 text-xs">
            Inactive
          </Badge>
        )}
      </button>
    </li>
  )
}

function ClientPhysicianSelectItem({
  physician,
  isSelected,
  onToggle,
}: {
  physician: ClientPhysician
  isSelected: boolean
  onToggle: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 text-left",
          "transition-colors duration-150",
          isSelected ? "bg-[#037ECC]/5 hover:bg-[#037ECC]/10" : "hover:bg-slate-50"
        )}
      >
        <div
          className={cn(
            "flex-shrink-0 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all duration-150",
            isSelected ? "bg-[#037ECC] border-[#037ECC]" : "bg-white border-slate-300"
          )}
        >
          {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium truncate", isSelected ? "text-[#037ECC]" : "text-slate-800")}>
            {physician.fullName}
          </p>
          {(physician.specialty || physician.npi) && (
            <p className="text-xs text-slate-500 mt-0.5">
              {[physician.specialty, physician.npi ? `NPI: ${physician.npi}` : null].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        {physician.active ? (
          <Badge className="flex-shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs">
            Active
          </Badge>
        ) : (
          <Badge className="flex-shrink-0 bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100 text-xs">
            Inactive
          </Badge>
        )}
      </button>
    </li>
  )
}
