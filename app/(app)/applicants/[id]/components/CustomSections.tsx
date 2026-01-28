"use client"

import type { Applicant } from "@/lib/types/applicant.types"
import { Badge } from "@/components/ui/badge"
import { FileText, Download } from "lucide-react"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { cn } from "@/lib/utils"

interface CustomSectionsProps {
  applicant: Applicant
  flashSection?: string | null
}

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric"
    })
  } catch {
    return dateString
  }
}

const renderReadOnlyInput = (label: string, value: string | number | undefined | null, required: boolean = false) => (
  <FloatingInput
    label={label}
    value={value !== null && value !== undefined ? String(value) : ""}
    onChange={() => {}}
    onBlur={() => {}}
    disabled={true}
    required={required}
  />
)

const renderReadOnlySelect = (label: string, value: string | undefined | null, required: boolean = false) => (
  <FloatingSelect
    label={label}
    value={value || ""}
    onChange={() => {}}
    options={[{ value: value || "", label: value || "-" }]}
    disabled={true}
    required={required}
  />
)

const SectionCard = ({ id, title, children, flashSection }: { id: string, title: string, children: React.ReactNode, flashSection?: string | null }) => {
  const isFlashing = flashSection === id
  
  return (
    <section id={id} className="scroll-mt-[100px]">
      <div className={cn(
        "rounded-3xl p-10 transition-all duration-500 backdrop-blur-[4px] bg-white/90 shadow-[0_8px_24px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60",
        isFlashing && "ring-2 ring-blue-500/60 shadow-[0_0_25px_rgba(37,99,235,0.35)]"
      )}>
        <h2 className="text-xl font-semibold tracking-tight text-[#037ECC]">
          {title}
        </h2>
        <div className="h-px mt-6 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
        <div className="mt-8">
          {children}
        </div>
      </div>
    </section>
  )
}

const SideSectionCard = ({ id, title, children, flashSection }: { id: string, title: string, children: React.ReactNode, flashSection?: string | null }) => {
  const isFlashing = flashSection === id
  
  return (
    <section id={id} className="scroll-mt-[100px]">
      <div className={cn(
        "rounded-3xl p-6 transition-all duration-300 backdrop-blur-[3px] bg-white/90 ring-1 ring-slate-200/60 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]",
        isFlashing && "ring-2 ring-[#2563EB] shadow-[0_0_0_4px_rgba(37,99,235,0.18)]"
      )}>
        <h3 className="text-[15px] font-semibold tracking-wide mb-1 text-[#037ECC]">
          {title}
        </h3>
        <div className="h-px my-3 bg-gradient-to-r from-transparent via-slate-300/40 to-transparent" />
        <div className="mt-4">
          {children}
        </div>
      </div>
    </section>
  )
}

export function LanguagesSection({ applicant, flashSection }: CustomSectionsProps) {
  return (
    <SectionCard id="languages" title="Languages Spoken" flashSection={flashSection}>
      <div className="space-y-6">
        {applicant.languagesSpoken && applicant.languagesSpoken.length > 0 ? (
          applicant.languagesSpoken.map((lang, idx) => (
            <div key={idx} className="p-6 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-4">{lang.language}</h3>
              <div className="grid grid-cols-3 gap-4">
                {renderReadOnlySelect("Write", lang.write || "-")}
                {renderReadOnlySelect("Read", lang.read || "-")}
                {renderReadOnlySelect("Speech", lang.speech || "-")}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No languages specified</p>
        )}
      </div>
    </SectionCard>
  )
}

export function AvailabilitySection({ applicant, flashSection }: CustomSectionsProps) {
  return (
    <SectionCard id="availability" title="Availability" flashSection={flashSection}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left p-3 text-sm font-semibold text-slate-700">Times</th>
              <th className="text-center p-3 text-sm font-semibold text-slate-700">Mon</th>
              <th className="text-center p-3 text-sm font-semibold text-slate-700">Tue</th>
              <th className="text-center p-3 text-sm font-semibold text-slate-700">Wed</th>
              <th className="text-center p-3 text-sm font-semibold text-slate-700">Thu</th>
              <th className="text-center p-3 text-sm font-semibold text-slate-700">Fri</th>
              <th className="text-center p-3 text-sm font-semibold text-slate-700">Sat</th>
              <th className="text-center p-3 text-sm font-semibold text-slate-700">Sun</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(applicant.availability || {}).map(([timeSlot, days]) => (
              <tr key={timeSlot} className="border-b border-slate-100">
                <td className="p-3 text-sm text-slate-900 font-medium">{timeSlot}</td>
                {["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((day) => (
                  <td key={day} className="p-3 text-center">
                    {days[day as keyof typeof days] ? (
                      <div className="w-4 h-4 bg-green-500 rounded-full mx-auto"></div>
                    ) : (
                      <div className="w-4 h-4 bg-slate-200 rounded-full mx-auto"></div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}

export function ExperienceSection({ applicant, flashSection }: CustomSectionsProps) {
  return (
    <SectionCard id="experience" title="Professional Experience (Starting from current or most recent)" flashSection={flashSection}>
      <div className="space-y-6">
        {applicant.professionalExperiences && applicant.professionalExperiences.length > 0 ? (
          applicant.professionalExperiences.map((exp, idx) => (
            <div key={exp.id || idx} className="p-6 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 mb-6">
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  Experience #{idx + 1}
                </Badge>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  {renderReadOnlyInput("Employer", exp.employer)}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {renderReadOnlyInput("Start Date", formatDate(exp.startDate))}
                  {renderReadOnlyInput("End Date", formatDate(exp.endDate))}
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {renderReadOnlyInput("Position/Job Title", exp.positionJobTitle)}
                  {renderReadOnlyInput("Immediate Supervisor", exp.immediateSupervisor)}
                  {renderReadOnlyInput("Phone Number", exp.phoneNumber)}
                  {renderReadOnlyInput("Address", exp.address)}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {renderReadOnlyInput("City", exp.city)}
                  {renderReadOnlySelect("State", exp.state)}
                  {renderReadOnlyInput("Zip Code", exp.zipCode)}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {renderReadOnlySelect("May We Contact", exp.mayWeContact ? "Yes" : "No")}
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Reason for Leaving</label>
                    <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 min-h-[80px]">
                      {exp.reasonForLeaving || "-"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No professional experience listed</p>
        )}
      </div>
    </SectionCard>
  )
}

export function ReferencesSection({ applicant, flashSection }: CustomSectionsProps) {
  return (
    <SideSectionCard id="references" title="Professional References" flashSection={flashSection}>
      <div className="space-y-6">
        {applicant.professionalReferences && applicant.professionalReferences.length > 0 ? (
          applicant.professionalReferences.map((ref, idx) => (
            <div key={ref.id || idx} className="p-6 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Reference #{idx + 1}
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {renderReadOnlyInput("First Name", ref.firstName)}
                {renderReadOnlyInput("Last Name", ref.lastName)}
                {renderReadOnlyInput("Phone Number", ref.phoneNumber)}
                {renderReadOnlyInput("Relationship", ref.relationship)}
                {renderReadOnlyInput("Relationship Time", ref.relationshipTime)}
                {renderReadOnlyInput("Place of Reference", ref.placeOfReference)}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No professional references listed</p>
        )}
      </div>
    </SideSectionCard>
  )
}

export function DocumentsSection({ applicant, flashSection }: CustomSectionsProps) {
  return (
    <SideSectionCard id="documents" title="Documents required to be attached to this application" flashSection={flashSection}>
      <div className="space-y-4">
        {applicant.documents.resumeUrl && (
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-slate-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">Resume</p>
                <p className="text-xs text-slate-500">{applicant.documents.resumeFileName || "resume.pdf"}</p>
              </div>
            </div>
            <a
              href={applicant.documents.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 text-[#037ECC]" />
            </a>
          </div>
        )}
        {applicant.documents.professionalCredentialsUrl && (
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-slate-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">Professional Credentials</p>
                <p className="text-xs text-slate-500">{applicant.documents.professionalCredentialsFileName || "credentials.pdf"}</p>
              </div>
            </div>
            <a
              href={applicant.documents.professionalCredentialsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 text-[#037ECC]" />
            </a>
          </div>
        )}
        {applicant.documents.othersUrl && (
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-slate-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">Others</p>
                <p className="text-xs text-slate-500">{applicant.documents.othersFileName || "document.pdf"}</p>
              </div>
            </div>
            <a
              href={applicant.documents.othersUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 text-[#037ECC]" />
            </a>
          </div>
        )}
        {!applicant.documents.resumeUrl && !applicant.documents.professionalCredentialsUrl && !applicant.documents.othersUrl && (
          <p className="text-sm text-slate-500">No documents uploaded</p>
        )}
      </div>
    </SideSectionCard>
  )
}

export function ChecklistSection({ applicant, flashSection }: CustomSectionsProps) {
  return (
    <SideSectionCard id="checklist" title="Mark if you currently have the following documents" flashSection={flashSection}>
      <div className="grid grid-cols-1 gap-3">
        {[
          { label: "Liability Insurance", value: applicant.hasLiabilityInsurance },
          { label: "Social Security Card (Original)", value: applicant.hasSocialSecurityCard },
          { label: "Physical Examination (TB Test)", value: applicant.hasPhysicalExamination },
          { label: "CPR/AED/First AID (In person)", value: applicant.hasCPRAED },
          { label: "Zero tolerance", value: applicant.hasZeroTolerance },
          { label: "HIV AIDS", value: applicant.hasHIVAIDS },
          { label: "Auto Insurance", value: applicant.hasAutoInsurance },
          { label: "High School Diploma or higher", value: applicant.hasHighSchoolDiploma },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-sm text-slate-900">{label}</span>
            <Badge
              variant={value ? "default" : "secondary"}
              className={value ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-100 text-gray-600"}
            >
              {value ? "Yes" : "No"}
            </Badge>
          </div>
        ))}
      </div>
    </SideSectionCard>
  )
}
