"use client"

import { CreditCard, Clock, FileCheck, Code } from "lucide-react"
import Link from "next/link"
import { usePermission } from "@/lib/hooks/use-permission"
import { PermissionModule } from "@/lib/utils/permissions-new"
import { useMemo } from "react"

export default function BillingPage() {
  const { view } = usePermission()
  
  const allSubModules = [
    {
      title: "Billing Codes",
      description: "Manage codes for your organization",
      href: "/billing/billing-codes",
      icon: Code,
      alwaysShow: true,
    },
    {
      title: "Services Pending Billing",
      description: "Review and process pending service charges",
      href: "/my-company/billing/services-pending",
      icon: Clock,
      module: PermissionModule.SERVICES_PENDING_BILLING,
    },
    {
      title: "Billed Claims",
      description: "View and manage submitted billing claims",
      href: "/my-company/billing/billed-claims",
      icon: FileCheck,
      module: PermissionModule.BILLED_CLAIMS,
    },
  ]
  
  const subModules = useMemo(() => {
    return allSubModules.filter(module => 
      (module as any).alwaysShow === true || view((module as any).module)
    )
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subModules.map((module) => {
            const IconComponent = module.icon
            return (
              <Link
                key={module.href}
                href={module.href}
                className="group block"
              >
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 transition-all duration-200 hover:shadow-lg hover:border-[#037ECC]/30 hover:-translate-y-1 min-h-[180px] flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-fit p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20 shrink-0">
                      <IconComponent className="h-6 w-6 text-[#037ECC]" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 group-hover:text-[#037ECC] transition-colors">
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
          <h3 className="text-lg font-semibold text-slate-800 mb-2">About Billing</h3>
          <p className="text-slate-600 leading-relaxed">
            Manage all aspects of billing operations, from pending services to submitted claims. 
            Track payment status and ensure timely processing of all financial transactions.
          </p>
        </div>
      </div>
    </div>
  )
}
