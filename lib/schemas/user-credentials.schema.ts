import { z } from "zod"

function normalizeDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

export const userCredentialFormSchema = z
  .object({
    credentialTypeId: z.string().min(1, "Credential is required"),

    identificationNumber: z
      .string()
      .min(1, "Identification Number is required")
      .regex(/^[0-9-]+$/, "Only numbers and hyphens are allowed"),

    effectiveDate: z.string().min(1, "Effective Date is required"),

    expirationDate: z.string().min(1, "Expiration Date is required"),
  })
  .refine(
    (data) => {
      if (!data.effectiveDate || !data.expirationDate) return true
      const effective = normalizeDate(data.effectiveDate)
      const expiration = normalizeDate(data.expirationDate)
      return effective <= expiration
    },
    {
      message: "Effective Date cannot be greater than Expiration Date",
      path: ["effectiveDate"],
    }
  )

export type UserCredentialFormValues = z.infer<typeof userCredentialFormSchema>

export const getUserCredentialFormDefaults = (): UserCredentialFormValues => ({
  credentialTypeId: "",
  identificationNumber: "",
  effectiveDate: "",
  expirationDate: "",
})

export const userSignatureFormSchema = z.object({
  imageBase64: z.string().min(1, "Signature is required"),
  agreementAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the agreement" }),
  }),
})

export type UserSignatureFormValues = z.infer<typeof userSignatureFormSchema>
