import qs from "qs"
import { serviceGet } from "@/lib/services/baseService"
import { getApiErrorMessage } from "@/lib/utils/api-error-message"
import type {
  AuditLog,
  AuditLogAction,
  AuditLogChange,
  AuditLogListItem,
  AuditLogsCursorResponse,
  AuditLogsQuery,
  AuditLogsResult,
} from "@/lib/types/audit-log.types"

const DEFAULT_PAGE_SIZE = 25

function buildAuditLogsQueryString(query?: AuditLogsQuery): string {
  const payload: Record<string, unknown> = {
    pageSize: query?.pageSize ?? DEFAULT_PAGE_SIZE,
  }

  if (typeof query?.page === "number") payload.page = query.page
  if (query?.cursorCreatedAt) payload.cursorCreatedAt = query.cursorCreatedAt
  if (query?.cursorId) payload.cursorId = query.cursorId
  if (query?.filters?.length) payload.filters = query.filters
  if (query?.orders?.length) payload.orders = query.orders

  return qs.stringify(payload, { arrayFormat: "comma", encode: false })
}

function parseAuditLogChanges(entityChanges: string | null): AuditLogChange[] {
  if (!entityChanges) return []

  try {
    const parsed = JSON.parse(entityChanges) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
      .map((entry) => ({
        fieldName: String(entry.fieldName ?? entry.field ?? entry.name ?? ""),
        oldValue: entry.oldValue ?? entry.previousValue ?? null,
        newValue: entry.newValue ?? entry.currentValue ?? null,
      }))
      .filter((entry) => entry.fieldName.trim().length > 0)
  } catch {
    return []
  }
}

function normalizeAuditLog(log: AuditLog): AuditLogListItem {
  return {
    ...log,
    changes: parseAuditLogChanges(log.entityChanges),
  }
}

export function getAuditLogActionLabel(action: AuditLogAction | null): string {
  switch (action) {
    case "Create":
      return "CREATE"
    case "Update":
      return "EDIT"
    case "Delete":
      return "DELETE"
    default:
      return action?.trim().toUpperCase() || "NO ACTION"
  }
}

export async function getAuditLogsByEntityId(
  entityId: string,
  query?: AuditLogsQuery
): Promise<AuditLogsResult> {
  const queryString = buildAuditLogsQueryString(query)
  const response = await serviceGet<AuditLogsCursorResponse>(
    `/audit-logs/${entityId}${queryString ? `?${queryString}` : ""}`
  )

  if (response.status !== 200 || !response.data) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to fetch audit logs"))
  }

  const data = response.data as unknown as AuditLogsCursorResponse
  const entities = Array.isArray(data.entities) ? data.entities.map(normalizeAuditLog) : []

  return {
    entities,
    hasNext: Boolean(data.hasNext),
    nextCursorCreatedAt: data.nextCursorCreatedAt ?? null,
    nextCursorId: data.nextCursorId ?? null,
    pageSize: data.pageSize ?? query?.pageSize ?? DEFAULT_PAGE_SIZE,
  }
}
