"use client"

import { useCallback, useState } from "react"
import { buildFilters } from "@/lib/utils/query-filters"
import type { ReportMonth } from "@/lib/utils/report-month"
import type { CaseSupervisionLogListItem } from "@/lib/types/case-supervision-log.types"
import {
  createCaseSupervisionLog,
  getCaseSupervisionLogs,
} from "../services/case-supervision-log.service"
import { clientFilter, monthEqualsFilter, providerFilter } from "../utils/filters"
import { toReportDate } from "../utils/month-year"

interface CreateParams {
  clientId: string
  providerId: string
  /** `yyyyMM` */
  reportMonth: ReportMonth
}

interface UseCreateCaseSupervisionLogReturn {
  create: (params: CreateParams) => Promise<string>
  findExisting: (params: CreateParams) => Promise<CaseSupervisionLogListItem | null>
  isCreating: boolean
  isCheckingDuplicate: boolean
}

export function useCreateCaseSupervisionLog(): UseCreateCaseSupervisionLogReturn {
  const [isCreating, setIsCreating] = useState(false)
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false)

  /**
   * Busca un reporte ya existente para el mismo trío.
   *
   * Existe porque **no hay update ni delete**: si el backend permite duplicados,
   * un segundo reporte del mismo período queda para siempre y no hay forma de
   * limpiarlo desde la app. Preguntar antes cuesta una request.
   *
   * Es un rodeo que desaparece solo el día que el backend valide el duplicado
   * (§5 de `docs/case-supervision-log-backend.md`). Si la consulta falla no se
   * bloquea la creación: es una cortesía, no una validación.
   */
  const findExisting = useCallback(
    async ({ clientId, providerId, reportMonth }: CreateParams) => {
      setIsCheckingDuplicate(true)
      try {
        const filters = buildFilters([
          clientFilter(clientId),
          providerFilter(providerId),
          monthEqualsFilter(reportMonth),
        ])

        const { items } = await getCaseSupervisionLogs({ page: 0, pageSize: 1, filters })
        return items[0] ?? null
      } catch (err) {
        console.warn("[case-supervision-log] duplicate check failed:", err)
        return null
      } finally {
        setIsCheckingDuplicate(false)
      }
    },
    [],
  )

  const create = useCallback(async ({ clientId, providerId, reportMonth }: CreateParams) => {
    setIsCreating(true)
    try {
      return await createCaseSupervisionLog({
        clientId,
        providerId,
        // El backend deriva mes y año de `date`; se manda el día 1 del período
        date: toReportDate(reportMonth),
      })
    } finally {
      setIsCreating(false)
    }
  }, [])

  return { create, findExisting, isCreating, isCheckingDuplicate }
}
