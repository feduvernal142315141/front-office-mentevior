
import { ReactNode } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2 } from "lucide-react"

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
      return "text-center"
    case "right":
      return "text-right"
    default:
      return "text-left"
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
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      </div>
    )
  }

 
  if (!data || data.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
        <div className="text-center py-12">
          {emptyContent || <p className="text-gray-500">{emptyMessage}</p>}
        </div>
      </div>
    )
  }


  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={`${getAlignClass(column.align)} ${column.className || ""}`}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow key={getKey(row, rowIndex)}>
                {columns.map((column) => {
      
                  const content = column.render
                    ? column.render(row)
                    : String(getNestedValue(row, column.key) ?? "-")

                  return (
                    <TableCell
                      key={`${getKey(row, rowIndex)}-${column.key}`}
                      className={`${getAlignClass(column.align)} ${column.className || ""}`}
                    >
                      {content}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-semibold">
              {(pagination.page - 1) * pagination.pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold">
              {Math.min(pagination.page * pagination.pageSize, pagination.total)}
            </span>{" "}
            of <span className="font-semibold">{pagination.total}</span> results
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page * pagination.pageSize >= pagination.total}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
