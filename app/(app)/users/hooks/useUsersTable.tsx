
import {useEffect, useMemo, useState} from "react"
import { useUsers } from "@/lib/modules/users/hooks/use-users"
import { usePermission } from "@/lib/hooks/use-permission"
import { PermissionModule } from "@/lib/utils/permissions-new"
import { CustomTableColumn } from "@/components/custom/CustomTable"
import { MemberUserListItem} from "@/lib/types/user.types"
import { Badge } from "@/components/ui/badge"
import { Edit2, Sliders } from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import {useRoles} from "@/lib/modules/roles/hooks/use-roles";
import {useDebouncedState} from "@/lib/hooks/use-debounced-state";
import {buildFilters} from "@/lib/utils/query-filters";
import {FilterOperator} from "@/lib/models/filterOperator";
import { parseLocalDate } from "@/lib/date";

type StatusFilter = "all" | "active" | "inactive" | "terminated"

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
  
  pagination: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
    onPageSizeChange: (pageSize: number) => void
    pageSizeOptions: number[]
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
  const [page, setPage] = useState(1) 
  const [pageSize, setPageSize] = useState(10)
  
  const [inputValue, setInputValue] = useState("")
  const [searchQuery, setSearchQuery] = useDebouncedState("", 500);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [roleFilter, setRoleFilter] = useState<string>("all")

  const filtersArray = useMemo(() => {
    const filters = []
    
    if (statusFilter === "terminated") {
      filters.push({
        field: "terminated",
        value: true,
        operator: FilterOperator.eq,
        type: "boolean" as const,
      })
    } else if (statusFilter === "active") {
      filters.push({
        field: "active",
        value: true,
        operator: FilterOperator.eq,
        type: "boolean" as const,
      })
    } else if (statusFilter === "inactive") {
      filters.push({
        field: "active",
        value: false,
        operator: FilterOperator.eq,
        type: "boolean" as const,
      })
      filters.push({
        field: "terminated",
        value: true,
        operator: FilterOperator.neq,
        type: "boolean" as const,
      })
    }

    filters.push({
      field: "role.name",
      value: roleFilter === "all" ? null : roleFilter,
      operator: FilterOperator.relatedEqual,
      type: "string" as const,
    })
    
    return buildFilters(
      filters,
      {
        fields: ["firstName","lastName"],
        search: searchQuery,
      }
    );
  }, [searchQuery, statusFilter, roleFilter])

  const { users, isLoading, error, totalCount, refetch } = useUsers({
    page: page - 1, 
    pageSize,
    filters: filtersArray,
  })
  
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

  useEffect(() => {
    refetch({
      page: page - 1,
      pageSize,
      filters: filtersArray,
    })
  }, [searchQuery, statusFilter, roleFilter, page, pageSize, filtersArray]);

  const uniqueRoles = useMemo(() => {
    const rolesList = new Set(roles.map((r) => r.name).filter(Boolean) as string[])
    return Array.from(rolesList)
  }, [roles])

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
            {user.hiringDate ? format(parseLocalDate(user.hiringDate), "MMM dd, yyyy") : "-"}
          </span>
        ),
      },
      
      {
        key: "status",
        header: "Status",
        render: (user) => {
          if (user.terminated) {
            return (
              <Badge
                variant="destructive"
                className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200"
              >
                Terminated
              </Badge>
            )
          }
          
          return (
            <Badge
              variant={user.active ? "default" : "secondary"}
              className={
                user.active
                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                  : ""
              }
            >
              {user.active ? "Active" : "Inactive"}
            </Badge>
          )
        },
      },
    ]
    
    if (permissions.canView || permissions.canEdit) {
      cols.push({
        key: "actions",
        header: "Actions",
        align: "right",
        render: (user) => (
          <div className="flex items-center justify-end gap-2">
            {permissions.canEdit && (
              <button
                onClick={() => router.push(`/users/${user.id}/manager`)}
                className="
                  group/manage
                  relative
                  h-9 w-9
                  flex items-center justify-center
                  rounded-xl
                  
                  bg-gradient-to-b from-slate-50 to-slate-100/80
                  border border-slate-200/70
                  shadow-sm
                  shadow-slate-900/5
                  
                  hover:from-slate-100
                  hover:to-slate-200/90
                  hover:border-slate-300/80
                  hover:shadow-md
                  hover:shadow-slate-900/10
                  hover:-translate-y-0.5
                  
                  active:translate-y-0
                  active:shadow-sm
                  
                  transition-all
                  duration-200
                  ease-out
                  
                  focus:outline-none
                  focus:ring-2
                  focus:ring-[#037ECC]/20
                  focus:ring-offset-2
                "
                title="User management"
                aria-label="User management"
              >
                <Sliders className="
                  w-4 h-4
                  text-slate-600
                  group-hover/manage:text-[#037ECC]
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
  }, [permissions, router])

  const handleSearchChange = (value: string) => {
    setInputValue(value)
    setSearchQuery(value)
    setPage(1)
  }
  
  const clearFilters = () => {
    setSearchQuery("")
    setInputValue("")
    setStatusFilter("all")
    setRoleFilter("all")
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
    pagination: {
      page,
      pageSize,
      total: totalCount,
      onPageChange: handlePageChange,
      onPageSizeChange: handlePageSizeChange,
      pageSizeOptions: [10, 25, 50, 100],
    },
    uniqueRoles,
    totalCount,
    filteredCount: users.length,
    clearFilters,
    refetch: () => refetch({ page: page - 1, pageSize, filters: filtersArray }),
    permissions,
  }
}
