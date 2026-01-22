"use client"

import { BookOpen, Edit3, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import type { SourceType } from "../hooks/useClinicalDocumentDrawer"

interface SelectSourceStepProps {
  onSelectSource: (source: SourceType) => void
  onClose: () => void
}

export function SelectSourceStep({ onSelectSource, onClose }: SelectSourceStepProps) {
  const router = useRouter()

  return (
    <div className="p-6 space-y-6">
      <div>
        <p className="text-gray-600 mt-1">
          Choose how you want to add clinical documents to your organization
        </p>
      </div>

      <div className="grid gap-4">
        <button
          onClick={() => onSelectSource("catalog")}
          className="
            group relative w-full p-6 text-left
            rounded-2xl border-2 border-blue-200
            bg-gradient-to-br from-blue-50 to-blue-100/50
            hover:from-blue-100 hover:to-blue-150
            hover:border-blue-300
            hover:shadow-lg hover:shadow-blue-900/10
            transition-all duration-200
            cursor-pointer
          "
        >
          <div className="flex gap-4 h-50 lg:h-53 xl:h-38 2xl:h-40">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>

            <div className="flex flex-col justify-between flex-1 min-w-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    From Catalog
                  </h3>
                  <Badge className="bg-blue-600 text-white hover:bg-blue-700">
                    Recommended
                  </Badge>
                </div>

                <p className="text-sm text-gray-600">
                  Select standard clinical documents from our pre-configured catalog
                </p>
              </div>

              <div className="mt-3 space-y-1 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600" />
                  <span>Standard document names</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600" />
                  <span>Quick bulk selection</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600" />
                  <span>Fastest setup</span>
                </div>
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            onClose()
            router.push("/clinical-documents/create?mode=manual")
          }}
          className="
            group relative w-full p-6 text-left
            rounded-2xl border-2 border-gray-200 bg-white
            hover:border-gray-300
            hover:shadow-lg hover:shadow-gray-900/5
            transition-all duration-200
            cursor-pointer
          "
        >
          <div className="flex gap-4 h-50 lg:h-53 xl:h-38 2xl:h-40">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gray-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
              <Edit3 className="w-6 h-6" />
            </div>

            <div className="flex flex-col flex-1 min-w-0">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Create Manually
                </h3>

                <p className="text-sm text-gray-600">
                  Create a custom document configuration
                </p>
              </div>
              
              <div className="mt-6 space-y-1 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-gray-500" />
                  <span>Custom document names</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-gray-500" />
                  <span>Full field control</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-gray-500" />
                  <span>Best for specific requirements</span>
                </div>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}
