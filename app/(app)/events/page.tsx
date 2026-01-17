"use client"

import { Calendar, CalendarCheck, FileText, Users } from "lucide-react"
import Link from "next/link"
import { usePermission } from "@/lib/hooks/use-permission"
import { PermissionModule } from "@/lib/utils/permissions-new"
import { useMemo } from "react"

export default function EventsPage() {
  const { view } = usePermission()
  
  const allSubModules = [
    {
      title: "Appointment",
      description: "Schedule and manage client appointments",
      href: "/events/appointment",
      icon: CalendarCheck,
      module: PermissionModule.APPOINTMENT,
    },
    {
      title: "Service Plan",
      description: "Configure service delivery plans",
      href: "/events/service-plan",
      icon: FileText,
      module: PermissionModule.SERVICE_PLAN,
    },
    {
      title: "Supervision",
      description: "Coordinate supervision sessions",
      href: "/events/supervision",
      icon: Users,
      module: PermissionModule.SUPERVISION,
    },
  ]
  
  const subModules = useMemo(() => {
    return allSubModules.filter(module => view(module.module))
  }, [view])

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
            <Calendar className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
              Events
            </h1>
            <p className="text-slate-600 mt-1">Manage company events and scheduling</p>
          </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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


        <div className="mt-8 bg-gradient-to-br from-[#037ECC]/5 to-[#079CFB]/5 rounded-2xl border border-[#037ECC]/10 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">About Events</h3>
          <p className="text-slate-600 leading-relaxed">
            Coordinate all event-related activities including appointments, service planning, and supervision sessions. 
            Streamline scheduling and ensure efficient event management across your organization.
          </p>
        </div>
      </div>
    </div>
  )
}
