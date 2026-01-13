import { z } from "zod"

const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/

export const credentialFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be less than 200 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name must contain only letters"),
  
  shortName: z
    .string()
    .min(1, "Short name is required")
    .max(50, "Short name must be less than 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Short name must contain only letters"),
  
  organizationName: z
    .string()
    .max(200, "Organization name must be less than 200 characters")
    .regex(/^[a-zA-Z\s]*$/, "Organization name must contain only letters")
    .optional()
    .or(z.literal("")),
  
  website: z
    .string()
    .regex(urlRegex, "Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  
  taxonomyCode: z
    .string()
    .min(1, "Taxonomy code is required")
    .max(50, "Taxonomy code must be less than 50 characters"),
  
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  
  billingCodeIds: z
    .array(z.string())
    .optional(),
  
  active: z.boolean().optional(),
  
  catalogId: z
    .string()
    .optional(),
})

export type CredentialFormValues = z.infer<typeof credentialFormSchema>

export const getCredentialFormDefaults = (): CredentialFormValues => ({
  name: "",
  shortName: "",
  organizationName: "",
  website: "",
  taxonomyCode: "",
  description: "",
  billingCodeIds: [],
  active: true,
})

export const getCredentialFormFromCatalog = (catalogItem: {
  id: string
  name: string
  shortName: string
  organizationName?: string
  website?: string
  description?: string
}): CredentialFormValues => ({
  name: catalogItem.name,
  shortName: catalogItem.shortName,
  organizationName: catalogItem.organizationName || "",
  website: catalogItem.website || "",
  taxonomyCode: "",
  description: catalogItem.description || "",
  billingCodeIds: [],
  active: true,
  catalogId: catalogItem.id,
})
