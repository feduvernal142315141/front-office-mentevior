import { z } from "zod"

export const generalInformationSchema = z.object({
  id: z.string().optional(),
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(100, "First name must be less than 100 characters"),
  
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(100, "Last name must be less than 100 characters"),
  
  birthday: z
    .string()
    .trim()
    .min(1, "Birthday is required"),
  
  country: z
    .string()
    .trim()
    .min(1, "Country is required"),
  
  state: z
    .string()
    .trim()
    .min(1, "State is required"),
  
  city: z
    .string()
    .trim()
    .min(1, "City is required"),
  
  zipCode: z
    .string()
    .trim()
    .min(5, "Zip code must be at least 5 digits")
    .max(9, "Zip code must be at most 9 digits")
    .regex(/^\d+$/, "Zip code must contain only numbers"),
  
  homeAddressLine1: z
    .string()
    .trim()
    .min(1, "Home address is required"),
  
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email format")
    .toLowerCase(),
  
  cellphone: z
    .string()
    .trim()
    .min(1, "Cellphone is required")
    .regex(/^[\d\s\-\+\(\)]+$/, "Invalid phone format"),
  
  roleId: z
    .string()
    .trim()
    .min(1, "Role is required"),

  roleName: z
    .string()
    .optional(),
  
  hiringDate: z
    .string()
    .trim()
    .min(1, "Hiring date is required"),
  
  ssn: z
    .string()
    .trim()
    .min(1, "Social Security Number is required")
    .regex(/^\d{4}$|^\d{9}$/, "SSN must be 4 or 9 digits"),
  
  npi: z
    .string()
    .regex(/^\d*$/, "NPI must contain only numbers")
    .optional()
    .or(z.literal("")),
  
  mpi: z
    .string()
    .regex(/^\d*$/, "MPI must contain only numbers")
    .optional()
    .or(z.literal("")),
  
  caqhNumber: z
    .preprocess((val) => (val === null || val === undefined ? "" : String(val)), z
      .string()
      .regex(/^\d*$/, "CAQH Number must contain only numbers")
      .optional()
      .or(z.literal(""))
    ),
  
  companyName: z
    .string()
    .optional()
    .or(z.literal("")),
  
  ein: z
    .string()
    .regex(/^\d*$/, "EIN must contain only numbers")
    .optional()
    .or(z.literal("")),
  
  employerId: z
    .string()
    .regex(/^\d*$/, "Employer ID must contain only numbers")
    .optional()
    .or(z.literal("")),
}).superRefine((data, ctx) => {
  const roleName = (data.roleName || "").toLowerCase()
  const requiresProfessionalInfo = ["rbt", "bcba", "bcaba", "supervisor"].some(r => roleName.includes(r))
  
  if (requiresProfessionalInfo) {
    if (!data.npi || data.npi.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "NPI is required",
        path: ["npi"],
      })
    }
    
    if (!data.mpi || data.mpi.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "MPI is required",
        path: ["mpi"],
      })
    }
    
    if (!data.caqhNumber || String(data.caqhNumber).trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CAQH Number is required",
        path: ["caqhNumber"],
      })
    }
    
    if (!data.employerId || data.employerId.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Employer ID is required",
        path: ["employerId"],
      })
    }
    
    if (["rbt", "bcba", "bcaba"].some(r => roleName.includes(r))) {
      if (!data.companyName || data.companyName.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Company Name is required",
          path: ["companyName"],
        })
      }
      
      if (!data.ein || data.ein.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "EIN is required",
          path: ["ein"],
        })
      }
    }
  }
})

export type GeneralInformationFormValues = z.infer<typeof generalInformationSchema>

export const getGeneralInformationDefaults = (): GeneralInformationFormValues => ({
  id: "",
  firstName: "",
  lastName: "",
  birthday: "",
  country: "",
  state: "",
  city: "",
  zipCode: "",
  homeAddressLine1: "",
  email: "",
  cellphone: "",
  roleId: "",
  roleName: "",
  hiringDate: "",
  ssn: "",
  npi: "",
  mpi: "",
  caqhNumber: "",
  companyName: "",
  ein: "",
  employerId: "",
})
