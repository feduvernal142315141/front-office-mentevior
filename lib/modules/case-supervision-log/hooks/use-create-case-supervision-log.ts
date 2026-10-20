"use client"

import { useCallback, useState } from "react"
import type { ReportMonth } from "@/lib/utils/report-month"
import type {
  CaseSupervisionManualEntryInput,
} from "@/lib/types/case-supervision-log.types"
import { createCaseSupervisionLog } from "../services/case-supervision-log.service"
import { toReportDate } from "../utils/month-year"

interface CreateParams {
  clientId: string
  providerId: string
  /** `yyyyMM` */
  reportMonth: ReportMonth
  withoutAppointments?: CaseSupervisionManualEntryInput[]
}

interface UseCreateCaseSupervisionLogReturn {
  create: (params: CreateParams) => Promise<string>
  isCreating: boolean
}

export function useCreateCaseSupervisionLog(): UseCreateCaseSupervisionLogReturn {
  const [isCreating, setIsCreating] = useState(false)

  const create = useCallback(async ({ clientId, providerId, reportMonth, withoutAppointments }: CreateParams) => {
    setIsCreating(true)
    try {
      return await createCaseSupervisionLog({
        clientId,
        providerId,
        // El backend deriva mes y año de `date`; se manda el día 1 del período
        date: toReportDate(reportMonth),
        withoutAppointments: withoutAppointments ?? [],
      })
    } finally {
      setIsCreating(false)
    }
  }, [])

  return { create, isCreating }
}
