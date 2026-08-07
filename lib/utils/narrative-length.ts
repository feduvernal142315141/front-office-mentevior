/**
 * Reglas de extensión para los campos de texto libre de las session notes
 * (Session Summary, los Narrative de 97155) y el Summary del Clinical Monthly.
 *
 * Requisito clínico: no menos de 250 caracteres, y entre 250 y 400 palabras.
 * En la práctica el mínimo de palabras domina —250 palabras siempre superan los
 * 250 caracteres— pero se validan las dos cotas para no depender de esa
 * coincidencia si alguna de las dos cambia.
 */

export const NARRATIVE_MIN_CHARS = 250
export const NARRATIVE_MIN_WORDS = 250
export const NARRATIVE_MAX_WORDS = 400

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
  /** true cuando cumple las tres cotas */
  isValid: boolean
}

export function getNarrativeLengthState(text: string): NarrativeLengthState {
  const words = countWords(text)
  const chars = countChars(text)
  return {
    words,
    chars,
    isEmpty: words === 0,
    isValid:
      words >= NARRATIVE_MIN_WORDS &&
      words <= NARRATIVE_MAX_WORDS &&
      chars >= NARRATIVE_MIN_CHARS,
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
  if (words > NARRATIVE_MAX_WORDS) {
    return `Use at most ${NARRATIVE_MAX_WORDS} words (currently ${words})`
  }
  if (chars < NARRATIVE_MIN_CHARS) {
    return `Write at least ${NARRATIVE_MIN_CHARS} characters (currently ${chars})`
  }
  return null
}
