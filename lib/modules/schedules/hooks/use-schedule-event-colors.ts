"use client"

import { useEffect, useState } from "react"
import type { EventType } from "@/lib/types/appointment.types"
import { getAppointmentConfig } from "@/lib/modules/appointment-config/services/appointment-config.service"
import { getServicePlanConfig } from "@/lib/modules/service-plan-config/services/service-plan-config.service"
import { getSupervisionConfig } from "@/lib/modules/supervision-config/services/supervision-config.service"

const DEFAULT_COLORS: Record<EventType, string> = {
  session_note: "#037ECC",
  service_plan: "#079CFB",
  supervision: "#6366f1",
}

export function useScheduleEventColors() {
  const [colors, setColors] = useState<Record<EventType, string>>(DEFAULT_COLORS)

  useEffect(() => {
    let cancelled = false

    void Promise.all([
      getAppointmentConfig(),
      getServicePlanConfig(),
      getSupervisionConfig(),
    ])
      .then(([appointmentConfig, servicePlanConfig, supervisionConfig]) => {
        if (cancelled) return
        setColors({
          session_note: appointmentConfig?.color || DEFAULT_COLORS.session_note,
          service_plan: servicePlanConfig?.color || DEFAULT_COLORS.service_plan,
          supervision: supervisionConfig?.color || DEFAULT_COLORS.supervision,
        })
      })
      .catch(() => {
        if (!cancelled) setColors(DEFAULT_COLORS)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return colors
}
