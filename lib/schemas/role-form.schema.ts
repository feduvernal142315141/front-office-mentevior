/**
 * ROLE FORM SCHEMA
 * 
 * Zod validation schema para el formulario de roles.
 * Separado para reutilización y testing.
 */

import { z } from "zod"

/**
 * Schema de validación
 */
export const roleFormSchema = z.object({
  name: z
    .string()
    .min(1, "Role name is required")
    .max(100, "Role name must be less than 100 characters")
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Role name can only contain letters, numbers, spaces, hyphens and underscores"),
  
  permissions: z
    .array(z.string())
    .min(0, "At least select some permissions"),
})

/**
 * Tipo inferido del schema
 */
export type RoleFormValues = z.infer<typeof roleFormSchema>

/**
 * Valores por defecto del formulario
 */
export const getRoleFormDefaults = (): RoleFormValues => ({
  name: "",
  permissions: [], // Sin permisos por defecto
})
