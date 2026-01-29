// Applicant types - Job application form data
// These types represent the complete job application form filled by applicants through the landing page

export interface ApplicantProfessionalExperience {
  id?: string
  employer: string
  startDate: string
  endDate: string
  positionJobTitle: string
  immediateSupervisor: string
  phoneNumber: string
  address: string
  city: string
  state: string
  zipCode: string
  mayWeContact: boolean
  reasonForLeaving: string
}

export interface ApplicantProfessionalReference {
  id?: string
  firstName: string
  lastName: string
  phoneNumber: string
  relationship: string
  relationshipTime: string
  placeOfReference: string
}

export interface ApplicantLanguageSkill {
  language: string
  write: "basic" | "intermediate" | "fluent" | "native" | ""
  read: "basic" | "intermediate" | "fluent" | "native" | ""
  speech: "basic" | "intermediate" | "fluent" | "native" | ""
}

export interface ApplicantAvailability {
  [timeSlot: string]: {
    mon?: boolean
    tue?: boolean
    wed?: boolean
    thu?: boolean
    fri?: boolean
    sat?: boolean
    sun?: boolean
  }
}

export interface ApplicantDocuments {
  resumeUrl?: string
  resumeFileName?: string
  professionalCredentialsUrl?: string
  professionalCredentialsFileName?: string
  othersUrl?: string
  othersFileName?: string
}

export interface Applicant {
  id: string
  
  // General Information
  firstName: string
  middleName?: string
  lastName: string
  emailAddress: string
  phoneNumber: string
  dateOfBirth: string
  gender: string
  socialSecurityNumber: string
  yearsOfExperience: number
  address1: string
  address2?: string
  city: string
  state: string
  zipCode: string
  
  // Certification Information
  currentCertification: string
  licenseNumber: string
  licenseExpirationDate?: string
  licenceExpirationDate?: string
  npi?: string
  insurancesCurrentlyLicensedWith?: string[]
  
  // Emergency Contact
  emergencyContactFirstName: string
  emergencyContactLastName: string
  emergencyContactPhoneNumber: string
  emergencyContactEmailAddress?: string
  emergencyContactRelationship: string
  
  // Languages Spoken
  languagesSpoken: ApplicantLanguageSkill[]
  
  // Availability
  availability: ApplicantAvailability
  
  // Professional Experience
  professionalExperiences: ApplicantProfessionalExperience[]
  
  // Education
  educationType: string
  degree: string
  majorOrEmphasis?: string
  schoolName: string
  dateOfCompletion: string
  
  // Professional References
  professionalReferences: ApplicantProfessionalReference[]
  
  // Documents
  documents: ApplicantDocuments
  
  // Other Information
  authorizedToWorkInUS: boolean
  hasCompletedLevel2BackgroundScreening: boolean
  howDidYouHearAboutUs: string
  behaviorAnalysisExperienceDescription?: string
  
  // Documents Checklist
  hasLiabilityInsurance: boolean
  hasSocialSecurityCard: boolean
  hasPhysicalExamination: boolean
  hasCPRAED: boolean
  hasZeroTolerance: boolean
  hasHIVAIDS: boolean
  hasAutoInsurance: boolean
  hasHighSchoolDiploma: boolean
  
  // System fields
  isRead: boolean
  companyId: string
  createdAt: string
  updatedAt?: string
}

export interface ApplicantsListResponse {
  data: {
    entities: Applicant[]
    totalElements: number
    totalPages: number
    currentPage: number
  }
}

export interface ApplicantResponse {
  data: Applicant
}

export interface MarkApplicantAsReadRequest {
  applicantId: string
  isRead: boolean
}
