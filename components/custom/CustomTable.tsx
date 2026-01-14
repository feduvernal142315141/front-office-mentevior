
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
  sortable?: boolean
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
        "bg-white/80 backdrop-blur-sm rounded-2xl",
        "border border-slate-200/60",
        "shadow-sm",
        className
      )}>
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <div className="w-full max-w-4xl space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-12 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-lg flex-1" />
                <div className="h-12 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-lg flex-1" />
                <div className="h-12 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-lg w-24" />
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm font-medium text-slate-600">Loading data...</p>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className={cn(
        "relative overflow-hidden",
        "bg-white rounded-2xl",
        "border border-slate-200/60",
        "shadow-sm",
        className
      )}>
        <div className="flex flex-col items-center justify-center py-20 px-6">
          {/* Icon */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-[#037ECC]/10 rounded-full blur-2xl" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20 flex items-center justify-center">
              <FileQuestion className="w-10 h-10 text-[#037ECC]/60" />
            </div>
          </div>
          
          {emptyContent || (
            <>
              <p className="text-lg font-semibold text-slate-800">{emptyMessage}</p>
              <p className="mt-2 text-sm text-slate-500 max-w-md text-center">
                No records found in the database. Try adjusting your filters or create a new record to get started.
              </p>
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
      "border border-slate-200/60",
      "shadow-[0_1px_3px_rgba(15,23,42,0.03),0_1px_2px_rgba(15,23,42,0.02)]",
      "overflow-hidden",
      className
    )}>
      <div className="
        relative w-full
        overflow-x-auto
        [scrollbar-width:thin]
        [scrollbar-color:#CBD5E1_transparent]
        [&::-webkit-scrollbar]:h-2
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-slate-300
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb]:hover:bg-slate-400
      ">
        <table className="w-full border-collapse">
          <thead>
            <tr className="
              border-b border-slate-200/80
              bg-gradient-to-b from-[#037ECC]/[0.04] to-[#037ECC]/[0.02]
            ">
              {columns.map((column, idx) => (
                <th
                  key={column.key}
                  className={cn(
                    "h-14 px-6",
                    "text-xs font-semibold tracking-[0.02em]",
                    "text-[#037ECC]",
                    "sticky top-0 z-10",
                    "bg-gradient-to-b from-[#037ECC]/[0.04] to-[#037ECC]/[0.02]",
                    "backdrop-blur-sm",
                    "text-left align-middle",
                    "transition-colors duration-150",
                    "cursor-pointer select-none",
                    "hover:from-[#037ECC]/[0.08] hover:to-[#037ECC]/[0.04]",
                    "hover:text-[#037ECC]",
                    "group/header",
                    idx === 0 && "rounded-tl-2xl",
                    idx === columns.length - 1 && "rounded-tr-2xl",
                    getAlignClass(column.align),
                    column.className
                  )}
                >
                  <div className={cn(
                    "flex items-center gap-2",
                    getAlignClass(column.align)
                  )}>
                    <span className="uppercase">{column.header}</span>
                    {column.sortable && (
                      <div className="opacity-0 group-hover/header:opacity-100 transition-opacity">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </div>
                    )}
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
                  "group/row",
                  "border-b border-slate-100/80 last:border-b-0",
                  "transition-all duration-150 ease-out",
                  
                  "hover:bg-[#037ECC]/[0.03]",
                  "hover:shadow-[inset_3px_0_0_0_#037ECC]",
                  "hover:relative hover:z-10",
                  
                  "cursor-default"
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
                        "text-sm text-slate-700",
                        "align-middle",
                        "transition-colors duration-150",
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
          px-6 py-4 pb-48
          border-t border-slate-200/60
          bg-gradient-to-b from-slate-50/30 to-white
          flex flex-col sm:flex-row items-start sm:items-center justify-between
          gap-4
        ">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <p className="text-xs text-slate-500 whitespace-nowrap">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1}
              </span>
              {" "}-{" "}
              <span className="font-semibold text-slate-700">
                {Math.min(pagination.page * pagination.pageSize, pagination.total)}
              </span>
              {" "}of{" "}
              <span className="font-semibold text-slate-700">{pagination.total}</span>
            </p>

            {pagination.onPageSizeChange && (
              <PremiumSelect
                value={pagination.pageSize}
                onChange={pagination.onPageSizeChange}
                options={pagination.pageSizeOptions || [10, 25, 50, 100]}
                label="Rows:"
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={cn(
                "group/prev",
                "flex items-center gap-2",
                "h-9 px-3",
                "rounded-lg",
                "text-xs font-medium",
                
                "bg-white",
                "border border-slate-200",
                "text-slate-600",
                "shadow-sm shadow-slate-950/[0.02]",
                
                "hover:bg-[#037ECC]/5",
                "hover:border-[#037ECC]/30",
                "hover:text-[#037ECC]",
                "hover:shadow-md hover:shadow-[#037ECC]/5",
                
                "disabled:opacity-40",
                "disabled:cursor-not-allowed",
                "disabled:hover:bg-white",
                "disabled:hover:border-slate-200",
                "disabled:hover:text-slate-600",
                
                "transition-all duration-150"
              )}
            >
              <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover/prev:-translate-x-0.5" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            <div className="
              h-9 px-4
              rounded-lg
              bg-gradient-to-br from-[#037ECC] to-[#079CFB]
              text-xs font-semibold text-white
              flex items-center justify-center
              shadow-sm shadow-[#037ECC]/20
              whitespace-nowrap
              min-w-[80px]
            ">
              {pagination.page} / {Math.ceil(pagination.total / pagination.pageSize) || 1}
            </div>

            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page * pagination.pageSize >= pagination.total}
              className={cn(
                "group/next",
                "flex items-center gap-2",
                "h-9 px-3",
                "rounded-lg",
                "text-xs font-medium",
                
                "bg-gradient-to-br from-[#037ECC] to-[#079CFB]",
                "text-white",
                "shadow-sm shadow-[#037ECC]/20",
                
                "hover:shadow-md hover:shadow-[#037ECC]/30",
                "hover:brightness-110",
                
                "disabled:opacity-40",
                "disabled:cursor-not-allowed",
                "disabled:hover:brightness-100",
                
                "transition-all duration-150"
              )}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover/next:translate-x-0.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
