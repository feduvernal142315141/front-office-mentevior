"use client"

import { CreditCard, DollarSign, FileCheck } from "lucide-react"
import Link from "next/link"
import { usePermission } from "@/lib/hooks/use-permission"
import { PermissionModule } from "@/lib/utils/permissions-new"
import { useMemo } from "react"

export default function BillingPage() {
  const { view } = usePermission()
  
  const allSubModules = [
    {
      title: "Services Pending Billing",
      description: "Review and process services awaiting billing",
      href: "/billing/services-pending",
      icon: DollarSign,
      module: PermissionModule.SERVICES_PENDING_BILLING,
    },
    {
      title: "Billed Claims",
      description: "View and manage submitted billing claims",
      href: "/billing/billed-claims",
      icon: FileCheck,
      module: PermissionModule.BILLED_CLAIMS,
    },
  ]
  
  // Filter submodules based on user permissions
  const subModules = useMemo(() => {
    return allSubModules.filter(module => view(module.module))
  }, [view])

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
            <CreditCard className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
              Billing
            </h1>
            <p className="text-slate-600 mt-1">Manage billing and payment processing</p>
          </div>
        </div>

        {/* Sub-modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {subModules.map((module) => {
            const IconComponent = module.icon
            return (
              <Link
                key={module.href}
                href={module.href}
                className="group block"
              >
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 transition-all duration-200 hover:shadow-lg hover:border-[#037ECC]/30 hover:-translate-y-1 min-h-[220px] flex flex-col">
                  <div className="w-fit p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20 mb-4">
                    <IconComponent className="h-6 w-6 text-[#037ECC]" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-[#037ECC] transition-colors">
                    {module.title}
                  </h3>
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

        {/* Info Card */}
        <div className="mt-8 bg-gradient-to-br from-[#037ECC]/5 to-[#079CFB]/5 rounded-2xl border border-[#037ECC]/10 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">About Billing</h3>
          <p className="text-slate-600 leading-relaxed">
            Streamline your billing operations with comprehensive tools for managing pending services and tracking submitted claims. 
            Ensure accurate and timely billing for all services rendered.
          </p>
        </div>
      </div>
    </div>
  )
}
