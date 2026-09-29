import type { QueryModel } from "@/lib/models/queryModel"

export type AuditLogAction = "Create" | "Update" | "Delete" | string
export type AuditLogMember = "Usuario" | "Sistema" | string

export interface AuditLogChange {
  fieldName: string
  oldValue: unknown
  newValue: unknown
}

export interface AuditLog {
  id: string
  createAt: string | null
  createBy: string | null
  companyId: string | null
  entityId: string | null
  entityClass: string | null
  entityChanges: string | null
  action: AuditLogAction | null
  actionType: string | null
  description: string | null
  logMember: AuditLogMember | null
}

export interface AuditLogListItem extends AuditLog {
  changes: AuditLogChange[]
}

export interface AuditLogsCursorResponse {
  entities: AuditLog[]
  hasNext: boolean
  nextCursorCreatedAt: string | null
  nextCursorId: string | null
  pageSize: number
}

export interface AuditLogsResult {
  entities: AuditLogListItem[]
  hasNext: boolean
  nextCursorCreatedAt: string | null
  nextCursorId: string | null
  pageSize: number
}

export interface AuditLogsQuery extends Omit<QueryModel, "page"> {
  page?: number
  cursorCreatedAt?: string | null
  cursorId?: string | null
}

