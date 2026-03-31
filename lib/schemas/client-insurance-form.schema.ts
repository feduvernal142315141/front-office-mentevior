import { z } from "zod"
import type { InsuranceRelationship } from "@/lib/types/client-insurance.types"

export const INSURANCE_RELATIONSHIPS: InsuranceRelationship[] = ["Self", "Spouse", "Child", "Other"]

export const clientInsuranceFormSchema = z
  .object({
    payerId: z.string().min(1, "Payer is required"),
    memberNumber: z.string().min(1, "Member number is required"),
    groupNumber: z.string().optional(),
    relationship: z.enum(["Self", "Spouse", "Child", "Other"]),
    isActive: z.boolean(),
    isPrimary: z.boolean(),
    effectiveDate: z.string().min(1, "Effective date is required"),
    terminationDate: z.string().optional(),
    comments: z.string().max(500, "Comments cannot exceed 500 characters").optional(),
  })
  .refine(
    (data) => {
      if (!data.terminationDate || !data.effectiveDate) return true
      return data.terminationDate >= data.effectiveDate
    },
    {
      message: "Termination date cannot be earlier than effective date",
      path: ["terminationDate"],
    }
  )

export type ClientInsuranceFormValues = z.infer<typeof clientInsuranceFormSchema>

export const clientInsuranceFormDefaults: ClientInsuranceFormValues = {
  payerId: "",
  memberNumber: "",
  groupNumber: "",
  relationship: "Self",
  isActive: true,
  isPrimary: false,
  effectiveDate: "",
  terminationDate: "",
  comments: "",
}
