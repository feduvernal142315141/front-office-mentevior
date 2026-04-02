
import { useMemo, useState } from "react"
import { useRoles } from "@/lib/modules/roles/hooks/use-roles"
import { useDeleteRole } from "@/lib/modules/roles/hooks/use-delete-role"
import { usePermission } from "@/lib/hooks/use-permission"
import { PermissionModule } from "@/lib/utils/permissions-new"
import { CustomTableColumn } from "@/components/custom/CustomTable"
import { DeleteConfirmModal } from "@/components/custom/DeleteConfirmModal"
import { Role } from "@/lib/types/role.types"
import { Badge } from "@/components/ui/badge"
import { Edit2, Shield, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useDebouncedState } from "@/lib/hooks/use-debounced-state"
import { buildFilters } from "@/lib/utils/query-filters"
import { cn } from "@/lib/utils"

interface UseRolesTableReturn {
  data: Role[]
  columns: CustomTableColumn<Role>[]
  isLoading: boolean
  error: Error | null
  
  filters: {
    searchQuery: string
    setSearchQuery: (value: string) => void
    inputValue: string
    setInputValue: (value: string) => void
  }
  
  pagination: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
    onPageSizeChange: (pageSize: number) => void
    pageSizeOptions: number[]
  }
  
  totalCount: number
  filteredCount: number
  
  clearFilters: () => void
  refetch: () => void
  
  permissions: {
    canView: boolean
    canCreate: boolean
    canEdit: boolean
    canDelete: boolean
  }

  deleteModal: React.ReactNode
}

export function useRolesTable(): UseRolesTableReturn {
  const router = useRouter()

  const [page, setPage] = useState(1) 
  const [pageSize, setPageSize] = useState(10)
  const [deletingRole, setDeletingRole] = useState<Role | null>(null)

  const { remove: removeRole, isLoading: isDeleting } = useDeleteRole()
  

  const [inputValue, setInputValue] = useState("")

  const [searchQuery, setSearchQuery] = useDebouncedState("", 500);

  const handleSearchChange = (value: string) => {
    setInputValue(value)
    setSearchQuery(value)
    setPage(1) 
  }

  const filtersArray = useMemo(() => {
    return buildFilters(
      [],
      {
        fields: ["name"],
        search: searchQuery,
      }
    );
  }, [searchQuery])

  const { roles, isLoading, error, totalCount, refetch } = useRoles({
    page: page - 1,
    pageSize,
    filters: filtersArray,
  })
  
  const { view, create, edit, remove } = usePermission()
  const permissions = useMemo(
    () => ({
      canView: view(PermissionModule.ROLE),
      canCreate: create(PermissionModule.ROLE),
      canEdit: edit(PermissionModule.ROLE),
      canDelete: remove(PermissionModule.ROLE),
    }),
    [view, create, edit, remove]
  )

  const columns: CustomTableColumn<Role>[] = useMemo(() => {
    const cols: CustomTableColumn<Role>[] = [
      {
        key: "name",
        header: "Role Name",
        render: (role) => (
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-400" />
            <span className="font-medium">{role.name}</span>
          </div>
        ),
      },
      
      {
        key: "modules",
        header: "Permissions",
        render: (role) => {
          return (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono">
                {role.modules}
              </Badge>
              <span className="text-sm text-gray-600">module(s)</span>
            </div>
          )
        },
      },      
      // {
      //   key: "status",
      //   header: "Status",
      //   render: (role) => (
      //     <Badge
      //       variant={role.isActive ? "default" : "secondary"}
      //       className={
      //         role.isActive
      //           ? "bg-green-100 text-green-800 hover:bg-green-200"
      //           : ""
      //       }
      //     >
      //       {role.isActive ? "Active" : "Inactive"}
      //     </Badge>
      //   ),
      // },      
      {
        key: "createdAt",
        header: "Created",
        render: (role) => (
          <span className="text-sm text-gray-600">
            {new Date(role.createdAt).toLocaleDateString()}
          </span>
        ),
      },
    ]

    if (permissions.canEdit || permissions.canDelete) {
      cols.push({
        key: "actions",
        header: "Actions",
        align: "right",
        render: (role) => (
          <div className="flex items-center justify-end gap-2">
            {permissions.canEdit && (
              <button
                onClick={() => router.push(`/my-company/roles/${role.id}/edit`)}
                className={cn(
                  "group/edit relative h-9 w-9",
                  "flex items-center justify-center rounded-xl",
                  "bg-gradient-to-b from-blue-50 to-blue-100/80",
                  "border border-blue-200/60 shadow-sm shadow-blue-900/5",
                  "hover:from-blue-100 hover:to-blue-200/90",
                  "hover:border-blue-300/80 hover:shadow-md hover:shadow-blue-900/10",
                  "hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
                  "transition-all duration-200 ease-out",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2"
                )}
                title="Edit role"
                aria-label="Edit role"
              >
                <Edit2 className="w-4 h-4 text-blue-600 group-hover/edit:text-blue-700 transition-colors duration-200" />
              </button>
            )}
            {permissions.canDelete && (
              <button
                onClick={() => setDeletingRole(role)}
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
                title="Delete role"
                aria-label="Delete role"
              >
                <Trash2 className="w-4 h-4 text-red-600 group-hover/delete:text-red-700 transition-colors duration-200" />
              </button>
            )}
          </div>
        ),
      })
    }
    
    return cols
  }, [permissions, router])
  
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

  return {
    data: roles,
    columns,
    isLoading,
    error,
    filters: {
      searchQuery,
      setSearchQuery: handleSearchChange,
      inputValue,
      setInputValue,
    },
    pagination: {
      page,
      pageSize,
      total: totalCount,
      onPageChange: handlePageChange,
      onPageSizeChange: handlePageSizeChange,
      pageSizeOptions: [10, 25, 50, 100],
    },
    totalCount,
    filteredCount: roles.length,
    clearFilters,
    refetch: () => refetch({ page: page - 1, pageSize, filters: filtersArray }),
    permissions,
    deleteModal: (
      <DeleteConfirmModal
        isOpen={!!deletingRole}
        onClose={() => setDeletingRole(null)}
        onConfirm={async () => {
          if (!deletingRole) return
          const ok = await removeRole(deletingRole.id)
          if (ok) {
            setDeletingRole(null)
            refetch({ page: page - 1, pageSize, filters: filtersArray })
          }
        }}
        title="Delete Role"
        message="Are you sure you want to delete this role? This action cannot be undone."
        itemName={deletingRole?.name}
        isDeleting={isDeleting}
      />
    ),
  }
}
