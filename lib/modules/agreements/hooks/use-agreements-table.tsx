import { useMemo, useState } from "react"
import { useAgreements } from "./use-agreements"
import { Eye, Loader2 } from "lucide-react"
import type { AgreementListItem } from "@/lib/types/agreement.types"
import { getDocumentUrl } from "../services/agreements.service"

export function useAgreementsTable() {
  const { agreements, isLoading, error, refetch } = useAgreements()
  const [selectedDocument, setSelectedDocument] = useState<{ url: string; name: string } | null>(null)
  const [loadingDocumentId, setLoadingDocumentId] = useState<string | null>(null)

  const handleViewDocument = async (agreement: AgreementListItem) => {
    try {
      setLoadingDocumentId(agreement.id)
      const url = await getDocumentUrl(agreement.id)
      setSelectedDocument({
        url,
        name: agreement.name
      })
    } catch (err) {
      console.error("Error fetching document:", err)
    } finally {
      setLoadingDocumentId(null)
    }
  }

  const handleCloseViewer = () => {
    setSelectedDocument(null)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      })
    } catch {
      return dateString
    }
  }

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Agreement Name",
        render: (agreement: AgreementListItem) => (
          <div className="font-medium text-gray-900">{agreement.name}</div>
        ),
      },
      {
        key: "createdAt",
        header: "Created Date",
        render: (agreement: AgreementListItem) => (
          <div className="text-gray-600">{formatDate(agreement.createdAt)}</div>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "right" as const,
        render: (agreement: AgreementListItem) => {
          const isLoadingThis = loadingDocumentId === agreement.id
          return (
            <div className="flex justify-end gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (!isLoadingThis) {
                    handleViewDocument(agreement)
                  }
                }}
                disabled={isLoadingThis}
                className="
                  group/view
                  relative
                  h-9 w-9
                  flex items-center justify-center
                  rounded-xl
                  bg-gradient-to-b from-[#037ECC]/10 to-[#079CFB]/10
                  ring-1 ring-[#037ECC]/20
                  hover:ring-[#037ECC]/40
                  hover:from-[#037ECC]/15 hover:to-[#079CFB]/15
                  hover:shadow-[0_4px_12px_rgba(3,126,204,0.15)]
                  transition-all duration-200
                  active:scale-95
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
                title="View Document"
              >
                {isLoadingThis ? (
                  <Loader2 className="w-[18px] h-[18px] text-[#037ECC] animate-spin" />
                ) : (
                  <Eye 
                    className="
                      w-[18px] h-[18px] 
                      text-[#037ECC]
                      group-hover/view:text-[#079CFB]
                      transition-colors duration-200
                    " 
                  />
                )}
              </button>
            </div>
          )
        },
      },
    ],
    [loadingDocumentId]
  )

  return {
    agreements,
    columns,
    isLoading,
    error,
    refetch,
    selectedDocument,
    handleCloseViewer,
  }
}
