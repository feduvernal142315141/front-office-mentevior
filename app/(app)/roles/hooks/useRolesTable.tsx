
import { useMemo, useState} from "react"
import { useRoles } from "@/lib/modules/roles/hooks/use-roles"
import { usePermission } from "@/lib/hooks/use-permission"
import { PermissionModule } from "@/lib/utils/permissions-new"
import { CustomTableColumn } from "@/components/custom/CustomTable"
import { Role } from "@/lib/types/role.types"
import { Badge } from "@/components/ui/badge"
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
}

export function useRolesTable(): UseRolesTableReturn {
  const router = useRouter()

  const [page, setPage] = useState(1) 
  const [pageSize, setPageSize] = useState(10)
  

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

    if (permissions.canEdit) {
      cols.push({
        key: "actions",
        header: "Actions",
        align: "right",
        render: (role) => (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => router.push(`/roles/${role.id}/edit`)}
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
              title="Edit role"
              aria-label="Edit role"
            >
              <Edit2 className="
                w-4 h-4
                text-blue-600
                group-hover/edit:text-blue-700
                transition-colors
                duration-200
              " />
            </button>
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
  }
}
