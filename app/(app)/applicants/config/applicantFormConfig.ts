import type { FormConfig } from "@/components/form/builder/FormBuilder.types"
import { applicantViewerSchema, type ApplicantViewerFormData } from "../schemas/applicant.schema"
import type { Applicant } from "@/lib/types/applicant.types"

function applicantToFormData(applicant: Applicant): ApplicantViewerFormData {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ""
      return date.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric"
      })
    } catch {
      return dateString
    }
  }

  return {
    // General Information
    firstName: applicant.firstName,
    middleName: applicant.middleName || "",
    lastName: applicant.lastName,
    emailAddress: applicant.emailAddress,
    phoneNumber: applicant.phoneNumber,
    dateOfBirth: formatDate(applicant.dateOfBirth),
    gender: applicant.gender,
    socialSecurityNumber: applicant.socialSecurityNumber,
    yearsOfExperience: applicant.yearsOfExperience?.toString() || "",
    address1: applicant.address1,
    address2: applicant.address2 || "",
    city: applicant.city,
    state: applicant.state,
    zipCode: applicant.zipCode,
    
    // Certification Information
    currentCertification: applicant.currentCertification,
    licenseNumber: applicant.licenseNumber,
    licenseExpirationDate: formatDate(applicant.licenseExpirationDate),
    npi: applicant.npi || "",
    
    // Emergency Contact
    emergencyContactFirstName: applicant.emergencyContactFirstName,
    emergencyContactLastName: applicant.emergencyContactLastName,
    emergencyContactPhoneNumber: applicant.emergencyContactPhoneNumber,
    emergencyContactEmailAddress: applicant.emergencyContactEmailAddress || "",
    emergencyContactRelationship: applicant.emergencyContactRelationship,
    
    // Education
    educationType: applicant.educationType,
    degree: applicant.degree,
    majorOrEmphasis: applicant.majorOrEmphasis || "",
    schoolName: applicant.schoolName,
    dateOfCompletion: formatDate(applicant.dateOfCompletion),
    
    // Other Information
    authorizedToWorkInUS: applicant.authorizedToWorkInUS ? "Yes" : "No",
    hasCompletedLevel2BackgroundScreening: applicant.hasCompletedLevel2BackgroundScreening ? "Yes" : "No",
    howDidYouHearAboutUs: applicant.howDidYouHearAboutUs,
    behaviorAnalysisExperienceDescription: applicant.behaviorAnalysisExperienceDescription || "",
    
    // Documents Checklist
    hasLiabilityInsurance: applicant.hasLiabilityInsurance ? "Yes" : "No",
    hasSocialSecurityCard: applicant.hasSocialSecurityCard ? "Yes" : "No",
    hasPhysicalExamination: applicant.hasPhysicalExamination ? "Yes" : "No",
    hasCPRAED: applicant.hasCPRAED ? "Yes" : "No",
    hasZeroTolerance: applicant.hasZeroTolerance ? "Yes" : "No",
    hasHIVAIDS: applicant.hasHIVAIDS ? "Yes" : "No",
    hasAutoInsurance: applicant.hasAutoInsurance ? "Yes" : "No",
    hasHighSchoolDiploma: applicant.hasHighSchoolDiploma ? "Yes" : "No",
  }
}

export const applicantFormConfig = (applicant: Applicant): FormConfig<ApplicantViewerFormData> => {
  return {
    title: "Applicant Information",
    subtitle: "Job Application Details",
    schema: applicantViewerSchema,
    defaultValues: applicantToFormData(applicant),
    layout: "single-column",
    
    sections: [
      {
        id: "general",
        title: "General Information",
        tabLabel: "General",
        columns: 3,
        fields: [
          { name: "firstName", label: "First Name", type: "text", required: true, disabled: true },
          { name: "middleName", label: "Middle Name", type: "text", disabled: true },
          { name: "lastName", label: "Last Name", type: "text", required: true, disabled: true },
          { name: "emailAddress", label: "Email Address", type: "email", required: true, disabled: true },
          { name: "phoneNumber", label: "Phone Number", type: "text", required: true, disabled: true },
          { name: "dateOfBirth", label: "Date of Birth", type: "text", disabled: true },
          { 
            name: "gender", 
            label: "Gender", 
            type: "select", 
            disabled: true,
            options: [
              { value: applicant.gender || "", label: applicant.gender || "-" }
            ]
          },
          { name: "socialSecurityNumber", label: "Social Security Number", type: "text", required: true, disabled: true },
          { name: "yearsOfExperience", label: "Years of Experience", type: "text", disabled: true },
          { name: "address1", label: "Address 1", type: "text", required: true, disabled: true },
          { name: "address2", label: "Address 2", type: "text", disabled: true },
          { name: "city", label: "City", type: "text", required: true, disabled: true },
          { 
            name: "state", 
            label: "State", 
            type: "select", 
            required: true, 
            disabled: true,
            options: [
              { value: applicant.state || "", label: applicant.state || "-" }
            ]
          },
          { name: "zipCode", label: "Zip Code", type: "text", required: true, disabled: true },
        ]
      },
      
      {
        id: "certification",
        title: "Certification Information",
        tabLabel: "Certification",
        columns: 3,
        fields: [] 
      },
      
      {
        id: "emergency",
        title: "Emergency Contact",
        tabLabel: "Emergency",
        columns: 3,
        fields: [
          { name: "emergencyContactFirstName", label: "First Name", type: "text", disabled: true },
          { name: "emergencyContactLastName", label: "Last Name", type: "text", disabled: true },
          { name: "emergencyContactPhoneNumber", label: "Phone Number", type: "text", disabled: true },
          { name: "emergencyContactEmailAddress", label: "Email Address", type: "email", disabled: true },
          { name: "emergencyContactRelationship", label: "Relationship", type: "text", disabled: true },
        ]
      },
      
      {
        id: "languages",
        title: "Languages Spoken",
        tabLabel: "Languages",
        columns: 3,
        fields: [] 
      },
      
      {
        id: "availability",
        title: "Availability",
        tabLabel: "Availability",
        columns: 1,
        fields: [] 
      },
      
      {
        id: "experience",
        title: "Professional Experience (Starting from current or most recent)",
        tabLabel: "Experience",
        columns: 3,
        fields: []
      },
      
      {
        id: "education",
        title: "Education (please enter your higher degree)",
        tabLabel: "Education",
        columns: 3,
        fields: [
          { 
            name: "educationType", 
            label: "Type", 
            type: "select", 
            required: true, 
            disabled: true,
            options: [
              { value: applicant.educationType || "", label: applicant.educationType || "-" }
            ]
          },
          { name: "degree", label: "Degree", type: "text", required: true, disabled: true },
          { name: "majorOrEmphasis", label: "Major or Emphasis", type: "text", disabled: true },
          { name: "schoolName", label: "School Name", type: "text", disabled: true },
          { name: "dateOfCompletion", label: "Date of Completion", type: "text", disabled: true },
        ]
      },
      
      {
        id: "references",
        title: "Professional References",
        tabLabel: "References",
        columns: 3,
        fields: [] 
      },
      
      {
        id: "documents",
        title: "Documents required to be attached to this application",
        tabLabel: "Documents",
        columns: 1,
        fields: [] 
      },
      
      {
        id: "other",
        title: "Other Information",
        tabLabel: "Other",
        columns: 3,
        fields: [
          { 
            name: "authorizedToWorkInUS", 
            label: "Are you authorized to legally work in the U.S.?", 
            type: "select", 
            disabled: true,
            options: [
              { value: applicant.authorizedToWorkInUS ? "Yes" : "No", label: applicant.authorizedToWorkInUS ? "Yes" : "No" }
            ]
          },
          { 
            name: "hasCompletedLevel2BackgroundScreening", 
            label: "Have you completed a Level 2 Background screening?", 
            type: "select", 
            disabled: true,
            options: [
              { value: applicant.hasCompletedLevel2BackgroundScreening ? "Yes" : "No", label: applicant.hasCompletedLevel2BackgroundScreening ? "Yes" : "No" }
            ]
          },
          { 
            name: "howDidYouHearAboutUs", 
            label: "How did you hear about us", 
            type: "select", 
            disabled: true,
            options: [
              { value: applicant.howDidYouHearAboutUs || "", label: applicant.howDidYouHearAboutUs || "-" }
            ]
          },
          { 
            name: "behaviorAnalysisExperienceDescription", 
            label: "Briefly, please describe your experience in the Behavior Analysis field", 
            type: "textarea", 
            disabled: true,
            colSpan: 3
          },
        ]
      },
      
      {
        id: "checklist",
        title: "Mark if you currently have the following documents",
        tabLabel: "Checklist",
        columns: 3,
        fields: [] 
      },
    ]
  }
}
