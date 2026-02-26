"use client"

import { useState, useCallback, useEffect } from "react"
import { AlertTriangle, Clock, FileX2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { CustomTable } from "@/components/custom/CustomTable"
import { RequiredDocumentUploadModal } from "./RequiredDocumentUploadModal"
import { DocumentViewer } from "@/components/custom/DocumentViewer"
import { useClientDocuments } from "@/lib/modules/client-documents/hooks/use-client-documents"
import { useRequiredDocumentsTable } from "../../hooks/useRequiredDocumentsTable"
import { getClientDocumentUrl } from "@/lib/modules/client-documents/services/client-documents.service"
import type { ClientDocumentRow, SaveClientDocumentDto } from "@/lib/types/client-document.types"

interface AlertsConfig {
  pendingCount: number
  nearExpirationCount: number
  expiredCount: number
}

function RequiredDocumentsAlerts({ pendingCount, nearExpirationCount, expiredCount }: AlertsConfig) {
  const alerts = [
    {
      show: expiredCount > 0,
      icon: <FileX2 className="w-4 h-4" />,
      message:
        expiredCount === 1
          ? "1 document has expired. Please upload an updated version."
          : `${expiredCount} documents have expired. Please upload updated versions.`,
      className: "bg-red-50 border-red-200 text-red-700",
      iconClassName: "text-red-500",
    },
    {
      show: nearExpirationCount > 0,
      icon: <Clock className="w-4 h-4" />,
      message:
        nearExpirationCount === 1
          ? "1 document is expiring soon. Please update it before it expires."
          : `${nearExpirationCount} documents are expiring soon. Please update them before they expire.`,
      className: "bg-amber-50 border-amber-200 text-amber-700",
      iconClassName: "text-amber-500",
    },
    {
      show: pendingCount > 0,
      icon: <AlertTriangle className="w-4 h-4" />,
      message:
        pendingCount === 1
          ? "1 required document is pending. Please upload it."
          : `${pendingCount} required documents are pending. Please upload them.`,
      className: "bg-blue-50 border-blue-200 text-blue-700",
      iconClassName: "text-blue-500",
    },
  ].filter((a) => a.show)

  if (alerts.length === 0) return null

  return (
    <div className="space-y-2">
      {alerts.map((alert, idx) => (
        <div
          key={idx}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium",
            alert.className
          )}
        >
          <span className={alert.iconClassName}>{alert.icon}</span>
          {alert.message}
        </div>
      ))}
    </div>
  )
}

function RequiredDocumentsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-slate-100 rounded-xl w-2/3" />
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-14 bg-slate-100 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

interface RequiredDocumentsOverviewProps {
  isActive: boolean
  clientId: string | null
  onAlertCountChange?: (count: number) => void
}

export function RequiredDocumentsOverview({
  isActive,
  clientId,
  onAlertCountChange,
}: RequiredDocumentsOverviewProps) {
  const [hasLoaded, setHasLoaded] = useState(false)
  const [editingRow, setEditingRow] = useState<ClientDocumentRow | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<{ url: string; name: string } | null>(null)
  const [loadingDocumentId, setLoadingDocumentId] = useState<string | null>(null)

  const { rows, isLoading, isSaving, error, alertCount, save } = useClientDocuments(
    clientId,
    isActive
  )

  useEffect(() => {
    onAlertCountChange?.(alertCount)
  }, [alertCount, onAlertCountChange])

  useEffect(() => {
    if (!isActive) {
      setHasLoaded(false)
      return
    }
    if (!isLoading) setHasLoaded(true)
  }, [isActive, isLoading])

  const handleEdit = useCallback((row: ClientDocumentRow) => {
    setEditingRow(row)
    setIsModalOpen(true)
  }, [])

  const handleDownload = useCallback((row: ClientDocumentRow) => {
    if (row.fileUrl) window.open(row.fileUrl, "_blank", "noopener,noreferrer")
  }, [])

  const handleViewDocument = useCallback(async (row: ClientDocumentRow) => {
    if (!row.clientDocumentId) return
    try {
      setLoadingDocumentId(row.clientDocumentId)
      const url = await getClientDocumentUrl(row.clientDocumentId)
      setSelectedDocument({
        url,
        name: row.documentConfigName,
      })
    } catch (err) {
      console.error("Error fetching document:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to load document"
      toast.error(errorMessage)
    } finally {
      setLoadingDocumentId(null)
    }
  }, [])

  const handleCloseViewer = useCallback(() => {
    setSelectedDocument(null)
  }, [])

  const handleModalSave = useCallback(
    async (data: {
      issuedDate: string | null
      expirationDate: string | null
      comments: string | null
      fileBase64: string | null
      fileName: string | null
    }) => {
      if (!editingRow || !clientId) return
      
      const dto: SaveClientDocumentDto = {
        clientId,
        documentConfigId: editingRow.documentConfigId,
        issuedDate: data.issuedDate || null,
        expirationDate: data.expirationDate || null,
        comments: data.comments || null,
      }
      
      if (data.fileBase64 && data.fileName) {
        dto.fileBase64 = data.fileBase64
        dto.fileName = data.fileName
      }
      
      const success = await save(dto)
      if (success) setIsModalOpen(false)
    },
    [editingRow, clientId, save]
  )

  const { columns } = useRequiredDocumentsTable({
    onEdit: handleEdit,
    onDownload: handleDownload,
    onView: handleViewDocument,
    loadingDocumentId,
  })

  const pendingCount = rows.filter((r) => r.allowStatus && r.status === "PENDING").length
  const nearExpirationCount = rows.filter((r) => r.allowStatus && r.status === "NEAR_EXPIRATION").length
  const expiredCount = rows.filter((r) => r.allowStatus && r.status === "EXPIRED").length

  if (isActive && !hasLoaded && isLoading) {
    return <RequiredDocumentsSkeleton />
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-600 font-medium">Error loading required documents</p>
        <p className="text-red-500 text-sm mt-1">{error.message}</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <RequiredDocumentsAlerts
          pendingCount={pendingCount}
          nearExpirationCount={nearExpirationCount}
          expiredCount={expiredCount}
        />

        <CustomTable<ClientDocumentRow>
          columns={columns}
          data={rows}
          isLoading={isLoading}
          emptyMessage="No required documents configured"
          emptyContent={
            <div className="text-center py-8">
              <p className="text-base font-semibold text-gray-800">
                No required documents configured
              </p>
              <p className="mt-1 text-sm text-gray-500">
                No required documents have been configured for this client yet.
              </p>
            </div>
          }
          getRowKey={(row) => row.documentConfigId}
        />
      </div>

      <RequiredDocumentUploadModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        row={editingRow}
        isSaving={isSaving}
        onSave={handleModalSave}
      />

      {selectedDocument && (
        <DocumentViewer
          open={!!selectedDocument}
          onClose={handleCloseViewer}
          documentUrl={selectedDocument.url}
          fileName={selectedDocument.name}
        />
      )}
    </>
  )
}
