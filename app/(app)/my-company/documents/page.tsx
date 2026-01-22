"use client"

import { FolderHeart, FolderOpen, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useCanViewModule } from "@/lib/hooks/use-filtered-nav-items"
import { useMemo } from "react"

export default function DocumentsPage() {
  const canViewClinicalDocuments = useCanViewModule("/clinical-documents")
  const canViewHRDocuments = useCanViewModule("/hr-documents")

  const documentModules = [
    {
      title: "Clinical Documents",
      description: "Access and manage clinical documentation",
      href: "/clinical-documents",
      icon: FolderHeart,
      canView: canViewClinicalDocuments,
    },
    {
      title: "HR Documents",
      description: "Manage human resources documents",
      href: "/hr-documents",
      icon: FolderOpen,
      canView: canViewHRDocuments,
    },
  ]

  const visibleModules = useMemo(() => {
    return documentModules.filter(module => module.canView)
  }, [canViewClinicalDocuments, canViewHRDocuments])

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
            <FolderHeart className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
              Documents
            </h1>
            <p className="text-slate-600 mt-1">Manage clinical and HR documentation</p>
          </div>
        </div>

        {visibleModules.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <FolderHeart className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No documents available</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              You don't have permission to access any document modules. Contact your administrator to request access.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleModules.map((module) => {
                const IconComponent = module.icon
                return (
                  <Link
                    key={module.href}
                    href={module.href}
                    className="group block"
                  >
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 transition-all duration-200 hover:shadow-lg hover:border-[#037ECC]/30 hover:-translate-y-1 min-h-[220px] flex flex-col relative">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-fit p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20 mb-4">
                          <IconComponent className="h-6 w-6 text-[#037ECC]" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-[#037ECC] transition-colors pr-8">
                          {module.title}
                        </h3>
                      </div>
                      <p className="text-sm text-slate-600 flex-1 leading-relaxed">
                        {module.description}
                      </p>
                      <div className="mt-4 flex items-center text-sm font-medium text-[#037ECC] group-hover:translate-x-1 transition-transform pt-2 border-t border-slate-100">
                        Access →
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            <div className="mt-8 bg-gradient-to-br from-[#037ECC]/5 to-[#079CFB]/5 rounded-2xl border border-[#037ECC]/10 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Document Management</h3>
              <p className="text-slate-600 leading-relaxed">
                Access and manage all your clinical and human resources documentation from this centralized hub.
                {visibleModules.length > 1 
                  ? " View clinical records and HR files in one place."
                  : " Access the document modules you have permission to view."
                }
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
