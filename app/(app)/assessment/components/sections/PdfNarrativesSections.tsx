"use client"

import { FileText } from "lucide-react"
import { CollapsableSection } from "@/components/custom/CollapsableSection"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import {
  ASSESSMENT_PDF_GENERAL_NARRATIVES,
  ASSESSMENT_PDF_STRATEGY_GROUPS,
} from "@/lib/constants/assessment.constants"
import type {
  AssessmentPdfTextKey,
  AssessmentPdfTexts,
} from "@/lib/types/assessment.types"

interface PdfNarrativesSectionsProps {
  values: AssessmentPdfTexts
  /** Claves: la key del texto (narrativa) o el flagKey del grupo (estrategias) */
  errors: Record<string, string>
  disabled?: boolean
  onUpdate: (key: AssessmentPdfTextKey, value: string) => void
}

/**
 * Narrativas editables del PDF, colapsadas por defecto. Van siempre al PDF
 * (pedido Word §3): sin switch "Include in PDF"; el flag se manda `true`.
 */
export function PdfNarrativesSections({
  values,
  errors,
  disabled,
  onUpdate,
}: PdfNarrativesSectionsProps) {
  return (
    <>
      {ASSESSMENT_PDF_GENERAL_NARRATIVES.map(({ key, label }) => (
        <CollapsableSection
          key={key}
          icon={<FileText className="h-4 w-4" />}
          title={label}
          defaultOpen={false}
          forceOpen={errors[key] ? true : undefined}
        >
          <div data-field={key}>
            <FloatingTextarea
              label={label}
              value={values[key]}
              onChange={(v) => onUpdate(key, v)}
              onBlur={() => {}}
              rows={5}
              disabled={disabled}
              hasError={!!errors[key]}
            />
            {errors[key] && <p className="mt-1.5 text-xs font-medium text-red-500">{errors[key]}</p>}
          </div>
        </CollapsableSection>
      ))}

      {ASSESSMENT_PDF_STRATEGY_GROUPS.map((group) => (
        <CollapsableSection
          key={group.title}
          icon={<FileText className="h-4 w-4" />}
          title={group.title}
          subtitle={group.subtitle}
          defaultOpen={false}
          forceOpen={errors[group.flagKey] ? true : undefined}
        >
          <div data-field={group.flagKey}>
            {errors[group.flagKey] && (
              <p className="mb-3 text-xs font-medium text-red-500">{errors[group.flagKey]}</p>
            )}
          </div>
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
