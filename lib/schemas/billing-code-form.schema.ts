import { z } from "zod"

export const billingCodeFormSchema = z.object({
  type: z
    .string()
    .min(1, "Type is required"),
  
  code: z
    .string()
    .min(1, "Code is required")
    .max(10, "Code must be less than 10 characters"),
  
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be less than 500 characters"),
  
  modifiers: z
    .string()
    .optional(),

  
  parent: z
    .string()
    .optional()
    .or(z.literal("")),
  
  placeServiceId: z
    .string()
    .optional()
    .or(z.literal("")),
  
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
  modifiers: "",
  parent: "",
  placeServiceId: "",
  active: true,
})


export const getBillingCodeFormFromCatalog = (catalogItem: {
  id: string
  type: string
  code: string
  description: string
}): BillingCodeFormValues => ({
  type: catalogItem.type,
  code: catalogItem.code,
  description: catalogItem.description,
  modifiers: "", 
  parent: "",
  placeServiceId: "", 
  active: true,
  catalogId: catalogItem.id,
})
