"use client"

import { useRef } from "react"
import { Upload, X, FileText, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import type { PriorAuthFile } from "@/lib/types/prior-authorization.types"
import { cn } from "@/lib/utils"

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024 // 25 MB

interface TabFilesProps {
  files: PriorAuthFile[]
  onChange: (files: PriorAuthFile[]) => void
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function makeFileId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function TabFiles({ files, onChange }: TabFilesProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const processFiles = (fileList: FileList | null) => {
    if (!fileList) return

    Array.from(fileList).forEach((file) => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`File "${file.name}" exceeds the 25 MB limit.`)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const url = e.target?.result as string
        const newFile: PriorAuthFile = {
          id: makeFileId(),
          name: file.name,
          url,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        }
        onChange([...files, newFile])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    processFiles(e.dataTransfer.files)
  }

  const handleRemove = (id: string) => {
    onChange(files.filter((f) => f.id !== id))
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "group relative cursor-pointer rounded-2xl border-2 border-dashed",
          "border-slate-300 bg-slate-50/60",
          "hover:border-[#037ECC]/50 hover:bg-[#037ECC]/5",
          "transition-all duration-200",
          "flex flex-col items-center justify-center gap-3 py-10"
        )}
      >
        <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center group-hover:border-[#037ECC]/30 transition-colors">
          <Upload className="w-6 h-6 text-slate-400 group-hover:text-[#037ECC]/70 transition-colors" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-700">
            Drop files here or{" "}
            <span className="text-[#037ECC] font-semibold">click to upload</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">Any document file up to 25 MB</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => processFiles(e.target.files)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3",
                "border border-slate-200 bg-white shadow-sm"
              )}
            >
              <div className="h-9 w-9 rounded-lg bg-[#037ECC]/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-[#037ECC]" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium text-slate-800 truncate"
                  title={file.name}
                >
                  {file.name}
                </p>
                <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(file.id)}
                className={cn(
                  "h-7 w-7 flex items-center justify-center rounded-lg flex-shrink-0",
                  "text-slate-400 hover:text-red-500",
                  "hover:bg-red-50",
                  "transition-colors duration-150"
                )}
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-400 px-1">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            Attach the authorization document received from the insurance (email, PDF, etc.)
          </span>
        </div>
      )}
    </div>
  )
}
