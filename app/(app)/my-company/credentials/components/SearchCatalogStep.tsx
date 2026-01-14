"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Loader2, Check } from "lucide-react"
import { Checkbox } from "@/components/custom/Checkbox"
import { Button } from "@/components/custom/Button"
import { useRouter } from "next/navigation"
import { useCredentialsCatalog } from "@/lib/modules/credentials/hooks/use-credentials-catalog"
import { bulkCreateCredentials } from "@/lib/modules/credentials/services/credentials.service"
import type { CredentialCatalogItem } from "@/lib/types/credential.types"
import { toast } from "sonner"

interface SearchCatalogStepProps {
  onSelectCredential: (credential: CredentialCatalogItem) => void
  onClose: () => void
}

export function SearchCatalogStep({ onSelectCredential, onClose }: SearchCatalogStepProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const { catalogCredentials, isLoading, filterCredentials } = useCredentialsCatalog()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      filterCredentials(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, filterCredentials])

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
    if (selectedIds.size === catalogCredentials.length && catalogCredentials.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(catalogCredentials.map(c => c.id)))
    }
  }

  const isAllSelected = catalogCredentials.length > 0 && selectedIds.size === catalogCredentials.length
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < catalogCredentials.length

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      toast.error("Please select at least one credential")
      return
    }

    if (selectedIds.size === 1) {
      const selectedCredential = catalogCredentials.find(c => selectedIds.has(c.id))
      if (selectedCredential) {
        onClose()
        
        let parsedName = selectedCredential.name
        let parsedShortName = selectedCredential.shortName
        
        const parenthesesMatch = selectedCredential.name.match(/^(.+?)\s*\(([^)]+)\)\s*$/)
        if (parenthesesMatch) {
          parsedName = parenthesesMatch[1].trim()
          parsedShortName = parenthesesMatch[2].trim()
        }
        
        const params = new URLSearchParams({
          mode: "catalog",
          catalogId: selectedCredential.id,
          name: parsedName,
          shortName: parsedShortName,
        })
        
        if (selectedCredential.organizationName) {
          params.append("organizationName", selectedCredential.organizationName)
        }
        
        if (selectedCredential.website) {
          params.append("website", selectedCredential.website)
        }
        
        if (selectedCredential.description) {
          params.append("description", selectedCredential.description)
        }
        
        router.push(`/my-company/credentials/create?${params.toString()}`)
      }
    } else {
      setIsSubmitting(true)
      try {
        const selectedCredentials = Array.from(selectedIds)
  
        await bulkCreateCredentials(selectedCredentials)
        
        toast.success(`${selectedCredentials.length} credentials added successfully`)
        onClose()
        
        setTimeout(() => {
          router.push("/my-company/credentials")
        }, 1000)
        
      } catch (error) {
        console.error("Error creating bulk credentials:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to add credentials"
        toast.error(errorMessage)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const selectedCount = selectedIds.size
  const buttonText = selectedCount === 0 
    ? "Add Credential" 
    : selectedCount === 1 
      ? "Add Credential" 
      : `Add ${selectedCount} Credentials`

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        <p className="text-gray-600 mt-1">Find and select credentials</p>
      </div>

      <div className="p-6 border-b border-gray-200 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or description..."
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

        <div className="flex items-center justify-end">
          {catalogCredentials.length > 0 && (
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
        ) : catalogCredentials.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 px-6">
            <Search className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-600 text-center">
              No credentials found. Try a different search term.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {catalogCredentials.map((credential) => {
              const isSelected = selectedIds.has(credential.id)
              
              return (
                <div
                  key={credential.id}
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
                        onCheckedChange={() => toggleSelection(credential.id)}
                        size="md"
                      />
                    </div>
                    
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => toggleSelection(credential.id)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-lg font-semibold ${isSelected ? "text-blue-700" : "text-gray-900"}`}>
                          {credential.name}
                        </span>
                      </div>
                      {credential.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {credential.description}
                        </p>
                      )}
                      {credential.organizationName && (
                        <p className="text-xs text-gray-500 mt-1">
                          {credential.organizationName}
                        </p>
                      )}
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
