/**
 * USER FORM SCHEMA
 * 
 * Zod validation schema para el formulario de usuarios.
 * Separado para reutilización y testing.
 */

import { z } from "zod"
import { getTodayLocalDate } from "@/lib/date"

/**
 * Schema de validación
 */
export const userFormSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name must be less than 100 characters"),
  
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name must be less than 100 characters"),
  
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .toLowerCase(),
  
  cellphone: z
    .string()
    .min(1, "Cellphone is required")
    .regex(/^[\d\s\-\+\(\)]+$/, "Invalid phone format"),
  
  hiringDate: z
    .string()
    .min(1, "Hiring date is required"),
  
  roleId: z
    .string()
    .min(1, "Role is required"),
  
  // Solo para edición
  active: z.boolean().optional(),
  terminated: z.boolean().optional(),
})

/**
 * Tipo inferido del schema
 */
export type UserFormValues = z.infer<typeof userFormSchema>

/**
 * Valores por defecto del formulario
 */
export const getUserFormDefaults = (): UserFormValues => ({
  firstName: "",
  lastName: "",
  email: "",
  cellphone: "",
  hiringDate: getTodayLocalDate(), // Today in local timezone
  roleId: "",
  active: true,
  terminated: false,
})
