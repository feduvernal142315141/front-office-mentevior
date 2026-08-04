import type { FieldGuidance } from "./field-guidance"

/**
 * Guía del campo Summary del Clinical Monthly.
 *
 * Mismo formato que las guías de las session notes (ver `session-note-guidance.ts`):
 * se muestra dentro del campo mientras está vacío y desaparece al hacer click.
 *
 * El Summary reemplazó a los textos por item (`monthlyDataProgress` y
 * `commentsProcedureChange`), de ahí que la guía mencione los dos.
 */
export const CLINICAL_MONTHLY_SUMMARY_GUIDANCE: FieldGuidance = {
  intro:
    "Provide comments on procedure changes and/or any progress in the data collection.",
}
