"use client"

import { useCallback, useEffect, useState } from "react"
import {
  getAuditLogsByEntityId,
  getAuditLogsByEntityName,
} from "@/lib/modules/audit/services/audit-logs.service"
import type { AuditLogListItem } from "@/lib/types/audit-log.types"

interface UseAuditLogsOptions {
  entityId?: string | null
  entityName?: string | null
  enabled?: boolean
  pageSize?: number
  filters?: string[]
  orders?: string[]
}

interface AuditLogsCursorState {
  hasNext: boolean
  nextCursorCreatedAt: string | null
  nextCursorId: string | null
}

export function useAuditLogs({
  entityId,
  entityName,
  enabled = true,
  pageSize = 25,
  filters,
  orders,
}: UseAuditLogsOptions) {
  const [logs, setLogs] = useState<AuditLogListItem[]>([])
  const [cursor, setCursor] = useState<AuditLogsCursorState>({
    hasNext: false,
    nextCursorCreatedAt: null,
    nextCursorId: null,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadFirstPage = useCallback(async () => {
    const hasTarget = Boolean(entityId || entityName)

    if (!hasTarget || !enabled) {
      setLogs([])
      setCursor({ hasNext: false, nextCursorCreatedAt: null, nextCursorId: null })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const query = { pageSize, filters, orders }
      const result = entityName
        ? await getAuditLogsByEntityName(entityName, query)
        : await getAuditLogsByEntityId(entityId as string, query)

      setLogs(result.entities)
      setCursor({
        hasNext: result.hasNext,
        nextCursorCreatedAt: result.nextCursorCreatedAt,
        nextCursorId: result.nextCursorId,
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch audit logs"))
      setLogs([])
      setCursor({ hasNext: false, nextCursorCreatedAt: null, nextCursorId: null })
    } finally {
      setIsLoading(false)
    }
  }, [enabled, entityId, entityName, filters, orders, pageSize])

  const loadMore = useCallback(async () => {
    if (
      (!entityId && !entityName) ||
      !enabled ||
      !cursor.hasNext ||
      !cursor.nextCursorCreatedAt ||
      !cursor.nextCursorId ||
      isLoadingMore
    ) {
      return
    }

    setIsLoadingMore(true)
    setError(null)

    try {
      const query = {
        pageSize,
        filters,
        orders,
        cursorCreatedAt: cursor.nextCursorCreatedAt,
        cursorId: cursor.nextCursorId,
      }
      const result = entityName
        ? await getAuditLogsByEntityName(entityName, query)
        : await getAuditLogsByEntityId(entityId as string, query)

      setLogs((prev) => [...prev, ...result.entities])
      setCursor({
        hasNext: result.hasNext,
        nextCursorCreatedAt: result.nextCursorCreatedAt,
        nextCursorId: result.nextCursorId,
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch audit logs"))
    } finally {
      setIsLoadingMore(false)
    }
  }, [
    cursor.hasNext,
    cursor.nextCursorCreatedAt,
    cursor.nextCursorId,
    enabled,
    entityId,
    entityName,
    filters,
    isLoadingMore,
    orders,
    pageSize,
  ])

  useEffect(() => {
    void loadFirstPage()
  }, [loadFirstPage])

  return {
    logs,
    hasNext: cursor.hasNext,
    isLoading,
    isLoadingMore,
    error,
    refresh: loadFirstPage,
    loadMore,
  }
}
