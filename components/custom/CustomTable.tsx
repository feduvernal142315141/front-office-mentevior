
import { ReactNode } from "react"
import { Loader2, FileQuestion, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { PremiumSelect } from "./PremiumSelect"

export interface CustomTableColumn<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  align?: "left" | "center" | "right"
  className?: string
}

export interface CustomTableProps<T> {
  columns: CustomTableColumn<T>[]
  data: T[]
  isLoading?: boolean
  emptyMessage?: string
  emptyContent?: ReactNode
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
    onPageSizeChange?: (pageSize: number) => void
    pageSizeOptions?: number[]
  }
  className?: string
  getRowKey?: (row: T, index: number) => string
}

function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split(".").reduce((acc: any, part) => acc?.[part], obj)
}

function getAlignClass(align?: "left" | "center" | "right"): string {
  switch (align) {
    case "center":
      return "text-center justify-center"
    case "right":
      return "text-right justify-end"
    default:
      return "text-left justify-start"
  }
}

export function CustomTable<T>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "No data available",
  emptyContent,
  pagination,
  className = "",
  getRowKey,
}: CustomTableProps<T>) {

  const getKey = (row: T, index: number): string => {
    if (getRowKey) {
      return getRowKey(row, index)
    }
    const id = (row as any).id
    return id ? String(id) : `row-${index}`
  }


  if (isLoading) {
    return (
      <div className={cn(
        "relative overflow-hidden",
        "bg-white rounded-2xl",
        "border border-gray-200/60",
        "shadow-sm",
        className
      )}>
        <div className="flex flex-col items-center justify-center py-16 px-6">
          {/* Animated loader */}
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
            <Loader2 className="relative w-10 h-10 animate-spin text-blue-600" />
          </div>
          <p className="mt-4 text-sm font-medium text-gray-700">Loading data...</p>
          <p className="mt-1 text-xs text-gray-500">Please wait a moment</p>
        </div>
      </div>
    )
  }

 
  if (!data || data.length === 0) {
    return (
      <div className={cn(
        "relative overflow-hidden",
        "bg-white rounded-2xl",
        "border border-gray-200/60",
        "shadow-sm",
        className
      )}>
        <div className="flex flex-col items-center justify-center py-16 px-6">
          {/* Icon */}
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-gray-200/50 rounded-full blur-xl" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-sm">
              <FileQuestion className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          
          {emptyContent || (
            <>
              <p className="text-base font-semibold text-gray-800">{emptyMessage}</p>
              <p className="mt-1 text-sm text-gray-500">No records found in the database</p>
            </>
          )}
        </div>
      </div>
    )
  }


  return (
    <div className={cn(
      "relative",
      "bg-white rounded-2xl",
      "border border-gray-200/60",
      "shadow-sm",
      className
    )}>
      <div className="
        relative w-full
        overflow-x-auto
        [scrollbar-width:none]
        [&::-webkit-scrollbar]:hidden
      ">
        <table className="w-full caption-bottom text-sm">
          <thead>
            <tr className="
              border-b border-gray-200/80
              bg-gradient-to-b from-gray-50/80 to-gray-100/50
              hover:bg-gradient-to-b hover:from-gray-50 hover:to-gray-100/60
            ">
              {columns.map((column, idx) => (
                <th
                  key={column.key}
                  className={cn(
                    "h-12 px-6",
                    "text-xs font-semibold uppercase tracking-wider",
                    "text-gray-700",
                    "sticky top-0 z-10",
                    "bg-gradient-to-b from-gray-50/95 to-gray-100/50",
                    "backdrop-blur-sm",
                    "text-left align-middle",
                    idx === 0 && "rounded-tl-2xl",
                    idx === columns.length - 1 && "rounded-tr-2xl",
                    getAlignClass(column.align),
                    column.className
                  )}
                >
                  <div className={cn("flex items-center gap-2", getAlignClass(column.align))}>
                    {column.header}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((row, rowIndex) => (
              <tr 
                key={getKey(row, rowIndex)}
                className={cn(
                  "group",
                  "border-b border-gray-100/80",
                  "transition-all duration-200 ease-out",
                  
                  /* Zebra stripes sutiles */
                  rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50/30",
                  
                  /* Hover effect premium */
                  "hover:bg-blue-50/40",
                  "hover:shadow-[0_2px_8px_rgba(59,130,246,0.08)]",
                  "hover:-translate-y-[1px]",
                  "hover:scale-[1.001]",
                  "hover:z-10",
                  
                  /* Last row sin border */
                  rowIndex === data.length - 1 && "border-b-0"
                )}
              >
                {columns.map((column) => {
      
                  const content = column.render
                    ? column.render(row)
                    : String(getNestedValue(row, column.key) ?? "-")

                  return (
                    <td
                      key={`${getKey(row, rowIndex)}-${column.key}`}
                      className={cn(
                        "px-6 py-4",
                        "text-sm text-gray-800",
                        "align-middle",
                        "transition-colors duration-200",
                        getAlignClass(column.align),
                        column.className
                      )}
                    >
                      {content}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="
          px-6 py-4
          border-t border-gray-200/60
          bg-gradient-to-b from-gray-50/30 to-white
          flex flex-col sm:flex-row items-start sm:items-center justify-between
          gap-4
        ">
          {/* Left side: Info + Page size selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Info */}
            <p className="text-sm text-gray-600 whitespace-nowrap">
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-gray-900">
                {Math.min(pagination.page * pagination.pageSize, pagination.total)}
              </span>{" "}
              of <span className="font-semibold text-gray-900">{pagination.total}</span> results
            </p>

            {/* Page size selector */}
            {pagination.onPageSizeChange && (
              <PremiumSelect
                value={pagination.pageSize}
                onChange={pagination.onPageSizeChange}
                options={pagination.pageSizeOptions || [10, 25, 50, 100]}
                label="Rows per page:"
              />
            )}
          </div>

          {/* Right side: Pagination controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={cn(
                "group/prev",
                "flex items-center gap-2",
                "px-4 py-2.5",
                "rounded-xl",
                "text-sm font-medium",
                
                /* Enabled state */
                "bg-gradient-to-b from-white to-gray-50",
                "border border-gray-200/80",
                "text-gray-700",
                "shadow-sm",
                
                /* Hover */
                "hover:from-gray-50 hover:to-gray-100",
                "hover:border-gray-300/80",
                "hover:shadow-md",
                "hover:-translate-y-0.5",
                
                /* Active */
                "active:translate-y-0",
                "active:shadow-sm",
                
                /* Disabled */
                "disabled:opacity-40",
                "disabled:cursor-not-allowed",
                "disabled:hover:translate-y-0",
                "disabled:hover:shadow-sm",
                "disabled:hover:from-white",
                "disabled:hover:to-gray-50",
                
                "transition-all duration-200 ease-out"
              )}
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover/prev:-translate-x-0.5" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            {/* Page indicator */}
            <div className="
              px-4 py-2
              rounded-lg
              bg-blue-50/50
              border border-blue-100/80
              text-sm font-semibold text-blue-700
              whitespace-nowrap
            ">
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize) || 1}
            </div>

            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page * pagination.pageSize >= pagination.total}
              className={cn(
                "group/next",
                "flex items-center gap-2",
                "px-4 py-2.5",
                "rounded-xl",
                "text-sm font-medium",
                
                /* Enabled state */
                "bg-gradient-to-b from-blue-500 to-blue-600",
                "border border-blue-600/20",
                "text-white",
                "shadow-sm shadow-blue-900/20",
                
                /* Hover */
                "hover:from-blue-600 hover:to-blue-700",
                "hover:shadow-md hover:shadow-blue-900/30",
                "hover:-translate-y-0.5",
                
                /* Active */
                "active:translate-y-0",
                "active:shadow-sm",
                
                /* Disabled */
                "disabled:opacity-40",
                "disabled:cursor-not-allowed",
                "disabled:hover:translate-y-0",
                "disabled:hover:shadow-sm",
                "disabled:hover:from-blue-500",
                "disabled:hover:to-blue-600",
                
                "transition-all duration-200 ease-out"
              )}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover/next:translate-x-0.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
