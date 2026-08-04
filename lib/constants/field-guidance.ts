/**
 * Modelo del bloque de guía que se muestra dentro de un campo de texto mientras
 * está vacío y sin foco (ver `FloatingTextarea`).
 *
 * Nació de los CASP Session Note Templates —de ahí los nombres "Guidance" y
 * "Example"— pero el formato se reutiliza en cualquier campo que necesite
 * decirle al usuario qué escribir. Los textos concretos viven junto a su
 * dominio: `session-note-guidance.ts`, `clinical-monthly-guidance.ts`, etc.
 */

export interface GuidanceBullet {
  text: string
  /** Sub-bullets (un solo nivel de anidación) */
  children?: string[]
}

export interface FieldGuidance {
  /** Guía suelta, cuando no se escribe como lista */
  intro?: string
  bullets?: GuidanceBullet[]
  /** Los templates alternan entre "Example:", "Examples:" y "Example(s):" */
  examplesLabel?: string
  examples?: string[]
}
