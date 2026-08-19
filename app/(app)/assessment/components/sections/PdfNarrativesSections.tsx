"use client"

import { FileText, Info } from "lucide-react"
import { CollapsableSection } from "@/components/custom/CollapsableSection"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import { ASSESSMENT_PDF_TEXT_GROUPS } from "@/lib/constants/assessment.constants"
import type { AssessmentPdfTextKey, AssessmentPdfTexts } from "@/lib/types/assessment.types"

interface PdfNarrativesSectionsProps {
  values: AssessmentPdfTexts
  isEditing: boolean
  disabled?: boolean
  onUpdate: (key: AssessmentPdfTextKey, value: string) => void
}

/**
 * Textos editables del PDF, agrupados y colapsados por defecto: en create casi
 * siempre se dejan vacíos (el backend aplica el texto estándar) y en edit son
 * párrafos largos que no deben alargar el formulario.
 */
export function PdfNarrativesSections({ values, isEditing, disabled, onUpdate }: PdfNarrativesSectionsProps) {
  return (
    <>
      {ASSESSMENT_PDF_TEXT_GROUPS.map((group) => (
        <CollapsableSection
          key={group.title}
          icon={<FileText className="h-4 w-4" />}
          title={group.title}
          subtitle={group.subtitle}
          defaultOpen={false}
        >
          {!isEditing && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-[#037ECC]/20 bg-[#037ECC]/[0.04] px-4 py-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#037ECC]" />
              <p className="text-sm text-slate-600">
                Leave a field empty to use the standard text in the PDF. You can review and edit the
                applied text after the assessment is created.
              </p>
            </div>
          )}
          <div className="space-y-4">
            {group.fields.map(({ key, label }) => (
              <FloatingTextarea
                key={key}
                label={label}
                value={values[key]}
                onChange={(v) => onUpdate(key, v)}
                onBlur={() => {}}
                rows={3}
                disabled={disabled}
              />
            ))}
          </div>
        </CollapsableSection>
      ))}
    </>
  )
}
