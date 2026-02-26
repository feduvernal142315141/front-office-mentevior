"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import type {
  ClientDocumentRow,
  ClientDocumentStatus,
  SaveClientDocumentDto,
} from "@/lib/types/client-document.types"
import {
  getClientDocuments,
  createClientDocument,
  updateClientDocument,
} from "../services/client-documents.service"

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
): ClientDocumentStatus {
  if (!fileUrl) return "PENDING"
  const days = daysUntilExpiration(expirationDate)
  if (days === null) return "DELIVERED"
  if (days <= 0) return "EXPIRED"
  if (days <= NEAR_EXPIRATION_DAYS) return "NEAR_EXPIRATION"
  return "DELIVERED"
}

export interface UseClientDocumentsReturn {
  rows: ClientDocumentRow[]
  isLoading: boolean
  isSaving: boolean
  error: Error | null
  alertCount: number
  save: (data: SaveClientDocumentDto) => Promise<boolean>
  refetch: () => Promise<void>
}

export function useClientDocuments(
  clientId: string | null,
  enabled: boolean
): UseClientDocumentsReturn {
  const [rows, setRows] = useState<ClientDocumentRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const buildRows = useCallback(
    (clientDocs: Awaited<ReturnType<typeof getClientDocuments>>): ClientDocumentRow[] => {
      return clientDocs.map((doc) => {
        const fileUrl = doc.fileUrl ?? null
        const expirationDate = doc.expirationDate ?? null
      
        const status = doc.allowStatus 
          ? (doc.status ?? computeDocumentStatus(fileUrl, expirationDate))
          : "PENDING"

        return {
          documentConfigId: doc.documentConfigId,
          documentConfigName: doc.documentConfigName,
          clientDocumentId: doc.id,
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
    if (!enabled || !clientId) {
      setRows([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const clientDocs = await getClientDocuments(clientId)

      setRows(buildRows(clientDocs))
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to fetch required document configuration")
      setError(errorObj)
      console.error("[useClientDocuments] fetchAll error:", errorObj)
    } finally {
      setIsLoading(false)
    }
  }, [clientId, enabled, buildRows])

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }
    fetchAll()
  }, [fetchAll, enabled])

  const save = useCallback(
    async (data: SaveClientDocumentDto): Promise<boolean> => {
      try {
        setIsSaving(true)
        
        if (!clientId) {
          throw new Error("Client ID is required")
        }
        
        const existingDoc = rows.find((r) => r.documentConfigId === data.documentConfigId)
        const isUpdate = Boolean(existingDoc?.clientDocumentId)
        
        if (isUpdate) {
          if (!existingDoc?.clientDocumentId) {
            throw new Error("Client document ID is required for update")
          }
          await updateClientDocument(existingDoc.clientDocumentId, data)
          toast.success("Document updated successfully.")
        } else {
          await createClientDocument(clientId, data)
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
    [fetchAll, rows, clientId]
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
