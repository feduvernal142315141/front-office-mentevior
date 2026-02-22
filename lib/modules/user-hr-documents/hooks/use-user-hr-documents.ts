"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import type {
  UserHRDocumentRow,
  UserHRDocumentStatus,
  SaveUserHRDocumentDto,
} from "@/lib/types/user-hr-document.types"
import {
  getUserHRDocuments,
  createUserHRDocument,
  updateUserHRDocument,
} from "../services/user-hr-documents.service"


const NEAR_EXPIRATION_DAYS = 30

function parseDateLocal(dateStr: string | null): Date | null {
  if (!dateStr) return null
  const [year, month, day] = dateStr.split("-").map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function daysUntilExpiration(dateStr: string | null): number | null {
  const expDate = parseDateLocal(dateStr)
  if (!expDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  expDate.setHours(0, 0, 0, 0)
  return Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function computeDocumentStatus(
  fileUrl: string | null,
  expirationDate: string | null
): UserHRDocumentStatus {
  if (!fileUrl) return "PENDING"
  const days = daysUntilExpiration(expirationDate)
  if (days === null) return "DELIVERED"
  if (days <= 0) return "EXPIRED"
  if (days <= NEAR_EXPIRATION_DAYS) return "NEAR_EXPIRATION"
  return "DELIVERED"
}


export interface UseUserHRDocumentsReturn {
  rows: UserHRDocumentRow[]
  isLoading: boolean
  isSaving: boolean
  error: Error | null
  alertCount: number
  save: (data: SaveUserHRDocumentDto) => Promise<boolean>
  refetch: () => Promise<void>
}


export function useUserHRDocuments(
  memberUserId: string | null,
  enabled: boolean
): UseUserHRDocumentsReturn {
  const [rows, setRows] = useState<UserHRDocumentRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const buildRows = useCallback(
    (userDocs: Awaited<ReturnType<typeof getUserHRDocuments>>): UserHRDocumentRow[] => {
      return userDocs.map((doc) => {
        const fileUrl = doc.fileUrl ?? null
        const expirationDate = doc.expirationDate ?? null
      
        const status = doc.allowStatus 
          ? (doc.status ?? computeDocumentStatus(fileUrl, expirationDate))
          : "PENDING"

        return {
          documentConfigId: doc.documentConfigId,
          documentConfigName: doc.documentConfigName,
          userDocumentId: doc.id,
          issuedDate: doc.issuedDate,
          expirationDate,
          fileUrl,
          fileName: doc.fileName,
          comments: doc.comments,
          status,
          allowIssuedDate: doc.allowIssuedDate,
          allowExpirationDate: doc.allowExpirationDate,
          allowUploadFile: doc.allowUploadFile,
          allowDownloadFile: doc.allowDownloadFile,
          allowStatus: doc.allowStatus,
        }
      })
    },
    []
  )

  const fetchAll = useCallback(async () => {
    if (!enabled || !memberUserId) {
      setRows([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const userDocs = await getUserHRDocuments(memberUserId)

      setRows(buildRows(userDocs))
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to fetch required document configuration")
      setError(errorObj)
      console.error("[useUserHRDocuments] fetchAll error:", errorObj)
    } finally {
      setIsLoading(false)
    }
  }, [memberUserId, enabled, buildRows])

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }
    fetchAll()
  }, [fetchAll, enabled])

  const save = useCallback(
    async (data: SaveUserHRDocumentDto): Promise<boolean> => {
      try {
        setIsSaving(true)
        
        const existingDoc = rows.find((r) => r.documentConfigId === data.documentConfigId)
        const isUpdate = Boolean(existingDoc?.userDocumentId)
        
        if (isUpdate) {
          if (!existingDoc?.userDocumentId) {
            throw new Error("User document ID is required for update")
          }
          await updateUserHRDocument(existingDoc.userDocumentId, data)
          toast.success("Document updated successfully.")
        } else {
          await createUserHRDocument(data)
          toast.success("Document created successfully.")
        }
        
        await fetchAll()
        return true
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error("Failed to save document")
        toast.error(errorObj.message)
        return false
      } finally {
        setIsSaving(false)
      }
    },
    [fetchAll, rows]
  )

  const alertCount = rows.filter(
    (r) => r.allowStatus && (r.status === "PENDING" || r.status === "NEAR_EXPIRATION" || r.status === "EXPIRED")
  ).length

  return {
    rows,
    isLoading,
    isSaving,
    error,
    alertCount,
    save,
    refetch: fetchAll,
  }
}
