import { useMemo } from "react"
import { useAgreements } from "./use-agreements"
import { Eye } from "lucide-react"
import type { Agreement } from "@/lib/types/agreement.types"

export function useAgreementsTable() {
  const { agreements, isLoading, error, refetch } = useAgreements()

  const handleViewDocument = (agreement: Agreement) => {
    if (agreement.documentUrl) {
      window.open(agreement.documentUrl, "_blank", "noopener,noreferrer")
    }
  }

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Agreement Name",
        render: (agreement: Agreement) => (
          <div className="font-medium text-gray-900">{agreement.name}</div>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "right" as const,
        render: (agreement: Agreement) => (
          <div className="flex justify-end gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleViewDocument(agreement)
              }}
              className="
                group/view
                relative
                h-9 w-9
                flex items-center justify-center
                rounded-xl
                
                /* Background gradient */
                bg-gradient-to-b from-[#037ECC]/10 to-[#079CFB]/10
                
                /* Border */
                ring-1 ring-[#037ECC]/20
                
                /* Hover effects */
                hover:ring-[#037ECC]/40
                hover:from-[#037ECC]/15 hover:to-[#079CFB]/15
                hover:shadow-[0_4px_12px_rgba(3,126,204,0.15)]
                
                /* Transitions */
                transition-all duration-200
                
                /* Active state */
                active:scale-95
              "
              title="View Document"
            >
              <Eye 
                className="
                  w-[18px] h-[18px] 
                  text-[#037ECC]
                  group-hover/view:text-[#079CFB]
                  transition-colors duration-200
                " 
              />
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  return {
    agreements,
    columns,
    isLoading,
    error,
    refetch,
  }
}
