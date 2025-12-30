
import {useEffect, useMemo, useState} from "react"
import { useRoles } from "@/lib/modules/roles/hooks/use-roles"
import { usePermission } from "@/lib/hooks/use-permission"
import { PermissionModule } from "@/lib/utils/permissions-new"
import { CustomTableColumn } from "@/components/custom/CustomTable"
import { Role } from "@/lib/types/role.types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/custom/Button"
import { Edit2, Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import {useDebouncedState} from "@/lib/hooks/use-debounced-state";
import {buildFilters} from "@/lib/utils/query-filters";

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
}

export function useRolesTable(): UseRolesTableReturn {
  const router = useRouter()

  const { roles, isLoading, error, refetch } = useRoles()
  
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
  
  // Estado inmediato para el Input (se actualiza al instante)
  const [inputValue, setInputValue] = useState("")
  // Estado debounced para la búsqueda (se actualiza con delay)
  const [searchQuery, setSearchQuery] = useDebouncedState("", 500);

  // Cuando el usuario escribe, actualiza el inputValue inmediatamente
  // y el searchQuery con debounce
  const handleSearchChange = (value: string) => {
    setInputValue(value)
    setSearchQuery(value)
  }

  useEffect(() => {
    const filtersArray = buildFilters(
        [],
        {
          fields: ["name"],
          search: searchQuery,
        }
    );
    refetch(filtersArray)
  }, [searchQuery]);

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
        key: "permissions",
        header: "Permissions",
        render: (role) => {
          const permissionsCount = role.permissions.length
          return (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono">
                {permissionsCount}
              </Badge>
              <span className="text-sm text-gray-600">module(s)</span>
            </div>
          )
        },
      },
      
      {
        key: "status",
        header: "Status",
        render: (role) => (
          <Badge
            variant={role.isActive ? "default" : "secondary"}
            className={
              role.isActive
                ? "bg-green-100 text-green-800 hover:bg-green-200"
                : ""
            }
          >
            {role.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      
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

    if (permissions.canEdit) {
      cols.push({
        key: "actions",
        header: "Actions",
        align: "right",
        render: (role) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              title="Edit role"
              onClick={() => router.push(`/roles/${role.id}/edit`)}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          </div>
        ),
      })
    }
    
    return cols
  }, [permissions, router])
  
  const clearFilters = () => {
    setInputValue("")
    setSearchQuery("")
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
    totalCount: roles.length,
    filteredCount: roles.length,
    clearFilters,
    refetch,
    permissions,
  }
}
