import { z } from "zod"

export const billingCodeFormSchema = z.object({
  type: z
    .enum(["CPT", "HCPCS"], {
      required_error: "Type is required",
    }),
  
  code: z
    .string()
    .min(1, "Code is required")
    .max(10, "Code must be less than 10 characters"),
  
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be less than 500 characters"),
  
  modifiers: z
    .array(z.string())
    .optional(),
  
  parent: z
    .string()
    .optional()
    .or(z.literal("")),
  
  allowedPlacesOfService: z
    .array(z.string())
    .optional(),
  
  active: z.boolean().optional(),
  
  catalogId: z
    .string()
    .optional(), 
})


export type BillingCodeFormValues = z.infer<typeof billingCodeFormSchema>


export const getBillingCodeFormDefaults = (): BillingCodeFormValues => ({
  type: "CPT",
  code: "",
  description: "",
  modifiers: [],
  parent: "",
  allowedPlacesOfService: [],
  active: true,
})


export const getBillingCodeFormFromCatalog = (catalogItem: {
  id: string
  type: "CPT" | "HCPCS"
  code: string
  description: string
}): BillingCodeFormValues => ({
  type: catalogItem.type,
  code: catalogItem.code,
  description: catalogItem.description,
  modifiers: [], 
  parent: "",
  allowedPlacesOfService: [], 
  active: true,
  catalogId: catalogItem.id,
})
