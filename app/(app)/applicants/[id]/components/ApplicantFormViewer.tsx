"use client"

import type { Applicant } from "@/lib/types/applicant.types"
import { FormBuilder } from "@/components/form/builder/FormBuilder"
import { applicantFormConfig } from "../../config/applicantFormConfig"
import { 
  CertificationSection,
  LanguagesSection, 
  AvailabilitySection, 
  ExperienceSection,
  ReferencesSection,
  DocumentsSection,
  ChecklistSection 
} from "./CustomSections"

interface ApplicantFormViewerProps {
  applicant: Applicant
}

export function ApplicantFormViewer({ applicant }: ApplicantFormViewerProps) {
  const config = applicantFormConfig(applicant)
  
  const handleSubmit = () => {
  }

  return (
    <FormBuilder
      config={config}
      onSubmit={handleSubmit}
      customSectionComponents={{
        certification: (flashSection) => <CertificationSection applicant={applicant} flashSection={flashSection} />,
        languages: (flashSection) => <LanguagesSection applicant={applicant} flashSection={flashSection} />,
        availability: (flashSection) => <AvailabilitySection applicant={applicant} flashSection={flashSection} />,
        experience: (flashSection) => <ExperienceSection applicant={applicant} flashSection={flashSection} />,
        references: (flashSection) => <ReferencesSection applicant={applicant} flashSection={flashSection} />,
        documents: (flashSection) => <DocumentsSection applicant={applicant} flashSection={flashSection} />,
        checklist: (flashSection) => <ChecklistSection applicant={applicant} flashSection={flashSection} />,
      }}
    />
  )
}
