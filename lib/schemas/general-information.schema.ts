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
    .min(1, "Birthday is required")
    .refine(
      (dateStr) => {
        if (!dateStr) return false
        const birthDate = new Date(dateStr)
        const today = new Date()
        const age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        const dayDiff = today.getDate() - birthDate.getDate()
        
        const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age
        
        return actualAge >= 18
      },
      { message: "You must be at least 18 years old" }
    ),
  
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
    .trim()
    .min(1, "NPI is required")
    .regex(/^\d+$/, "NPI must contain only numbers"),
  
  mpi: z
    .string()
    .trim()
    .min(1, "MPI is required")
    .regex(/^\d+$/, "MPI must contain only numbers"),
  
  caqhNumber: z
    .preprocess((val) => (val === null || val === undefined ? "" : String(val)), z
      .string()
      .trim()
      .min(1, "CAQH Number is required")
      .regex(/^\d+$/, "CAQH Number must contain only numbers")
    ),
  
  companyName: z
    .string()
    .trim()
    .min(1, "Company Name is required"),
  
  ein: z
    .string()
    .trim()
    .min(1, "EIN is required")
    .regex(/^\d+$/, "EIN must contain only numbers"),
  
  employerId: z
    .string()
    .trim()
    .min(1, "Employer ID is required")
    .regex(/^\d+$/, "Employer ID must contain only numbers"),
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
