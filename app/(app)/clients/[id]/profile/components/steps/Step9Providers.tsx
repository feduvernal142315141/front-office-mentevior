"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Trash2, UserCog, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/custom/Button"
import { CustomModal } from "@/components/custom/CustomModal"
import { CustomTable, type CustomTableColumn } from "@/components/custom/CustomTable"
import { DeleteConfirmModal } from "@/components/custom/DeleteConfirmModal"
import { SearchInput } from "@/components/custom/SearchInput"
import { useProvidersByClient } from "@/lib/modules/providers/hooks/use-providers-by-client"
import { useAssignProvider } from "@/lib/modules/providers/hooks/use-assign-provider"
import { useRemoveProvider } from "@/lib/modules/providers/hooks/use-remove-provider"
import { useUsers } from "@/lib/modules/users/hooks/use-users"
import type { ClientProvider } from "@/lib/types/provider.types"
import type { MemberUserListItem } from "@/lib/types/user.types"
import type { StepComponentProps } from "@/lib/types/wizard.types"
import { cn } from "@/lib/utils"

export function Step9Providers({
  clientId,
  isCreateMode = false,
  onSaveSuccess,
  registerSubmit,
  registerValidation,
}: StepComponentProps) {
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [deletingProvider, setDeletingProvider] = useState<ClientProvider | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [userPage, setUserPage] = useState(1)
  const [userPageSize] = useState(10)

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

  const { providers, isLoading, error, refetch } = useProvidersByClient(resolvedClientId)
  const { assignMany, isLoading: isAssigning } = useAssignProvider()
  const { remove, isLoading: isRemoving } = useRemoveProvider()

  const { users, isLoading: isLoadingUsers, totalCount: usersTotalCount, refetch: refetchUsers } = useUsers({
    page: userPage - 1,
    pageSize: userPageSize,
  })

  const assignedUserIds = useMemo(() => new Set(providers.map((p) => p.userId)), [providers])

  const availableUsers = useMemo(
    () => users.filter((u) => !u.terminated && !assignedUserIds.has(u.id)),
    [users, assignedUserIds]
  )

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return availableUsers
    return availableUsers.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.roleName.toLowerCase().includes(q)
    )
  }, [availableUsers, searchQuery])

  const allFilteredSelected = filteredUsers.length > 0 && filteredUsers.every((u) => selectedUserIds.has(u.id))
  const someFilteredSelected = filteredUsers.some((u) => selectedUserIds.has(u.id))

  const selectedCount = selectedUserIds.size

  const totalCount = providers.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const paginatedProviders = useMemo(() => {
    const start = (page - 1) * pageSize
    return providers.slice(start, start + pageSize)
  }, [providers, page, pageSize])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  useEffect(() => {
    registerValidation(true)
  }, [registerValidation])

  useEffect(() => {
    registerSubmit(async () => {
      onSaveSuccess({ providersCount: providers.length })
    })
  }, [providers.length, onSaveSuccess, registerSubmit])

  const handleOpenModal = () => {
    setSearchQuery("")
    setSelectedUserIds(new Set())
    setUserPage(1)
    void refetchUsers({ page: 0, pageSize: userPageSize })
    setIsAssignModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsAssignModalOpen(false)
    setSearchQuery("")
    setSelectedUserIds(new Set())
  }

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }

  const handleToggleAll = () => {
    if (allFilteredSelected) {
      setSelectedUserIds((prev) => {
        const next = new Set(prev)
        filteredUsers.forEach((u) => next.delete(u.id))
        return next
      })
    } else {
      setSelectedUserIds((prev) => {
        const next = new Set(prev)
        filteredUsers.forEach((u) => next.add(u.id))
        return next
      })
    }
  }

  const handleAssignSelected = async () => {
    if (!resolvedClientId || !selectedCount) return

    const ok = await assignMany(resolvedClientId, Array.from(selectedUserIds))
    if (!ok) return

    handleCloseModal()
    await refetch()
  }

  const handleConfirmRemove = async () => {
    if (!deletingProvider) return

    const ok = await remove(deletingProvider.id)
    if (!ok) return

    setIsDeleteModalOpen(false)
    setDeletingProvider(null)
    await refetch()
  }

  const getStatusBadge = (active: boolean, terminated: boolean) => {
    if (terminated) {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
          Terminated
        </Badge>
      )
    }
    return active ? (
      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
        Active
      </Badge>
    ) : (
      <Badge className="bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100">
        Inactive
      </Badge>
    )
  }

  const providerColumns: CustomTableColumn<ClientProvider>[] = [
    {
      key: "fullName",
      header: "Specialist Assigned",
      render: (provider) => (
        <span className="block min-w-0 truncate whitespace-nowrap font-medium" title={provider.fullName}>
          {provider.fullName || "-"}
        </span>
      ),
    },
    {
      key: "roleName",
      header: "Role",
      render: (provider) =>
        provider.roleName ? (
          <Badge variant="outline" className="font-normal">
            {provider.roleName}
          </Badge>
        ) : (
          <span className="text-slate-400 text-sm">No role</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      className: "w-[130px] whitespace-nowrap",
      render: (provider) => getStatusBadge(provider.active, provider.terminated),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      className: "w-[90px] whitespace-nowrap",
      render: (provider) => (
        <div className="flex justify-end">
          <button
            onClick={() => {
              setDeletingProvider(provider)
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
            title="Remove provider"
            aria-label="Remove provider"
          >
            <Trash2 className="w-4 h-4 text-red-600 group-hover/delete:text-red-700 transition-colors duration-200" />
          </button>
        </div>
      ),
    },
  ]

  if (!resolvedClientId) {
    return (
      <div className="max-w-5xl mx-auto p-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <p className="text-amber-700 font-medium">
            Please save the client first before managing providers.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Providers</h2>
          <p className="text-slate-600 mt-1">Specialists and users assigned to this client</p>
        </div>

        <Button type="button" onClick={handleOpenModal}>
          Add provider
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
        </div>
      )}

      <CustomTable
        columns={providerColumns}
        data={paginatedProviders}
        isLoading={isLoading}
        hideEmptyIcon
        emptyContent={
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <div className="relative mb-1">
              <div className="absolute inset-0 rounded-full bg-[#037ECC]/10 blur-2xl" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10">
                <UserCog className="h-10 w-10 text-[#037ECC]/60" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-700">No providers assigned</p>
            <p className="max-w-md text-center text-sm text-slate-500">
              Assign specialists or users to give them access to this client profile.
            </p>
          </div>
        }
        getRowKey={(provider) => provider.id}
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
        open={isAssignModalOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseModal()
        }}
        title="Add providers"
        description="Select one or more users to assign to this client"
        maxWidthClassName="sm:max-w-[800px]"
      >
        <div className="px-6 pb-6 pt-2 flex flex-col gap-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name or role"
            onClear={() => setSearchQuery("")}
          />

          {filteredUsers.length > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5">
              <button
                type="button"
                onClick={handleToggleAll}
                className="flex items-center gap-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                <div
                  className={cn(
                    "h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all duration-150",
                    allFilteredSelected
                      ? "bg-[#037ECC] border-[#037ECC]"
                      : someFilteredSelected
                        ? "bg-[#037ECC]/20 border-[#037ECC]"
                        : "bg-white border-slate-300"
                  )}
                >
                  {allFilteredSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  {someFilteredSelected && !allFilteredSelected && (
                    <span className="h-0.5 w-2.5 rounded-full bg-[#037ECC]" />
                  )}
                </div>
                {allFilteredSelected ? "Deselect all" : "Select all"}
              </button>

              {selectedCount > 0 && (
                <span className="text-xs font-semibold text-[#037ECC] bg-[#037ECC]/10 border border-[#037ECC]/20 rounded-full px-2.5 py-0.5">
                  {selectedCount} selected
                </span>
              )}
            </div>
          )}

          <div className="overflow-y-auto max-h-[340px] rounded-xl border border-slate-200">
            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-10 text-sm text-slate-500">
                Loading users...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Users className="h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-500">No users available to assign</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const isSelected = selectedUserIds.has(user.id)
                  return (
                    <li key={user.id}>
                      <button
                        type="button"
                        onClick={() => handleToggleUser(user.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 text-left",
                          "transition-colors duration-150",
                          isSelected
                            ? "bg-[#037ECC]/5 hover:bg-[#037ECC]/10"
                            : "hover:bg-slate-50"
                        )}
                      >
                        <div
                          className={cn(
                            "flex-shrink-0 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all duration-150",
                            isSelected
                              ? "bg-[#037ECC] border-[#037ECC]"
                              : "bg-white border-slate-300"
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-medium truncate",
                            isSelected ? "text-[#037ECC]" : "text-slate-800"
                          )}>
                            {user.fullName}
                          </p>
                          {user.roleName && (
                            <p className="text-xs text-slate-500 mt-0.5">{user.roleName}</p>
                          )}
                        </div>

                        <StatusPill user={user} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {!searchQuery && (
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>
                Showing {filteredUsers.length} of {usersTotalCount} users
              </span>
              {usersTotalCount > userPageSize && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={userPage === 1}
                    onClick={() => {
                      const prev = userPage - 1
                      setUserPage(prev)
                      void refetchUsers({ page: prev - 1, pageSize: userPageSize })
                    }}
                    className="px-2 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
                  >
                    ‹
                  </button>
                  <span className="px-1">{userPage}</span>
                  <button
                    type="button"
                    disabled={userPage * userPageSize >= usersTotalCount}
                    onClick={() => {
                      const next = userPage + 1
                      setUserPage(next)
                      void refetchUsers({ page: next - 1, pageSize: userPageSize })
                    }}
                    className="px-2 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal} disabled={isAssigning}>
              Cancel
            </Button>
            <Button
              type="button"
              loading={isAssigning}
              disabled={isAssigning || selectedCount === 0}
              onClick={() => void handleAssignSelected()}
            >
              {selectedCount > 0
                ? `Assign ${selectedCount} provider${selectedCount > 1 ? "s" : ""}`
                : "Assign"}
            </Button>
          </div>
        </div>
      </CustomModal>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setDeletingProvider(null)
        }}
        onConfirm={() => void handleConfirmRemove()}
        title="Remove provider"
        message="Are you sure you want to remove this provider from the client?"
        itemName={deletingProvider?.fullName}
        isDeleting={isRemoving}
      />
    </div>
  )
}

function StatusPill({ user }: { user: MemberUserListItem }) {
  if (user.terminated) {
    return (
      <Badge className="flex-shrink-0 bg-red-100 text-red-800 border-red-200 hover:bg-red-100 text-xs">
        Terminated
      </Badge>
    )
  }
  return user.active ? (
    <Badge className="flex-shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs">
      Active
    </Badge>
  ) : (
    <Badge className="flex-shrink-0 bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100 text-xs">
      Inactive
    </Badge>
  )
}
