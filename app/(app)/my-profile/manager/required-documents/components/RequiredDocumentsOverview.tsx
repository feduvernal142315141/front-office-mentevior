"use client"

import { useState, useCallback, useEffect } from "react"
import { AlertTriangle, Clock, FileX2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { CustomTable } from "@/components/custom/CustomTable"
import { RequiredDocumentUploadModal } from "./RequiredDocumentUploadModal"
import { DocumentViewer } from "@/components/custom/DocumentViewer"
import { useUserHRDocuments } from "@/lib/modules/user-hr-documents/hooks/use-user-hr-documents"
import { useRequiredDocumentsTable } from "../hooks/useRequiredDocumentsTable"
import { getUserDocumentUrl } from "@/lib/modules/user-hr-documents/services/user-hr-documents.service"
import type { UserHRDocumentRow, SaveUserHRDocumentDto } from "@/lib/types/user-hr-document.types"

// ---------------------------------------------------------------------------
// Alerts banner — mirrors the AlertsBanner pattern from Credentials tab
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface RequiredDocumentsOverviewProps {
  isActive: boolean
  memberUserId: string | null
  /** Called each time alertCount changes so the parent tab can show the badge */
  onAlertCountChange?: (count: number) => void
}

export function RequiredDocumentsOverview({
  isActive,
  memberUserId,
  onAlertCountChange,
}: RequiredDocumentsOverviewProps) {
  const [hasLoaded, setHasLoaded] = useState(false)
  const [editingRow, setEditingRow] = useState<UserHRDocumentRow | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<{ url: string; name: string } | null>(null)
  const [loadingDocumentId, setLoadingDocumentId] = useState<string | null>(null)

  const { rows, isLoading, isSaving, error, alertCount, save } = useUserHRDocuments(
    memberUserId,
    isActive
  )

  // Notify parent about alert count so it can show the badge on the tab
  useEffect(() => {
    onAlertCountChange?.(alertCount)
  }, [alertCount, onAlertCountChange])

  // Track first load to avoid flashing skeleton on tab switch
  useEffect(() => {
    if (!isActive) {
      setHasLoaded(false)
      return
    }
    if (!isLoading) setHasLoaded(true)
  }, [isActive, isLoading])

  const handleEdit = useCallback((row: UserHRDocumentRow) => {
    setEditingRow(row)
    setIsModalOpen(true)
  }, [])

  const handleDownload = useCallback((row: UserHRDocumentRow) => {
    if (row.fileUrl) window.open(row.fileUrl, "_blank", "noopener,noreferrer")
  }, [])

  const handleViewDocument = useCallback(async (row: UserHRDocumentRow) => {
    if (!row.userDocumentId) return
    try {
      setLoadingDocumentId(row.userDocumentId)
      const url = await getUserDocumentUrl(row.userDocumentId)
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
      if (!editingRow || !memberUserId) return
      
      // Build DTO - only include file fields if a new file was uploaded
      const dto: SaveUserHRDocumentDto = {
        memberUserId,
        documentConfigId: editingRow.documentConfigId,
        issuedDate: data.issuedDate || null,
        expirationDate: data.expirationDate || null,
        comments: data.comments || null,
      }
      
      // Only include file fields if there's actually a new file
      if (data.fileBase64 && data.fileName) {
        dto.fileBase64 = data.fileBase64
        dto.fileName = data.fileName
      }
      
      const success = await save(dto)
      if (success) setIsModalOpen(false)
    },
    [editingRow, memberUserId, save]
  )

  const { columns } = useRequiredDocumentsTable({
    onEdit: handleEdit,
    onDownload: handleDownload,
    onView: handleViewDocument,
    loadingDocumentId,
  })

  // Derived alert counts for the banner
  const pendingCount = rows.filter((r) => r.status === "PENDING").length
  const nearExpirationCount = rows.filter((r) => r.status === "NEAR_EXPIRATION").length
  const expiredCount = rows.filter((r) => r.status === "EXPIRED").length

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
        {/* Alert banners */}
        <RequiredDocumentsAlerts
          pendingCount={pendingCount}
          nearExpirationCount={nearExpirationCount}
          expiredCount={expiredCount}
        />

        {/* Table */}
        <CustomTable<UserHRDocumentRow>
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
                HR hasn&apos;t configured any required documents for your profile yet.
              </p>
            </div>
          }
          getRowKey={(row) => row.documentConfigId}
        />
      </div>

      {/* Upload / Edit modal */}
      <RequiredDocumentUploadModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        row={editingRow}
        isSaving={isSaving}
        onSave={handleModalSave}
      />

      {/* Document viewer modal */}
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
