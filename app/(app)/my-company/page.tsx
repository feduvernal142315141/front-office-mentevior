"use client"

import { Building2, Shield, UserCircle, MapPin, CreditCard, Award, Calendar, Stethoscope, FileText } from "lucide-react"
import Link from "next/link"

export default function MyCompanyPage() {
  const subModules = [
    {
      title: "Roles",
      description: "Manage user roles and permissions",
      href: "/roles",
      icon: Shield,
    },
    {
      title: "Account Profile",
      description: "Update company account information",
      href: "/my-company/account-profile",
      icon: UserCircle,
    },
    {
      title: "Address",
      description: "Manage locations and addresses",
      href: "/my-company/address",
      icon: MapPin,
    },
    {
      title: "Billing",
      description: "Handle billing and payment settings",
      href: "/my-company/billing",
      icon: CreditCard,
    },
    {
      title: "Credentials",
      description: "Manage professional credentials",
      href: "/my-company/credentials",
      icon: Award,
    },
    {
      title: "Events",
      description: "Track company events and activities",
      href: "/my-company/events",
      icon: Calendar,
    },
    {
      title: "Physicians",
      description: "Manage physician information",
      href: "/my-company/physicians",
      icon: Stethoscope,
    },
    {
      title: "Service Plans",
      description: "Configure service plan offerings",
      href: "/my-company/service-plans",
      icon: FileText,
    },
  ]

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {subModules.map((module) => {
            const IconComponent = module.icon
            return (
              <Link
                key={module.href}
                href={module.href}
                className="group block"
              >
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 transition-all duration-200 hover:shadow-lg hover:border-[#037ECC]/30 hover:-translate-y-1 min-h-[220px] flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-fit p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20 mb-4">
                      <IconComponent className="h-6 w-6 text-[#037ECC]" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-[#037ECC] transition-colors">
                      {module.title}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 flex-1 leading-relaxed">
                    {module.description}
                  </p>
                  <div className="mt-4 flex items-center text-sm font-medium text-[#037ECC] group-hover:translate-x-1 transition-transform pt-2 border-t border-slate-100">
                    Configure →
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
            Manage roles, billing, credentials, and more from this centralized hub.
          </p>
        </div>
      </div>
    </div>
  )
}
