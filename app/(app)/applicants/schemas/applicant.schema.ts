import { z } from "zod"


export const applicantViewerSchema = z.object({
  // General Information
  firstName: z.string().optional(),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  emailAddress: z.string().optional(),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  socialSecurityNumber: z.string().optional(),
  yearsOfExperience: z.union([z.number(), z.string()]).optional(),
  address1: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  
  // Certification Information
  currentCertification: z.string().optional(),
  licenseNumber: z.string().optional(),
  licenseExpirationDate: z.string().optional(),
  npi: z.string().optional(),
  
  // Emergency Contact
  emergencyContactFirstName: z.string().optional(),
  emergencyContactLastName: z.string().optional(),
  emergencyContactPhoneNumber: z.string().optional(),
  emergencyContactEmailAddress: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  
  // Education
  educationType: z.string().optional(),
  degree: z.string().optional(),
  majorOrEmphasis: z.string().optional(),
  schoolName: z.string().optional(),
  dateOfCompletion: z.string().optional(),
  
  // Other Information
  authorizedToWorkInUS: z.union([z.boolean(), z.string()]).optional(),
  hasCompletedLevel2BackgroundScreening: z.union([z.boolean(), z.string()]).optional(),
  howDidYouHearAboutUs: z.string().optional(),
  behaviorAnalysisExperienceDescription: z.string().optional(),
  
  // Documents Checklist
  hasLiabilityInsurance: z.union([z.boolean(), z.string()]).optional(),
  hasSocialSecurityCard: z.union([z.boolean(), z.string()]).optional(),
  hasPhysicalExamination: z.union([z.boolean(), z.string()]).optional(),
  hasCPRAED: z.union([z.boolean(), z.string()]).optional(),
  hasZeroTolerance: z.union([z.boolean(), z.string()]).optional(),
  hasHIVAIDS: z.union([z.boolean(), z.string()]).optional(),
  hasAutoInsurance: z.union([z.boolean(), z.string()]).optional(),
  hasHighSchoolDiploma: z.union([z.boolean(), z.string()]).optional(),
})

export type ApplicantViewerFormData = z.infer<typeof applicantViewerSchema>
