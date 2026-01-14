"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Loader2, Check, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/custom/Checkbox"
import { Button } from "@/components/custom/Button"
import { useRouter } from "next/navigation"
import { useBillingCodesCatalog } from "@/lib/modules/billing-codes/hooks/use-billing-codes-catalog"
import { useBillingCodeTypes } from "@/lib/modules/billing-codes/hooks/use-billing-code-types"
import { bulkCreateBillingCodes } from "@/lib/modules/billing-codes/services/billing-codes.service"
import type { BillingCodeCatalogItem } from "@/lib/types/billing-code.types"
import { toast } from "sonner"

interface SearchCatalogStepProps {
  onSelectCode: (code: BillingCodeCatalogItem) => void
  onClose: () => void
  onSuccess: () => void
}

export function SearchCatalogStep({ onSelectCode, onClose, onSuccess }: SearchCatalogStepProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const { catalogCodes, isLoading, filterCodes } = useBillingCodesCatalog()
  const { types: billingCodeTypes, isLoading: isLoadingTypes } = useBillingCodeTypes()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      filterCodes(searchTerm, typeFilter)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, typeFilter, filterCodes])

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === catalogCodes.length && catalogCodes.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(catalogCodes.map(c => c.id)))
    }
  }

  const isAllSelected = catalogCodes.length > 0 && selectedIds.size === catalogCodes.length
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < catalogCodes.length

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      toast.error("Please select at least one billing code")
      return
    }

    if (selectedIds.size === 1) {
      const selectedCode = catalogCodes.find(c => selectedIds.has(c.id))
      if (selectedCode) {
        onClose()
        const params = new URLSearchParams({
          mode: "catalog",
          catalogId: selectedCode.id,
          type: selectedCode.type,
          code: selectedCode.code,
          description: selectedCode.description,
        })
        router.push(`/billing/billing-codes/create?${params.toString()}`)
      }
    } else {
      setIsSubmitting(true)
      try {
        const selectedCodes = Array.from(selectedIds)
  
        await bulkCreateBillingCodes(selectedCodes)
        
        toast.success(`${selectedCodes.length} billing codes added successfully`)
        onSuccess()
        onClose()
        
      } catch (error) {
        console.error("Error creating bulk billing codes:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to add billing codes"
        toast.error(errorMessage)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const selectedCount = selectedIds.size
  const buttonText = selectedCount === 0 
    ? "Add Billing Code" 
    : selectedCount === 1 
      ? "Add Billing Code" 
      : `Add ${selectedCount} Billing Codes`


  const getBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      "CPT": "border-green-200 bg-green-50 text-green-700",
      "HCPCS": "border-purple-200 bg-purple-50 text-purple-700",
      "ICD-10": "border-blue-200 bg-blue-50 text-blue-700",
      "SNOMED": "border-orange-200 bg-orange-50 text-orange-700",
    }
    return colors[type] || "border-gray-200 bg-gray-50 text-gray-700"
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        <p className="text-gray-600 mt-1">Find and select codes</p>
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
              pl-12 pr-12
              rounded-xl
              border-2 border-gray-200
              focus:border-blue-500
              focus:ring-4 focus:ring-blue-500/10
              text-base
              transition-all
              outline-none
            "
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
  
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setTypeFilter("all")}
              className={`
                px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap
                ${typeFilter === "all" 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }
              `}
            >
              All
            </button>
            {isLoadingTypes ? (
              <div className="px-3 py-2 text-xs text-gray-400">Loading types...</div>
            ) : (
              billingCodeTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setTypeFilter(type.name)}
                  className={`
                    px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap
                    ${typeFilter === type.name
                      ? "bg-blue-600 text-white" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }
                  `}
                >
                  {type.name}
                </button>
              ))
            )}
          </div>

          {/* Select All / Deselect All */}
          {catalogCodes.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className={`
                flex items-center justify-center gap-2
                px-4 py-2
                rounded-lg
                border
                text-xs font-medium
                transition-all
                whitespace-nowrap
                shrink-0
                ${isAllSelected
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : isSomeSelected
                    ? "border-blue-400 bg-blue-25 text-blue-600"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }
              `}
            >
              {(isAllSelected || isSomeSelected) && (
                <Check className="w-4 h-4" strokeWidth={2.5} />
              )}
              Select All
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
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
            {catalogCodes.map((code) => {
              const isSelected = selectedIds.has(code.id)
              
              return (
                <div
                  key={code.id}
                  className={`
                    p-4
                    transition-colors
                    ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}
                  `}
                >
                  <div className="flex items-start gap-4">
                    <div className="pt-1">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelection(code.id)}
                        size="md"
                      />
                    </div>
                    
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => toggleSelection(code.id)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-lg font-semibold ${isSelected ? "text-blue-700" : "text-gray-900"}`}>
                          {code.code}
                        </span>
                        <Badge 
                          variant="outline"
                          className={getBadgeColor(code.type)}
                        >
                          {code.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {code.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Sticky Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            {selectedCount > 0 && (
              <span className="font-medium text-gray-900">
                {selectedCount} selected
              </span>
            )}
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={selectedCount === 0 || isSubmitting}
            className="min-w-[200px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              buttonText
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
