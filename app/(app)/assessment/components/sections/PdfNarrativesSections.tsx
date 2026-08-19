"use client"

import { FileText, Info } from "lucide-react"
import { CollapsableSection } from "@/components/custom/CollapsableSection"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import {
  ASSESSMENT_PDF_GENERAL_NARRATIVES,
  ASSESSMENT_PDF_STRATEGY_GROUPS,
} from "@/lib/constants/assessment.constants"
import type {
  AssessmentPdfFlagKey,
  AssessmentPdfFlags,
  AssessmentPdfTextKey,
  AssessmentPdfTexts,
} from "@/lib/types/assessment.types"
import { SectionPdfToggle } from "./SectionPdfToggle"

interface PdfNarrativesSectionsProps {
  values: AssessmentPdfTexts
  flags: AssessmentPdfFlags
  isEditing: boolean
  disabled?: boolean
  onUpdate: (key: AssessmentPdfTextKey, value: string) => void
  onUpdateFlag: (key: AssessmentPdfFlagKey, value: boolean) => void
}

/**
 * Narrativas editables del PDF, colapsadas por defecto: en create casi siempre
 * se dejan vacías (el backend aplica el texto estándar) y en edit son párrafos
 * largos que no deben alargar el formulario. Cada sección lleva su switch de
 * visibilidad en el header; los bloques de estrategias tienen un flag único.
 */
export function PdfNarrativesSections({
  values,
  flags,
  isEditing,
  disabled,
  onUpdate,
  onUpdateFlag,
}: PdfNarrativesSectionsProps) {
  const defaultTextNote = !isEditing && (
    <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-[#037ECC]/20 bg-[#037ECC]/[0.04] px-4 py-3">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#037ECC]" />
      <p className="text-sm text-slate-600">
        Leave a field empty to use the standard text in the PDF. You can review and edit the applied
        text after the assessment is created.
      </p>
    </div>
  )

  return (
    <>
      {ASSESSMENT_PDF_GENERAL_NARRATIVES.map(({ key, flagKey, label }) => (
        <CollapsableSection
          key={key}
          icon={<FileText className="h-4 w-4" />}
          title={label}
          defaultOpen={false}
          // Con el switch apagado la sección queda plegada y sin expandir;
          // el texto capturado se conserva y se sigue enviando
          forceOpen={flags[flagKey] ? undefined : false}
          disabled={!flags[flagKey]}
          headerAction={
            <SectionPdfToggle
              checked={flags[flagKey]}
              onChange={(v) => onUpdateFlag(flagKey, v)}
              disabled={disabled}
            />
          }
        >
          {defaultTextNote}
          <FloatingTextarea
            label={label}
            value={values[key]}
            onChange={(v) => onUpdate(key, v)}
            onBlur={() => {}}
            rows={5}
            disabled={disabled}
          />
        </CollapsableSection>
      ))}

      {ASSESSMENT_PDF_STRATEGY_GROUPS.map((group) => (
        <CollapsableSection
          key={group.title}
          icon={<FileText className="h-4 w-4" />}
          title={group.title}
          subtitle={group.subtitle}
          defaultOpen={false}
          forceOpen={flags[group.flagKey] ? undefined : false}
          disabled={!flags[group.flagKey]}
          headerAction={
            <SectionPdfToggle
              checked={flags[group.flagKey]}
              onChange={(v) => onUpdateFlag(group.flagKey, v)}
              disabled={disabled}
            />
          }
        >
          {defaultTextNote}
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
