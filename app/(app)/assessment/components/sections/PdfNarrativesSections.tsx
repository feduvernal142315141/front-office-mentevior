"use client"

import { useCallback, useState } from "react"
import { FileText } from "lucide-react"
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
  /** Claves: la key del texto (narrativa) o el flagKey del grupo (estrategias) */
  errors: Record<string, string>
  disabled?: boolean
  onUpdate: (key: AssessmentPdfTextKey, value: string) => void
  onUpdateFlag: (key: AssessmentPdfFlagKey, value: boolean) => void
}

/**
 * Narrativas editables del PDF, colapsadas por defecto porque son párrafos
 * largos: en create llegan precargadas con el texto estándar (el mismo default
 * del backend) y en edit con lo persistido. Cada sección lleva su switch de
 * visibilidad en el header; los bloques de estrategias tienen un flag único.
 */
export function PdfNarrativesSections({
  values,
  flags,
  errors,
  disabled,
  onUpdate,
  onUpdateFlag,
}: PdfNarrativesSectionsProps) {
  /**
   * Encender un switch expande su sección de inmediato (y apagar la cierra);
   * después el usuario puede colapsarla a mano sin que se vuelva a forzar.
   * `undefined` = sin override, comportamiento normal del colapsable.
   */
  const [openOverrides, setOpenOverrides] = useState<Partial<Record<AssessmentPdfFlagKey, boolean>>>({})

  const handleFlagChange = useCallback(
    (flagKey: AssessmentPdfFlagKey, value: boolean) => {
      onUpdateFlag(flagKey, value)
      setOpenOverrides((prev) => ({ ...prev, [flagKey]: value }))
    },
    [onUpdateFlag],
  )

  return (
    <>
      {ASSESSMENT_PDF_GENERAL_NARRATIVES.map(({ key, flagKey, label }) => (
        <CollapsableSection
          key={key}
          icon={<FileText className="h-4 w-4" />}
          title={label}
          defaultOpen={false}
          // Con el switch apagado queda plegada y sin expandir (el texto se
          // conserva y se sigue enviando); encenderlo la expande, y un error
          // la fuerza abierta para que el mensaje inline sea visible
          forceOpen={errors[key] ? true : !flags[flagKey] ? false : openOverrides[flagKey]}
          disabled={!flags[flagKey]}
          headerAction={
            <SectionPdfToggle
              checked={flags[flagKey]}
              onChange={(v) => handleFlagChange(flagKey, v)}
              disabled={disabled}
            />
          }
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
          forceOpen={errors[group.flagKey] ? true : !flags[group.flagKey] ? false : openOverrides[group.flagKey]}
          disabled={!flags[group.flagKey]}
          headerAction={
            <SectionPdfToggle
              checked={flags[group.flagKey]}
              onChange={(v) => handleFlagChange(group.flagKey, v)}
              disabled={disabled}
            />
          }
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
