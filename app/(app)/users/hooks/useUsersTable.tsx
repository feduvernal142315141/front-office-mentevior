
import { useMemo, useState } from "react"
import { useUsers } from "@/lib/modules/users/hooks/use-users"
import { usePermission } from "@/lib/hooks/use-permission"
import { PermissionModule } from "@/lib/utils/permissions-new"
import { CustomTableColumn } from "@/components/custom/CustomTable"
import { MemberUser } from "@/lib/types/user.types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Edit2 } from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"

type StatusFilter = "all" | "active" | "inactive"

interface UseUsersTableReturn {
  data: MemberUser[]
  columns: CustomTableColumn<MemberUser>[]
  isLoading: boolean
  error: Error | null
  
  filters: {
    searchQuery: string
    setSearchQuery: (value: string) => void
    statusFilter: StatusFilter
    setStatusFilter: (value: StatusFilter) => void
    roleFilter: string
    setRoleFilter: (value: string) => void
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
  
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  
  const uniqueRoles = useMemo(() => {
    const roles = new Set(users.map((u) => u.role?.name).filter(Boolean) as string[])
    return Array.from(roles)
  }, [users])
  
  const filteredData = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.cellphone?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.isActive) ||
        (statusFilter === "inactive" && !user.isActive)

      const matchesRole = roleFilter === "all" || user.role?.name === roleFilter

      return matchesSearch && matchesStatus && matchesRole
    })
  }, [users, searchQuery, statusFilter, roleFilter])
  
  const columns: CustomTableColumn<MemberUser>[] = useMemo(() => {
    const cols: CustomTableColumn<MemberUser>[] = [
      {
        key: "name",
        header: "Name",
        render: (user) => (
          <span className="font-medium">
            {user.firstName} {user.lastName}
          </span>
        ),
      },
      
      {
        key: "email",
        header: "Email",
        render: (user) => <span className="text-gray-600">{user.email}</span>,
      },
      
      {
        key: "cellphone",
        header: "Phone",
        render: (user) => (
          <span className="text-gray-600">{user.cellphone || "-"}</span>
        ),
      },
      
      {
        key: "role",
        header: "Role",
        render: (user) =>
          user.role ? (
            <Badge variant="outline" className="font-normal">
              {user.role.name}
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
  
  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setRoleFilter("all")
  }

  return {
    data: filteredData,
    columns,
    isLoading,
    error,
    filters: {
      searchQuery,
      setSearchQuery,
      statusFilter,
      setStatusFilter,
      roleFilter,
      setRoleFilter,
    },
    uniqueRoles,
    totalCount: users.length,
    filteredCount: filteredData.length,
    clearFilters,
    refetch,
    permissions,
  }
}
