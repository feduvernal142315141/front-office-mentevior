"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import {
  FileText, Upload, X, AlertCircle, File,
  Plus, RefreshCw, Save, Loader2, Eye,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { parseDate, dateToISO } from "@/lib/utils/date"
import { CustomModal } from "@/components/custom/CustomModal"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import { Button } from "@/components/custom/Button"
import { DocumentViewer } from "@/components/custom/DocumentViewer"
import type { ClientDocumentRow } from "@/lib/types/client-document.types"
import { getClientDocumentUrl } from "@/lib/modules/client-documents/services/client-documents.service"
import { addMonths, addYears } from "date-fns"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_SIZE_MB = 25

// Quick-add buttons: label → offset function applied to issuedDate
const QUICK_OFFSETS = [
  { label: "+1 month",  apply: (d: Date) => addMonths(d, 1)  },
  { label: "+6 months", apply: (d: Date) => addMonths(d, 6)  },
  { label: "+1 year",   apply: (d: Date) => addYears(d, 1)   },
  { label: "+2 years",  apply: (d: Date) => addYears(d, 2)   },
  { label: "+3 years",  apply: (d: Date) => addYears(d, 3)   },
  { label: "+4 years",  apply: (d: Date) => addYears(d, 4)   },
  { label: "+5 years",  apply: (d: Date) => addYears(d, 5)   },
]

function detectQuickOffset(issuedDateStr: string, expirationDateStr: string): string | null {
  const issuedDate = parseDate(issuedDateStr)
  const expirationDate = parseDate(expirationDateStr)
  
  if (!issuedDate || !expirationDate) return null
  
  for (const offset of QUICK_OFFSETS) {
    const calculatedDate = offset.apply(issuedDate)
    const calculatedISO = dateToISO(calculatedDate)
    if (calculatedISO === expirationDateStr) {
      return offset.label
    }
  }
  
  return null
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UploadModalFormState {
  issuedDate: string
  expirationDate: string
  comments: string
  /** Newly selected file (not yet saved) */
  newFile: File | null
  newFileBase64: string | null
  /** Whether the user explicitly removed the existing server file */
  removeExistingFile: boolean
}

export interface RequiredDocumentUploadModalSavePayload {
  issuedDate: string | null
  expirationDate: string | null
  comments: string | null
  fileBase64: string | null
  fileName: string | null
}

interface RequiredDocumentUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  row: ClientDocumentRow | null
  isSaving: boolean
  onSave: (data: RequiredDocumentUploadModalSavePayload) => Promise<void>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip "data:...;base64," — send only raw base64
      resolve(result.split(",")[1] ?? result)
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}



// ---------------------------------------------------------------------------
// Sub-component: file zone
// ---------------------------------------------------------------------------

interface FileZoneProps {
  documentName: string
  existingFileUrl: string | null
  existingFileName: string | null
  newFile: File | null
  removeExistingFile: boolean
  dragOver: boolean
  fileError: string | null
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void
  onBrowseClick: () => void
  onRemoveNew: () => void
  onRemoveExisting: () => void
  onUploadAnother: () => void
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onViewDocument: () => void
}

function FileZone({
  documentName,
  existingFileUrl,
  existingFileName,
  newFile,
  removeExistingFile,
  dragOver,
  fileError,
  fileInputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onBrowseClick,
  onRemoveNew,
  onRemoveExisting,
  onUploadAnother,
  onFileInputChange,
  onViewDocument,
}: FileZoneProps) {
  const hasExisting = Boolean(existingFileUrl) && !removeExistingFile

  return (
    <div className="space-y-3">

      {/* Existing file row */}
      {hasExisting && !newFile && (
        <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white">
          <div className="w-11 h-11 rounded-lg bg-[#037ECC]/10 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-[#037ECC]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-slate-900 truncate">
              {documentName}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Ready to save
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onViewDocument}
              className={cn(
                "w-9 h-9 rounded-lg",
                "flex items-center justify-center",
                "bg-slate-50 hover:bg-slate-100",
                "border border-slate-200",
                "text-slate-600 hover:text-slate-900",
                "transition-all duration-200"
              )}
              title="View document"
            >
              <Eye className="w-[18px] h-[18px]" />
            </button>
            <button
              type="button"
              onClick={onUploadAnother}
              className={cn(
                "w-9 h-9 rounded-lg",
                "flex items-center justify-center",
                "bg-slate-50 hover:bg-slate-100",
                "border border-slate-200",
                "text-slate-600 hover:text-slate-900",
                "transition-all duration-200"
              )}
              title="Change document"
            >
              <Upload className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      )}

      {/* New file selected preview */}
      {newFile && (
        <div className="flex items-center gap-4 p-4 rounded-xl border border-blue-200 bg-blue-50">
          <div className="w-11 h-11 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <File className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-slate-900 truncate">{documentName}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {newFile.name} • {(newFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            type="button"
            onClick={onRemoveNew}
            className={cn(
              "w-9 h-9 rounded-lg",
              "flex items-center justify-center",
              "bg-white hover:bg-slate-50",
              "border border-slate-200",
              "text-slate-400 hover:text-slate-600",
              "transition-all duration-200"
            )}
            title="Remove selected file"
          >
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>
      )}

      {/* Drop zone — shown when no existing file OR when upload another was clicked */}
      {!hasExisting && !newFile && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onBrowseClick}
          className={cn(
            "flex flex-col items-center justify-center",
            "gap-3 p-8 rounded-2xl border-2 border-dashed",
            "cursor-pointer transition-all duration-200",
            dragOver
              ? "border-[#037ECC] bg-[#037ECC]/5 scale-[1.01]"
              : "border-slate-200 hover:border-[#037ECC]/50 hover:bg-slate-50/70"
          )}
        >
          <div className="w-12 h-12 rounded-full bg-[#037ECC]/10 flex items-center justify-center">
            <Upload className="w-6 h-6 text-[#037ECC]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">
              Drop your file here or{" "}
              <span className="text-[#037ECC] hover:underline">browse</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              All file formats accepted — max {MAX_SIZE_MB}MB
            </p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={onFileInputChange}
      />

      {fileError && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {fileError}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main modal component
// ---------------------------------------------------------------------------

export function RequiredDocumentUploadModal({
  open,
  onOpenChange,
  row,
  isSaving,
  onSave,
}: RequiredDocumentUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [selectedQuickOffset, setSelectedQuickOffset] = useState<string | null>(null)
  const [fetchedFileUrl, setFetchedFileUrl] = useState<string | null>(null)
  const [loadingExistingFile, setLoadingExistingFile] = useState(false)
  const [viewerDocument, setViewerDocument] = useState<{ url: string; name: string } | null>(null)

  const [form, setForm] = useState<UploadModalFormState>({
    issuedDate: "",
    expirationDate: "",
    comments: "",
    newFile: null,
    newFileBase64: null,
    removeExistingFile: false,
  })

  const isEditMode = Boolean(row?.clientDocumentId)

  useEffect(() => {
    if (open && row) {
      const issuedDate = row.issuedDate ?? ""
      const expirationDate = row.expirationDate ?? ""
      
      setForm({
        issuedDate,
        expirationDate,
        comments: row.comments ?? "",
        newFile: null,
        newFileBase64: null,
        removeExistingFile: false,
      })
      setFileError(null)
      
      const matchingOffset = issuedDate && expirationDate 
        ? detectQuickOffset(issuedDate, expirationDate)
        : null
      setSelectedQuickOffset(matchingOffset)
      
      setFetchedFileUrl(null)

      if (row.clientDocumentId) {
        setLoadingExistingFile(true)
        getClientDocumentUrl(row.clientDocumentId)
          .then((url) => setFetchedFileUrl(url))
          .catch((err) => {
            console.error("Error fetching document URL:", err)
            setFetchedFileUrl(null)
          })
          .finally(() => setLoadingExistingFile(false))
      }
    }
  }, [open, row])

  // ---------------------------------------------------------------------------
  // File handling
  // ---------------------------------------------------------------------------

  const handleFileChange = useCallback(async (file: File) => {
    setFileError(null)
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setFileError(`File exceeds the ${MAX_SIZE_MB}MB size limit.`)
      return
    }
    try {
      const base64 = await readFileAsBase64(file)
      setForm((prev) => ({ ...prev, newFile: file, newFileBase64: base64, removeExistingFile: false }))
    } catch {
      setFileError("Failed to process the file. Please try again.")
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDragOver(false)
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) handleFileChange(droppedFile)
    },
    [handleFileChange]
  )

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0]
      if (selected) handleFileChange(selected)
      e.target.value = ""
    },
    [handleFileChange]
  )

  const handleRemoveNew = useCallback(() => {
    setForm((prev) => ({ ...prev, newFile: null, newFileBase64: null }))
    setFileError(null)
  }, [])

  const handleRemoveExisting = useCallback(() => {
    setForm((prev) => ({ ...prev, removeExistingFile: true }))
  }, [])

  const handleUploadAnother = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleViewDocument = useCallback(async () => {
    if (!row?.clientDocumentId) return
    try {
      const url = await getClientDocumentUrl(row.clientDocumentId)
      setViewerDocument({
        url,
        name: row.documentConfigName,
      })
    } catch (err) {
      console.error("Error fetching document:", err)
      toast.error(err instanceof Error ? err.message : "Failed to load document")
    }
  }, [row])

  // ---------------------------------------------------------------------------
  // Quick-date buttons
  // ---------------------------------------------------------------------------

  const handleQuickOffset = useCallback(
    (label: string, applyFn: (d: Date) => Date) => {
      const base = parseDate(form.issuedDate) ?? new Date()
      const result = applyFn(base)
      const isoDate = dateToISO(result)
      if (isoDate) {
        setForm((prev) => ({ ...prev, expirationDate: isoDate }))
      }
      setSelectedQuickOffset(label)
    },
    [form.issuedDate]
  )

  const handleSave = useCallback(async () => {
    if (!row) return
    
    if (row.allowIssuedDate && !form.issuedDate) {
      return
    }
    if (row.allowExpirationDate && !form.expirationDate) {
      return
    }
    if (row.allowUploadFile && !row.clientDocumentId && !form.newFile) {
      return
    }
    
    await onSave({
      issuedDate: form.issuedDate || null,
      expirationDate: form.expirationDate || null,
      comments: form.comments || null,
      fileBase64: form.newFileBase64,
      fileName: form.newFile?.name ?? null,
    })
  }, [row, form, onSave])

  const handleClose = useCallback(() => {
    if (!isSaving) onOpenChange(false)
  }, [isSaving, onOpenChange])

  if (!row) return null

  const existingFileUrl = form.removeExistingFile ? null : (fetchedFileUrl ?? row.fileUrl ?? null)
  const existingFileName = form.removeExistingFile ? null : (row.fileName ?? null)

  const isMissingRequiredFields = 
    (row.allowIssuedDate && !form.issuedDate) ||
    (row.allowExpirationDate && !form.expirationDate) ||
    (row.allowUploadFile && !row.clientDocumentId && !form.newFile)

  if (loadingExistingFile) {
    return (
      <CustomModal
        open={open}
        onOpenChange={handleClose}
        title={isEditMode ? "Edit Document" : "Upload Document"}
        description={row.documentConfigName}
        maxWidthClassName="sm:max-w-[760px]"
      >
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-[#037ECC] animate-spin" />
              <p className="text-sm text-slate-600">Loading document...</p>
            </div>
          </div>
        </div>
      </CustomModal>
    )
  }

  return (
    <CustomModal
      open={open}
      onOpenChange={handleClose}
      title={isEditMode ? "Edit Document" : "Upload Document"}
      maxWidthClassName="sm:max-w-[760px]"
    >
      <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">

        <FileZone
          documentName={row.documentConfigName}
          existingFileUrl={existingFileUrl}
          existingFileName={existingFileName}
          newFile={form.newFile}
          removeExistingFile={form.removeExistingFile}
          dragOver={dragOver}
          fileError={fileError}
          fileInputRef={fileInputRef}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onBrowseClick={() => fileInputRef.current?.click()}
          onRemoveNew={handleRemoveNew}
          onRemoveExisting={handleRemoveExisting}
          onUploadAnother={handleUploadAnother}
          onFileInputChange={handleFileInputChange}
          onViewDocument={handleViewDocument}
        />

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PremiumDatePicker
              label="Issued Date"
              value={form.issuedDate}
              onChange={(val) => {
                setForm((prev) => ({ ...prev, issuedDate: val, expirationDate: "" }))
                setSelectedQuickOffset(null)
              }}
              required={row.allowIssuedDate}
            />
            <PremiumDatePicker
              label="Expiration Date"
              value={form.expirationDate}
              onChange={(val) => {
                setForm((prev) => ({ ...prev, expirationDate: val }))
                const matchingOffset = detectQuickOffset(form.issuedDate, val)
                setSelectedQuickOffset(matchingOffset)
              }}
              required={row.allowExpirationDate}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Quick expiration from issued date
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 pr-4">
              {QUICK_OFFSETS.map(({ label, apply }) => {
                const isSelected = selectedQuickOffset === label
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleQuickOffset(label, apply)}
                    className={cn(
                      "h-8 px-3 rounded-lg text-xs font-semibold whitespace-nowrap flex-shrink-0",
                      "border transition-all duration-150",
                      isSelected
                        ? "border-[#037ECC] bg-[#037ECC] text-white shadow-md"
                        : "border-slate-200 bg-white text-slate-600 hover:border-[#037ECC]/50 hover:text-[#037ECC] hover:bg-[#037ECC]/5",
                      "disabled:opacity-40 disabled:cursor-not-allowed"
                    )}
                    disabled={!form.issuedDate}
                    title={!form.issuedDate ? "Set an issued date first" : `Set expiration to ${label} from issued date`}
                  >
                    <Plus className="w-3 h-3 inline mr-1 -mt-0.5" />
                    {label.replace("+", "")}
                  </button>
                )
              })}
            </div>
            {!form.issuedDate && (
              <p className="text-xs text-slate-400">Set an issued date to use quick buttons</p>
            )}
          </div>
        </div>

        <FloatingTextarea
          label="Comments"
          value={form.comments}
          onChange={(val) => setForm((prev) => ({ ...prev, comments: val }))}
          onBlur={() => {}}
          maxLength={500}
          rows={3}
        />

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isSaving}
            className="gap-2 flex items-center"
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving || Boolean(fileError) || isMissingRequiredFields}
            loading={isSaving}
            className="gap-2 flex items-center min-w-[140px]"
          >
            {!isSaving && <Save className="w-4 h-4" />}
            {isEditMode ? "Update" : "Upload"}
          </Button>
        </div>
      </div>
      {viewerDocument && (
        <DocumentViewer
          open={!!viewerDocument}
          onClose={() => setViewerDocument(null)}
          documentUrl={viewerDocument.url}
          fileName={viewerDocument.name}
        />
      )}
    </CustomModal>
  )
}
