"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Loader2, Check, X } from "lucide-react"
import { Checkbox } from "@/components/custom/Checkbox"
import { Button } from "@/components/custom/Button"
import { useRouter } from "next/navigation"
import { useHRDocumentsCatalog } from "@/lib/modules/hr-documents/hooks/use-hr-documents-catalog"
import { bulkCreateHRDocuments } from "@/lib/modules/hr-documents/services/hr-documents.service"
import type { HRDocumentCatalogItem } from "@/lib/types/hr-document.types"
import { toast } from "sonner"

interface SearchCatalogStepProps {
  onSuccess: () => void
  onClose: () => void
}

export function SearchCatalogStep({ onSuccess, onClose }: SearchCatalogStepProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const { data, isLoading } = useHRDocumentsCatalog("HR")
  const catalogDocuments = data?.catalogDocuments || []

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const filteredDocuments = catalogDocuments.filter((doc: HRDocumentCatalogItem) => {
    if (!searchTerm.trim()) return true
    return doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  })

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
    if (selectedIds.size === filteredDocuments.length && filteredDocuments.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredDocuments.map((c: HRDocumentCatalogItem) => c.id)))
    }
  }

  const isAllSelected = filteredDocuments.length > 0 && selectedIds.size === filteredDocuments.length
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < filteredDocuments.length

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      toast.error("Please select at least one document")
      return
    }

    if (selectedIds.size === 1) {

      const selectedDocument = catalogDocuments.find((c: HRDocumentCatalogItem) => selectedIds.has(c.id))
      if (selectedDocument) {
        onClose()
        
        const params = new URLSearchParams({
          mode: "catalog",
          catalogId: selectedDocument.id,
          name: selectedDocument.name,
        })
        
        router.push(`/hr-documents/create?${params.toString()}`)
      }
    } else {

      setIsSubmitting(true)
      try {
        const selectedCatalogIds = Array.from(selectedIds)
  
        await bulkCreateHRDocuments({ catalogIds: selectedCatalogIds, documentCategory: "HR" })
        
        toast.success(`${selectedCatalogIds.length} documents added successfully`)
        onSuccess()
        
      } catch (error) {
        console.error("Error creating bulk documents:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to add documents"
        toast.error(errorMessage)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const selectedCount = selectedIds.size
  const buttonText = selectedCount === 0 
    ? "Add Document" 
    : selectedCount === 1 
      ? "Add Document" 
      : `Add ${selectedCount} Documents`

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        <p className="text-gray-600 mt-1">Find and select HR documents</p>
      </div>

      <div className="p-6 border-b border-gray-200 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name..."
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

        <div className="flex items-center justify-end">
          {filteredDocuments.length > 0 && (
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
        ) : filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 px-6">
            <Search className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-600 text-center">
              {searchTerm ? "No documents found. Try a different search term." : "No documents available in catalog."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredDocuments.map((document) => {
              const isSelected = selectedIds.has(document.id)
              
              return (
                <div
                  key={document.id}
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
                        onCheckedChange={() => toggleSelection(document.id)}
                        size="md"
                      />
                    </div>
                    
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => toggleSelection(document.id)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-lg font-semibold ${isSelected ? "text-blue-700" : "text-gray-900"}`}>
                          {document.name}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

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
            className="min-w-[220px] flex items-center justify-center transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
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
