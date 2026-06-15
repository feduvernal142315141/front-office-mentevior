"use client"

import { CalendarCheck } from "lucide-react"
import { useAppointmentConfig } from "@/lib/modules/appointment-config/hooks/use-appointment-config"
import { AppointmentConfigForm } from "./components/AppointmentConfigForm"
import { AppointmentConfigSkeleton } from "./components/AppointmentConfigSkeleton"

export default function AppointmentPage() {
  const { config, isLoading } = useAppointmentConfig()

  if (isLoading) {
    return <AppointmentConfigSkeleton />
  }

  return (
    <div className="bg-gray-50/50 p-6 pb-28">
      <div className="mx-auto max-w-5xl xl:max-w-6xl">
        <div className="mb-6 flex items-center gap-4">
          <div className="rounded-xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 p-3">
            <CalendarCheck className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-3xl font-bold text-transparent">
              Appointment
            </h1>
            <p className="mt-1 text-slate-600">Schedule and manage client appointments</p>
          </div>
        </div>

        <AppointmentConfigForm config={config} />
      </div>
    </div>
  )
}
