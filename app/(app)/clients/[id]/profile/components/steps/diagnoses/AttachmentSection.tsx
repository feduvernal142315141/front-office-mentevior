"use client"

import { useRef, useState } from "react"
import { AlertCircle, Download, Eye, File, FileText, Trash2, Upload } from "lucide-react"

import { cn } from "@/lib/utils"

import {
  ACCEPTED_ATTACHMENT_LABEL,
  ACCEPTED_ATTACHMENT_TYPES,
  MAX_SIZE_MB,
} from "./diagnosis-helpers"

interface AttachmentSectionProps {
  /** Archivo recién elegido, todavía sin guardar. */
  file: File | null
  /** Nombre mostrado: el del archivo nuevo o el del adjunto ya guardado. */
  fileName: string | null
  /** Hay un adjunto guardado en el servidor que sigue vigente. */
  hasStoredAttachment: boolean
  canDownload: boolean
  error: string | null
  onPick: (file: File) => void
  /** Quita el archivo nuevo y, si no lo hay, marca el adjunto guardado para borrar. */
  onRemove: () => void
  onView: () => void
  onDownload: () => void
}

export function AttachmentSection({
  file,
  fileName,
  hasStoredAttachment,
  canDownload,
  error,
  onPick,
  onRemove,
  onView,
  onDownload,
}: AttachmentSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const hasAny = Boolean(file || hasStoredAttachment)

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800">Attachment</p>
        <div className="flex items-center gap-4">
          {canDownload && !file && (
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          )}
          {hasAny && (
            <button
              type="button"
              onClick={onView}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#037ECC] hover:text-[#0268a8]"
            >
              <Eye className="h-4 w-4" />
              View
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {hasAny ? (
          <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-[#037ECC]/10">
              {file ? (
                <File className="h-5 w-5 text-[#037ECC]" />
              ) : (
                <FileText className="h-5 w-5 text-[#037ECC]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{fileName || "Attachment"}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Saved attachment"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-700"
                title="Replace attachment"
                aria-label="Replace attachment"
              >
                <Upload className="h-[18px] w-[18px]" />
              </button>
              {/* Antes sólo aparecía para archivos nuevos: no había manera de borrar un adjunto ya guardado. */}
              <button
                type="button"
                onClick={onRemove}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200/60 bg-red-50 text-red-500 transition-all duration-200 hover:bg-red-100 hover:text-red-700"
                title={file ? "Discard selected file" : "Remove attachment"}
                aria-label={file ? "Discard selected file" : "Remove attachment"}
              >
                <Trash2 className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>
        ) : (
          <label
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 transition-all duration-200",
              dragOver
                ? "border-[#037ECC] bg-[#037ECC]/5"
                : "border-slate-200 bg-white hover:border-[#037ECC]/50 hover:bg-slate-50/70"
            )}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault()
              setDragOver(false)
              const dropped = event.dataTransfer.files?.[0]
              if (dropped) onPick(dropped)
            }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#037ECC]/10">
              <Upload className="h-5 w-5 text-[#037ECC]" />
            </div>
            <p className="text-sm font-medium text-slate-700">Click to upload or drop file here</p>
            <p className="text-xs text-slate-400">
              {ACCEPTED_ATTACHMENT_LABEL} · hasta {MAX_SIZE_MB}MB
            </p>
          </label>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_ATTACHMENT_TYPES}
          className="hidden"
          onChange={(event) => {
            const selected = event.target.files?.[0]
            if (selected) onPick(selected)
            event.target.value = ""
          }}
        />

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
