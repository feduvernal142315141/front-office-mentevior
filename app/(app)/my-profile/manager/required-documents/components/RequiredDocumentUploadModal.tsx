"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import {
  FileText, Upload, X, AlertCircle, File,
  Plus, Trash2, RefreshCw, Save, RotateCcw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { CustomModal } from "@/components/custom/CustomModal"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import { Button } from "@/components/custom/Button"
import type { UserHRDocumentRow } from "@/lib/types/user-hr-document.types"
import { getUserDocumentUrl } from "@/lib/modules/user-hr-documents/services/user-hr-documents.service"
import { format, addMonths, addYears } from "date-fns"

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
  row: UserHRDocumentRow | null
  isSaving: boolean
  isDeleting: boolean
  onSave: (data: RequiredDocumentUploadModalSavePayload) => Promise<void>
  onDelete: () => Promise<void>
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

function parseDateStr(str: string): Date | null {
  if (!str) return null
  const [y, m, d] = str.split("-").map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

// ---------------------------------------------------------------------------
// Sub-component: file zone
// ---------------------------------------------------------------------------

interface FileZoneProps {
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
}

function FileZone({
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
}: FileZoneProps) {
  const hasExisting = Boolean(existingFileUrl) && !removeExistingFile

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-700">
        File
        {!hasExisting && !newFile && (
          <span className="ml-1 font-normal text-slate-400">(required to mark as Delivered)</span>
        )}
      </p>

      {/* Existing file row */}
      {hasExisting && !newFile && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
          <div className="w-9 h-9 rounded-lg bg-[#037ECC]/10 flex items-center justify-center flex-shrink-0">
            <File className="w-4 h-4 text-[#037ECC]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">
              {existingFileName ?? "Uploaded file"}
            </p>
            <a
              href={existingFileUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#037ECC] hover:underline"
            >
              View file
            </a>
          </div>
          {/* X — removes existing file from record */}
          <button
            type="button"
            onClick={onRemoveExisting}
            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors group/remove"
            title="Remove file from record"
          >
            <X className="w-4 h-4 text-slate-400 group-hover/remove:text-red-500 transition-colors" />
          </button>
        </div>
      )}

      {/* Upload another — only when existing file shown */}
      {hasExisting && !newFile && (
        <button
          type="button"
          onClick={onUploadAnother}
          className={cn(
            "w-full flex items-center justify-center gap-2",
            "py-2.5 rounded-xl border-2 border-dashed border-slate-200",
            "text-sm font-medium text-slate-500",
            "hover:border-[#037ECC]/50 hover:text-[#037ECC] hover:bg-[#037ECC]/3",
            "transition-all duration-200"
          )}
        >
          <RefreshCw className="w-4 h-4" />
          Upload another file
        </button>
      )}

      {/* New file selected preview */}
      {newFile && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-blue-200 bg-blue-50">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <File className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{newFile.name}</p>
            <p className="text-xs text-slate-500">
              {(newFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            type="button"
            onClick={onRemoveNew}
            className="p-1.5 rounded-lg hover:bg-blue-100 transition-colors"
            title="Remove selected file"
          >
            <X className="w-4 h-4 text-slate-400" />
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
  isDeleting,
  onSave,
  onDelete,
}: RequiredDocumentUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedQuickOffset, setSelectedQuickOffset] = useState<string | null>(null)
  const [fetchedFileUrl, setFetchedFileUrl] = useState<string | null>(null)
  const [loadingExistingFile, setLoadingExistingFile] = useState(false)

  const [form, setForm] = useState<UploadModalFormState>({
    issuedDate: "",
    expirationDate: "",
    comments: "",
    newFile: null,
    newFileBase64: null,
    removeExistingFile: false,
  })

  const isEditMode = Boolean(row?.userDocumentId)
  const isBusy = isSaving || isDeleting

  // Populate form when modal opens
  useEffect(() => {
    if (open && row) {
      setForm({
        issuedDate: row.issuedDate ?? "",
        expirationDate: row.expirationDate ?? "",
        comments: row.comments ?? "",
        newFile: null,
        newFileBase64: null,
        removeExistingFile: false,
      })
      setFileError(null)
      setShowDeleteConfirm(false)
      setSelectedQuickOffset(null)
      setFetchedFileUrl(null)

      // Fetch existing file URL if document exists
      if (row.userDocumentId) {
        setLoadingExistingFile(true)
        getUserDocumentUrl(row.userDocumentId)
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

  // ---------------------------------------------------------------------------
  // Quick-date buttons
  // ---------------------------------------------------------------------------

  const handleQuickOffset = useCallback(
    (label: string, applyFn: (d: Date) => Date) => {
      const base = parseDateStr(form.issuedDate) ?? new Date()
      const result = applyFn(base)
      setForm((prev) => ({ ...prev, expirationDate: toDateStr(result) }))
      setSelectedQuickOffset(label)
    },
    [form.issuedDate]
  )

  // ---------------------------------------------------------------------------
  // Clear / Save / Delete
  // ---------------------------------------------------------------------------

  const handleClear = useCallback(() => {
    if (!row) return
    setForm({
      issuedDate: "",
      expirationDate: "",
      comments: "",
      newFile: null,
      newFileBase64: null,
      removeExistingFile: false,
    })
    setFileError(null)
  }, [row])

  const handleSave = useCallback(async () => {
    if (!row) return
    await onSave({
      issuedDate: form.issuedDate || null,
      expirationDate: form.expirationDate || null,
      comments: form.comments || null,
      fileBase64: form.newFileBase64,
      fileName: form.newFile?.name ?? null,
    })
  }, [row, form, onSave])

  const handleDelete = useCallback(async () => {
    await onDelete()
    setShowDeleteConfirm(false)
  }, [onDelete])

  const handleClose = useCallback(() => {
    if (!isBusy) onOpenChange(false)
  }, [isBusy, onOpenChange])

  if (!row) return null

  const showFileZone = row.allowUploadFile
  // Use the fetched signed URL if available, otherwise fall back to row.fileUrl
  const existingFileUrl = form.removeExistingFile ? null : (fetchedFileUrl ?? row.fileUrl ?? null)
  const existingFileName = form.removeExistingFile ? null : (row.fileName ?? null)

  return (
    <CustomModal
      open={open}
      onOpenChange={handleClose}
      title={isEditMode ? "Edit Document" : "Upload Document"}
      description={row.documentConfigName}
      maxWidthClassName="sm:max-w-[760px]"
    >
      <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">

        {/* Document name — read only */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
          <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Document</p>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">{row.documentConfigName}</p>
          </div>
        </div>

        {/* File zone */}
        {showFileZone && (
          <FileZone
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
          />
        )}

        {/* Date fields */}
        {(row.allowIssuedDate || row.allowExpirationDate) && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {row.allowIssuedDate && (
                <PremiumDatePicker
                  label="Issued Date"
                  value={form.issuedDate}
                  onChange={(val) => setForm((prev) => ({ ...prev, issuedDate: val }))}
                />
              )}
              {row.allowExpirationDate && (
                <PremiumDatePicker
                  label="Expiration Date"
                  value={form.expirationDate}
                  onChange={(val) => {
                    setForm((prev) => ({ ...prev, expirationDate: val }))
                    setSelectedQuickOffset(null) // Deselect button if user changes manually
                  }}
                />
              )}
            </div>

            {/* Quick-date buttons — only when expiration is allowed */}
            {row.allowExpirationDate && (
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
            )}
          </div>
        )}

        {/* Comments */}
        <FloatingTextarea
          label="Comments"
          value={form.comments}
          onChange={(val) => setForm((prev) => ({ ...prev, comments: val }))}
          onBlur={() => {}}
          maxLength={500}
          rows={3}
        />

        {/* Delete confirmation inline */}
        {showDeleteConfirm && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
            <p className="text-sm font-semibold text-red-800">
              Delete this document record?
            </p>
            <p className="text-xs text-red-600">
              This will permanently remove the uploaded file, dates, and comments for{" "}
              <span className="font-semibold">{row.documentConfigName}</span>. The document will
              revert to <span className="font-semibold">Pending</span> status.
            </p>
            <div className="flex gap-2">
              <Button
                variant="danger"
                onClick={handleDelete}
                loading={isDeleting}
                disabled={isBusy}
                className="h-9 px-4 text-xs gap-2 flex items-center"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Yes, delete
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isBusy}
                className="h-9 px-4 text-xs gap-2 flex items-center"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Action buttons — mirrors FormBottomBar pattern */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          {/* Left side: Delete trigger (edit mode) or Clear (new upload) */}
          <div>
            {isEditMode ? (
              !showDeleteConfirm && (
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isBusy}
                  className="gap-2 flex items-center"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              )
            ) : (
              <Button
                variant="secondary"
                onClick={handleClear}
                disabled={isBusy}
                className="gap-2 flex items-center"
              >
                <RotateCcw className="w-4 h-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Right side: Cancel + primary action */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={isBusy}
              className="gap-2 flex items-center"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isBusy || Boolean(fileError)}
              loading={isSaving}
              className="gap-2 flex items-center min-w-[140px]"
            >
              {!isSaving && <Save className="w-4 h-4" />}
              {isEditMode ? "Update" : "Upload"}
            </Button>
          </div>
        </div>
      </div>
    </CustomModal>
  )
}
