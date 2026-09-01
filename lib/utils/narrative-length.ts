/**
 * Reglas de extensión para los campos de texto libre de las session notes
 * (Session Summary, los Narrative de 97155) y el Summary del Clinical Monthly.
 *
 * Requisito clínico: mínimo 250 palabras y 250 caracteres. Sin máximo.
 */

export const NARRATIVE_MIN_CHARS = 250
export const NARRATIVE_MIN_WORDS = 250

/** Palabras = grupos separados por espacios en blanco */
export function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

/** Caracteres contados sobre el texto sin espacios sobrantes en los extremos */
export function countChars(text: string): number {
  return text.trim().length
}

export interface NarrativeLengthState {
  words: number
  chars: number
  isEmpty: boolean
  /** true cuando cumple el mínimo de palabras y caracteres */
  isValid: boolean
}

export function getNarrativeLengthState(text: string): NarrativeLengthState {
  const words = countWords(text)
  const chars = countChars(text)
  return {
    words,
    chars,
    isEmpty: words === 0,
    isValid: words >= NARRATIVE_MIN_WORDS && chars >= NARRATIVE_MIN_CHARS,
  }
}

/**
 * Devuelve el mensaje de error, o `null` si el texto cumple.
 * Pensado para usarse en los `handleSubmit` de los formularios de session note.
 */
export function validateNarrativeLength(text: string): string | null {
  const { words, chars, isEmpty } = getNarrativeLengthState(text)

  if (isEmpty) return "This field is required"
  if (words < NARRATIVE_MIN_WORDS) {
    return `Write at least ${NARRATIVE_MIN_WORDS} words (currently ${words})`
  }
  if (chars < NARRATIVE_MIN_CHARS) {
    return `Write at least ${NARRATIVE_MIN_CHARS} characters (currently ${chars})`
  }
  return null
}
