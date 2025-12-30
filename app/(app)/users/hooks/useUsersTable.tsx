
import {useEffect, useMemo, useState} from "react"
import { useUsers } from "@/lib/modules/users/hooks/use-users"
import { usePermission } from "@/lib/hooks/use-permission"
import { PermissionModule } from "@/lib/utils/permissions-new"
import { CustomTableColumn } from "@/components/custom/CustomTable"
import { MemberUserListItem} from "@/lib/types/user.types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Edit2 } from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import {useRoles} from "@/lib/modules/roles/hooks/use-roles";
import {useDebouncedState} from "@/lib/hooks/use-debounced-state";
import {buildFilters} from "@/lib/utils/query-filters";
import {FilterOperator} from "@/lib/models/filterOperator";

type StatusFilter = "all" | "active" | "inactive"

interface UseUsersTableReturn {
  data: MemberUserListItem[]
  columns: CustomTableColumn<MemberUserListItem>[]
  isLoading: boolean
  error: Error | null
  
  filters: {
    searchQuery: string
    setSearchQuery: (value: string) => void
    statusFilter: StatusFilter
    setStatusFilter: (value: StatusFilter) => void
    roleFilter: string
    setRoleFilter: (value: string) => void,
    inputValue: string
    setInputValue: (value: string) => void
  }
  
  uniqueRoles: string[]
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

export function useUsersTable(): UseUsersTableReturn {
  const router = useRouter()
  
  const { users, isLoading, error, refetch } = useUsers()
  const { roles } = useRoles()
  const { view, create, edit, remove } = usePermission()
  const permissions = useMemo(
    () => ({
      canView: view(PermissionModule.USERS_PROVIDERS),
      canCreate: create(PermissionModule.USERS_PROVIDERS),
      canEdit: edit(PermissionModule.USERS_PROVIDERS),
      canDelete: remove(PermissionModule.USERS_PROVIDERS),
    }),
    [view, create, edit, remove]
  )

  const [inputValue, setInputValue] = useState("")
  const [searchQuery, setSearchQuery] = useDebouncedState("", 500);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [roleFilter, setRoleFilter] = useState<string>("all")

  useEffect(() => {
    const filtersArray = buildFilters(
        [
          {
            field: "active",
            value: statusFilter === "all" ? null : statusFilter === "active",
            operator: FilterOperator.eq,
            type: "boolean",
          },
          {
            field: "role.name",
            value: roleFilter === "all" ? null : roleFilter,
            operator: FilterOperator.relatedEqual,
            type: "string",
          },
        ],
        {
          fields: ["firstName","lastName"],
          search: searchQuery,
        }
    );
    refetch(filtersArray)
  }, [searchQuery,statusFilter,roleFilter]);

  const uniqueRoles = useMemo(() => {
    const rolesList = new Set(roles.map((r) => r.name).filter(Boolean) as string[])
    return Array.from(rolesList)
  }, [users])

  const columns: CustomTableColumn<MemberUserListItem>[] = useMemo(() => {
    const cols: CustomTableColumn<MemberUserListItem>[] = [
      {
        key: "name",
        header: "Name",
        render: (user) => (
          <span className="font-medium">
            {user.fullName}
          </span>
        ),
      },
      {
        key: "roleName",
        header: "Role",
        render: (user) =>
          user.roleName ? (
            <Badge variant="outline" className="font-normal">
              {user.roleName}
            </Badge>
          ) : (
            <span className="text-gray-400 text-sm">No role</span>
          ),
      },
      
      {
        key: "hiringDate",
        header: "Hiring Date",
        render: (user) => (
          <span className="text-gray-600">
            {user.hiringDate ? format(new Date(user.hiringDate), "MMM dd, yyyy") : "-"}
          </span>
        ),
      },
      
      {
        key: "status",
        header: "Status",
        render: (user) => (
          <Badge
            variant={user.isActive ? "default" : "secondary"}
            className={
              user.isActive
                ? "bg-green-100 text-green-800 hover:bg-green-200"
                : ""
            }
          >
            {user.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
    ]
    
    if (permissions.canView || permissions.canEdit) {
      cols.push({
        key: "actions",
        header: "Actions",
        align: "right",
        render: (user) => (
          <div className="flex items-center justify-end gap-2">
            {permissions.canView && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="View user"
                onClick={() => {
                  console.log("View user:", user.id)
                }}
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}

            {permissions.canEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="Edit user"
                onClick={() => router.push(`/users/${user.id}/edit`)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ),
      })
    }
    
    return cols
  }, [permissions])

  const handleSearchChange = (value: string) => {
    setInputValue(value)
    setSearchQuery(value)
  }
  
  const clearFilters = () => {
    setSearchQuery("")
    setInputValue("")
    setStatusFilter("all")
    setRoleFilter("all")
  }

  return {
    data: users,
    columns,
    isLoading,
    error,
    filters: {
      searchQuery,
      setSearchQuery: handleSearchChange,
      statusFilter,
      setStatusFilter,
      roleFilter,
      setRoleFilter,
      inputValue,
      setInputValue
    },
    uniqueRoles,
    totalCount: users.length,
    filteredCount: users.length,
    clearFilters,
    refetch,
    permissions,
  }
}
