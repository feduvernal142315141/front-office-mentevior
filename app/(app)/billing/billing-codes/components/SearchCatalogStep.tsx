
"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useBillingCodesCatalog } from "@/lib/modules/billing-codes/hooks/use-billing-codes-catalog"
import type { BillingCodeCatalogItem } from "@/lib/types/billing-code.types"

interface SearchCatalogStepProps {
  onSelectCode: (code: BillingCodeCatalogItem) => void
}

export function SearchCatalogStep({ onSelectCode }: SearchCatalogStepProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const inputRef = useRef<HTMLInputElement>(null)
  
  const { catalogCodes, isLoading, search } = useBillingCodesCatalog()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

   useEffect(() => {
    const timer = setTimeout(() => {
      search(searchTerm, typeFilter)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, typeFilter, search])

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        
        <p className="text-gray-600 mt-1">Find an existing CPT or HCPCS code</p>
      </div>

      <div className="p-6 border-b border-gray-200 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by code or description..."
            className="
              w-full
              h-14
              pl-12 pr-4
              rounded-xl
              border-2 border-gray-200
              focus:border-blue-500
              focus:ring-4 focus:ring-blue-500/10
              text-base
              transition-all
              outline-none
            "
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setTypeFilter("all")}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${typeFilter === "all" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }
            `}
          >
            All Types
          </button>
          <button
            onClick={() => setTypeFilter("CPT")}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${typeFilter === "CPT" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }
            `}
          >
            CPT
          </button>
          <button
            onClick={() => setTypeFilter("HCPCS")}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${typeFilter === "HCPCS" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }
            `}
          >
            HCPCS
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : catalogCodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 px-6">
            <Search className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-600 text-center">
              {searchTerm.trim() 
                ? "No codes found. Try a different search term." 
                : "Start typing to search for billing codes"
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {catalogCodes.map((code) => (
              <button
                key={code.id}
                onClick={() => onSelectCode(code)}
                className="
                  w-full
                  p-4
                  text-left
                  hover:bg-blue-50
                  transition-colors
                  group
                "
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-semibold text-gray-900 group-hover:text-blue-700">
                        {code.code}
                      </span>
                      <Badge 
                        variant="outline"
                        className={
                          code.type === "CPT" 
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-purple-200 bg-purple-50 text-purple-700"
                        }
                      >
                        {code.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {code.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
