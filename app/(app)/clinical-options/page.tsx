"use client"

import { useMemo } from "react"
import Link from "next/link"
import {
  CalendarCheck,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  Hospital,
  NotebookPen,
  Stethoscope,
  UserCog,
  Users,
} from "lucide-react"
import { useCanViewModule } from "@/lib/hooks/use-filtered-nav-items"

/**
 * Clinical Options — hub de los módulos clínicos del día a día.
 *
 * Mismo patrón que Company Configuration: padre visual sin permiso propio, que
 * lista las tarjetas de los hijos a los que el usuario sí tiene acceso. Los
 * hijos conservan sus rutas originales, así que ningún enlace existente cambia.
 */
export default function ClinicalOptionsPage() {
  const canViewClients = useCanViewModule("/clients")
  const canViewUsers = useCanViewModule("/users")
  const canViewSessionNote = useCanViewModule("/session-note")
  const canViewSchedules = useCanViewModule("/schedules")
  const canViewClinicalMonthly = useCanViewModule("/clinical-monthly")
  const canViewMonthlySupervisions = useCanViewModule("/monthly-supervisions")
  const canViewServiceLog = useCanViewModule("/service-log")
  const canViewAssessment = useCanViewModule("/assessment")

  const modules = useMemo(
    () =>
      [
        {
          title: "Clients",
          description: "Manage client profiles, service plans and documentation",
          href: "/clients",
          icon: Users,
          canView: canViewClients,
        },
        {
          title: "Users/Providers",
          description: "Manage staff, credentials and provider assignments",
          href: "/users",
          icon: UserCog,
          canView: canViewUsers,
        },
        {
          title: "Session Note",
          description: "Document session details and interventions",
          href: "/session-note",
          icon: NotebookPen,
          canView: canViewSessionNote,
        },
        {
          title: "Schedules",
          description: "Plan and review appointments across the team",
          href: "/schedules",
          icon: CalendarCheck,
          canView: canViewSchedules,
        },
        {
          title: "Clinical Monthly",
          description: "Manage monthly clinical reports",
          href: "/clinical-monthly",
          icon: Hospital,
          canView: canViewClinicalMonthly,
        },
        {
          title: "Monthly Supervisions",
          description: "Track and document monthly supervisions",
          href: "/monthly-supervisions",
          icon: CalendarClock,
          canView: canViewMonthlySupervisions,
        },
        {
          title: "Service Log",
          description: "Review the log of delivered services",
          href: "/service-log",
          icon: ClipboardList,
          canView: canViewServiceLog,
        },
        {
          title: "Assessment",
          description: "Create and manage client assessments",
          href: "/assessment",
          icon: ClipboardCheck,
          canView: canViewAssessment,
        },
      ].filter((module) => module.canView),
    [
      canViewClients,
      canViewUsers,
      canViewSessionNote,
      canViewSchedules,
      canViewClinicalMonthly,
      canViewMonthlySupervisions,
      canViewServiceLog,
      canViewAssessment,
    ],
  )

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center gap-4">
          <div className="rounded-xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 p-3">
            <Stethoscope className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-3xl font-bold text-transparent">
              Clinical Options
            </h1>
            <p className="mt-1 text-slate-600">Everything you need for day-to-day clinical work</p>
          </div>
        </div>

        {modules.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <Stethoscope className="mx-auto mb-4 h-16 w-16 text-slate-300" />
            <h3 className="mb-2 text-xl font-semibold text-slate-700">No modules available</h3>
            <p className="mx-auto max-w-md text-slate-500">
              You don&apos;t have permission to access any clinical modules. Contact your administrator to
              request access.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {modules.map((module) => {
              const IconComponent = module.icon
              return (
                <Link key={module.href} href={module.href} className="group block">
                  <div className="relative flex min-h-[220px] flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#037ECC]/30 hover:shadow-lg">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="mb-4 w-fit rounded-xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 p-3">
                        <IconComponent className="h-6 w-6 text-[#037ECC]" />
                      </div>
                      <h3 className="mb-2 pr-8 text-lg font-semibold text-slate-800 transition-colors group-hover:text-[#037ECC]">
                        {module.title}
                      </h3>
                    </div>
                    <p className="flex-1 text-sm leading-relaxed text-slate-600">{module.description}</p>
                    <div className="mt-4 flex items-center border-t border-slate-100 pt-2 text-sm font-medium text-[#037ECC] transition-transform group-hover:translate-x-1">
                      Open →
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
