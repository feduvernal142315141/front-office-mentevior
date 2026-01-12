import { z } from "zod";

export const physicianFormSchema = z.object({
  // Required fields
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "First name can only contain letters and spaces"),
  
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must be less than 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Last name can only contain letters and spaces"),
  
  specialty: z
    .string()
    .min(1, "Specialty is required"),
  
  npi: z
    .string()
    .min(1, "NPI is required")
    .regex(/^\d{10}$/, "NPI must be exactly 10 digits"),
  
  mpi: z
    .string()
    .min(1, "MPI is required")
    .regex(/^\d{1,10}$/, "MPI can only contain numbers (max 10 digits)"),
  
  phone: z
    .string()
    .min(1, "Phone is required")
    .regex(/^\(\d{3}\) \d{3}-\d{4}$/, "Phone must be in format (XXX) XXX-XXXX"),
  
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  
  type: z
    .string()
    .min(1, "Type is required"),
  
  // Optional fields
  fax: z
    .string()
    .regex(/^$|^\(\d{3}\) \d{3}-\d{4}$/, "Fax must be in format (XXX) XXX-XXXX or empty")
    .optional()
    .or(z.literal("")),
  
  // Switches
  active: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  
  // Address fields (all optional)
  companyName: z.string().max(100, "Company name must be less than 100 characters").optional().or(z.literal("")),
  address: z.string().max(200, "Address must be less than 200 characters").optional().or(z.literal("")),
  
  countryId: z.string().optional().or(z.literal("")),
  stateId: z.string().optional().or(z.literal("")),
  city: z
    .string()
    .max(100, "City must be less than 100 characters")
    .regex(/^$|^[a-zA-Z\s]+$/, "City can only contain letters and spaces")
    .optional()
    .or(z.literal("")),
  zipCode: z
    .string()
    .regex(/^$|^\d{5}$/, "ZIP Code must be exactly 5 digits or empty")
    .optional()
    .or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
});

export type PhysicianFormData = z.infer<typeof physicianFormSchema>;

export const getPhysicianFormDefaults = (): PhysicianFormData => ({
  firstName: "",
  lastName: "",
  specialty: "",
  npi: "",
  mpi: "",
  phone: "",
  fax: "",
  email: "",
  type: "",
  active: true,
  isDefault: false,
  companyName: "",
  address: "",
  countryId: "",
  stateId: "",
  city: "",
  zipCode: "",
  country: "United States",
  state: "",
});

