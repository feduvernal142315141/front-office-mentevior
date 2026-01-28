"use client"

import type { Applicant } from "@/lib/types/applicant.types"
import { FormBuilder } from "@/components/form/builder/FormBuilder"
import { applicantFormConfig } from "../../config/applicantFormConfig"
import { 
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
      customSections={(flashSection) => ({
        left: (
          <>
            <LanguagesSection applicant={applicant} flashSection={flashSection} />
            <AvailabilitySection applicant={applicant} flashSection={flashSection} />
            <ExperienceSection applicant={applicant} flashSection={flashSection} />
          </>
        ),
        right: (
          <>
            <ReferencesSection applicant={applicant} flashSection={flashSection} />
            <DocumentsSection applicant={applicant} flashSection={flashSection} />
            <ChecklistSection applicant={applicant} flashSection={flashSection} />
          </>
        )
      })}
    />
  )
}
