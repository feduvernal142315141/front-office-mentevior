"use client"

import { Building2, Shield, UserCircle, MapPin, CreditCard, Award, Calendar, Stethoscope, FileText, BarChart3, FileSignature, FolderHeart, FolderOpen, FileCheck, UserPlus } from "lucide-react"
import Link from "next/link"
import { useCanViewModule } from "@/lib/hooks/use-filtered-nav-items"
import { useMemo } from "react"
import { ChevronRight } from "lucide-react"

export default function MyCompanyPage() {
  const canViewRoles = useCanViewModule("/my-company/roles")
  const canViewAccountProfile = useCanViewModule("/my-company/account-profile")
  const canViewAddress = useCanViewModule("/my-company/address")
  const canViewCredentials = useCanViewModule("/my-company/credentials")
  const canViewPhysicians = useCanViewModule("/my-company/physicians")
  const canViewServicePlans = useCanViewModule("/my-company/service-plans")
  const canViewEvents = useCanViewModule("/my-company/events")
  const canViewBilling = useCanViewModule("/my-company/billing")
  const canViewDataCollection = useCanViewModule("/data-collection")
  const canViewSignaturesCaregiver = useCanViewModule("/my-company/signatures-caregiver")
  const canViewTemplateDocuments = useCanViewModule("/template-documents")
  const canViewDocuments = useCanViewModule("/my-company/documents")
  const canViewAgreements = useCanViewModule("/agreements")
  const canViewApplicants = useCanViewModule("/applicants")

  const allSubModules = [
    {
      title: "Roles",
      description: "Manage user roles and permissions",
      href: "/my-company/roles",
      icon: Shield,
      canView: canViewRoles,
      hasDeepChildren: false,
    },
    {
      title: "Account Profile",
      description: "Update company account information",
      href: "/my-company/account-profile",
      icon: UserCircle,
      canView: canViewAccountProfile,
      hasDeepChildren: false,
    },
    {
      title: "Address",
      description: "Manage locations and addresses",
      href: "/my-company/address",
      icon: MapPin,
      canView: canViewAddress,
      hasDeepChildren: false,
    },
    {
      title: "Credentials",
      description: "Manage professional credentials",
      href: "/my-company/credentials",
      icon: Award,
      canView: canViewCredentials,
      hasDeepChildren: false,
    },
    {
      title: "Physicians",
      description: "Manage physician information",
      href: "/my-company/physicians",
      icon: Stethoscope,
      canView: canViewPhysicians,
      hasDeepChildren: false,
    },
    {
      title: "Service Plans",
      description: "Configure service plan offerings",
      href: "/my-company/service-plans",
      icon: FileText,
      canView: canViewServicePlans,
      hasDeepChildren: false,
    },
    {
      title: "Events",
      description: "Manage appointments, service plans and supervision",
      href: "/my-company/events",
      icon: Calendar,
      canView: canViewEvents,
      hasDeepChildren: true,
    },
    {
      title: "Billing",
      description: "Handle billing and payment processing",
      href: "/my-company/billing",
      icon: CreditCard,
      canView: canViewBilling,
      hasDeepChildren: true,
    },
    {
      title: "Data Collection",
      description: "Manage data collection datasheets and analysis",
      href: "/data-collection",
      icon: BarChart3,
      canView: canViewDataCollection,
      hasDeepChildren: true,
    },
    {
      title: "Signatures Caregiver",
      description: "Configure caregiver confirmation method for Progress Notes",
      href: "/my-company/signatures-caregiver",
      icon: FileSignature,
      canView: canViewSignaturesCaregiver,
      hasDeepChildren: false,
    },
    {
      title: "Template Documents",
      description: "Manage document templates for notes and reports",
      href: "/template-documents",
      icon: FileText,
      canView: canViewTemplateDocuments,
      hasDeepChildren: true,
    },
    {
      title: "Documents",
      description: "Manage clinical and HR documentation",
      href: "/my-company/documents",
      icon: FolderHeart,
      canView: canViewDocuments,
      hasDeepChildren: true,
    },
    {
      title: "Agreements",
      description: "View and manage company agreements",
      href: "/agreements",
      icon: FileCheck,
      canView: canViewAgreements,
      hasDeepChildren: false,
    },
    {
      title: "Applicants",
      description: "Manage job applicants and recruitment",
      href: "/applicants",
      icon: UserPlus,
      canView: canViewApplicants,
      hasDeepChildren: false,
    },
  ]

  const subModules = useMemo(() => {
    return allSubModules.filter(module => module.canView)
  }, [
    canViewRoles, 
    canViewAccountProfile, 
    canViewAddress, 
    canViewCredentials, 
    canViewPhysicians, 
    canViewServicePlans,
    canViewEvents,
    canViewBilling,
    canViewDataCollection,
    canViewSignaturesCaregiver,
    canViewTemplateDocuments,
    canViewDocuments,
    canViewAgreements,
    canViewApplicants,
  ])

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
            <Building2 className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
              My Company
            </h1>
            <p className="text-slate-600 mt-1">Manage your company settings and information</p>
          </div>
        </div>

        {subModules.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <Building2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No modules available</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              You don't have permission to access any company modules. Contact your administrator to request access.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {subModules.map((module) => {
                const IconComponent = module.icon
                return (
                  <Link
                    key={module.href}
                    href={module.href}
                    className="group block"
                  >
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 transition-all duration-200 hover:shadow-lg hover:border-[#037ECC]/30 hover:-translate-y-1 min-h-[220px] flex flex-col relative">
                      {module.hasDeepChildren && (
                        <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#037ECC]/10 flex items-center justify-center">
                          <ChevronRight className="h-3.5 w-3.5 text-[#037ECC]" />
                        </div>
                      )}
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
                        {module.hasDeepChildren ? "View Options" : "Configure"} →
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            <div className="mt-8 bg-gradient-to-br from-[#037ECC]/5 to-[#079CFB]/5 rounded-2xl border border-[#037ECC]/10 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Company Settings Hub</h3>
              <p className="text-slate-600 leading-relaxed">
                Configure all aspects of your company profile, from basic information to advanced settings. 
                {subModules.length > 1 
                  ? " Manage roles, billing, credentials, and more from this centralized hub."
                  : " Access the modules you have permission to manage."
                }
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
