"use client"

import { useCallback } from "react"
import { useAlert } from "@/lib/contexts/alert-context"

interface UseUnsavedChangesGuardParams {
  /** `true` cuando hay algo cargado que todavía no se guardó */
  isDirty: boolean
  /**
   * Guarda. Puede ser async: el diálogo espera y recién ahí cierra.
   * Si el guardado falla, lanzá — el diálogo cierra igual, pero la pantalla
   * se queda donde está porque `action` sólo corre al descartar.
   */
  onSave?: () => void | Promise<void>
  title?: string
  description?: string
}

interface UseUnsavedChangesGuardReturn {
  /**
   * Envuelve cualquier salida (cerrar el modal, navegar, cambiar de item).
   * Sin cambios pendientes ejecuta `action` derecho; con cambios abre el
   * diálogo de Save · Discard · Cancel.
   */
  guard: (action: () => void) => void
}

const DEFAULT_TITLE = "Unsaved changes"
const DEFAULT_DESCRIPTION =
  "You have unsaved changes. Save them, discard them, or cancel to keep editing."

/**
 * Aviso de cambios sin guardar, con las tres salidas reales del caso.
 *
 * Existía una versión de dos botones en la que **Cancel descartaba y navegaba**:
 * el botón que prometía no hacer nada era el que borraba el trabajo. Acá cada
 * botón hace lo que dice:
 *
 * - **Save**    → guarda y después ejecuta la acción.
 * - **Discard** → tira los cambios y ejecuta la acción.
 * - **Cancel**  → no hace nada; el usuario sigue editando.
 *
 * El cierre por X, Escape o click afuera del diálogo equivale a **Cancel**.
 */
export function useUnsavedChangesGuard({
  isDirty,
  onSave,
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
}: UseUnsavedChangesGuardParams): UseUnsavedChangesGuardReturn {
  const alert = useAlert()

  const guard = useCallback(
    (action: () => void) => {
      if (!isDirty) {
        action()
        return
      }

      alert.confirm({
        title,
        description,
        confirmText: "Save",
        discardText: "Discard",
        cancelText: "Cancel",
        onConfirm: async () => {
          await onSave?.()
        },
        onDiscard: action,
      })
    },
    [isDirty, onSave, title, description, alert],
  )

  return { guard }
}
