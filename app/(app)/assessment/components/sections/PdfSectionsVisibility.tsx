"use client"

import { Eye } from "lucide-react"
import { CollapsableSection } from "@/components/custom/CollapsableSection"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { ASSESSMENT_PDF_SECTION_FLAGS } from "@/lib/constants/assessment.constants"
import type { AssessmentPdfFlagKey, AssessmentPdfFlags } from "@/lib/types/assessment.types"

interface PdfSectionsVisibilityProps {
  flags: AssessmentPdfFlags
  disabled?: boolean
  onUpdate: (key: AssessmentPdfFlagKey, value: boolean) => void
}

/** Qué secciones del PDF se imprimen; todas parten visibles */
export function PdfSectionsVisibility({ flags, disabled, onUpdate }: PdfSectionsVisibilityProps) {
  return (
    <CollapsableSection
      icon={<Eye className="h-4 w-4" />}
      title="PDF Sections"
      subtitle="Choose which sections are printed in the report"
      defaultOpen={false}
    >
      <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {ASSESSMENT_PDF_SECTION_FLAGS.map(({ key, label }) => (
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
    </CollapsableSection>
  )
}
