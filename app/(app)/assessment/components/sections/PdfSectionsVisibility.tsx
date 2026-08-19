"use client"

import { Eye } from "lucide-react"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { ASSESSMENT_PDF_CLIENT_RECORD_FLAGS } from "@/lib/constants/assessment.constants"
import type { AssessmentPdfFlagKey, AssessmentPdfFlags } from "@/lib/types/assessment.types"

interface PdfSectionsVisibilityProps {
  flags: AssessmentPdfFlags
  disabled?: boolean
  onUpdate: (key: AssessmentPdfFlagKey, value: boolean) => void
}

/**
 * Switches de las secciones del PDF que se arman desde el expediente del
 * cliente (contactos, médicos, documentos…) y no tienen sección propia en el
 * formulario. El resto de flags vive en el header de su sección.
 */
export function PdfSectionsVisibility({ flags, disabled, onUpdate }: PdfSectionsVisibilityProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-slate-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#037ECC]/10 text-[#037ECC]">
          <Eye className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">Client Record PDF Sections</h3>
          <span className="text-xs text-slate-400">
            Printed from the client&apos;s record; choose which ones to include
          </span>
        </div>
      </div>
      <div className="px-5 py-4">
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {ASSESSMENT_PDF_CLIENT_RECORD_FLAGS.map(({ key, label }) => (
            <div key={key} className="rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-2.5">
              <PremiumSwitch
                checked={flags[key]}
                onCheckedChange={(v) => onUpdate(key, v)}
                label={label}
                disabled={disabled}
                className="flex-row-reverse justify-end gap-3"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
