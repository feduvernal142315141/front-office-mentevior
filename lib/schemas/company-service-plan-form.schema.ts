import { z } from "zod"

export const companyServicePlanFormSchema = z
  .object({
    serviceId: z.string().trim().min(1, "Service is required"),
    name: z.string().trim().min(1, "Name is required"),
    startDate: z.string().optional().or(z.literal("")),
    endDate: z.string().optional().or(z.literal("")),
    active: z.boolean(),
    description: z.string().optional().or(z.literal("")),
    categories: z.array(z.string()),
  })
  .refine(
    (values) => {
      if (!values.startDate || !values.endDate) return true
      return values.startDate <= values.endDate
    },
    {
      path: ["endDate"],
      message: "End date must be greater than or equal to start date",
    }
  )

export type CompanyServicePlanFormValues = z.infer<typeof companyServicePlanFormSchema>

export const getCompanyServicePlanFormDefaults = (): CompanyServicePlanFormValues => ({
  serviceId: "",
  name: "",
  startDate: "",
  endDate: "",
  active: true,
  description: "",
  categories: [],
})
