
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
              <button
                onClick={() => {
                  console.log("View user:", user.id)
                }}
                className="
                  group/view
                  relative
                  h-9 w-9
                  flex items-center justify-center
                  rounded-xl
                  
                  /* Background gradient */
                  bg-gradient-to-b from-gray-50 to-gray-100/80
                  
                  /* Border */
                  border border-gray-200/60
                  
                  /* Shadow */
                  shadow-sm
                  shadow-gray-900/5
                  
                  /* Hover */
                  hover:from-gray-100
                  hover:to-gray-200/90
                  hover:border-gray-300/80
                  hover:shadow-md
                  hover:shadow-gray-900/10
                  hover:-translate-y-0.5
                  
                  /* Active */
                  active:translate-y-0
                  active:shadow-sm
                  
                  /* Transitions */
                  transition-all
                  duration-200
                  ease-out
                  
                  /* Focus */
                  focus:outline-none
                  focus:ring-2
                  focus:ring-gray-500/30
                  focus:ring-offset-2
                "
                title="View user"
                aria-label="View user"
              >
                <Eye className="
                  w-4 h-4
                  text-gray-600
                  group-hover/view:text-gray-700
                  transition-colors
                  duration-200
                " />
              </button>
            )}

            {permissions.canEdit && (
              <button
                onClick={() => router.push(`/users/${user.id}/edit`)}
                className="
                  group/edit
                  relative
                  h-9 w-9
                  flex items-center justify-center
                  rounded-xl
                  
                  /* Background gradient */
                  bg-gradient-to-b from-blue-50 to-blue-100/80
                  
                  /* Border */
                  border border-blue-200/60
                  
                  /* Shadow */
                  shadow-sm
                  shadow-blue-900/5
                  
                  /* Hover */
                  hover:from-blue-100
                  hover:to-blue-200/90
                  hover:border-blue-300/80
                  hover:shadow-md
                  hover:shadow-blue-900/10
                  hover:-translate-y-0.5
                  
                  /* Active */
                  active:translate-y-0
                  active:shadow-sm
                  
                  /* Transitions */
                  transition-all
                  duration-200
                  ease-out
                  
                  /* Focus */
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500/30
                  focus:ring-offset-2
                "
                title="Edit user"
                aria-label="Edit user"
              >
                <Edit2 className="
                  w-4 h-4
                  text-blue-600
                  group-hover/edit:text-blue-700
                  transition-colors
                  duration-200
                " />
              </button>
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
