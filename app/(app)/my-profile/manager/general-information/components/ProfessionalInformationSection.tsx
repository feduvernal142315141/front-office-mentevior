"use client"

import { Controller, useFormContext, useWatch } from "react-hook-form"
import { CollapsableSection } from "@/components/custom/CollapsableSection"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { Briefcase } from "lucide-react"
import { useRoles } from "@/lib/modules/roles/hooks/use-roles"
import { useMemo } from "react"

export function ProfessionalInformationSection() {
  const { control } = useFormContext()
  const { roles } = useRoles()
  
  const roleId = useWatch({ control, name: "roleId" })
  
  const shouldShowSection = useMemo(() => {
    if (!roleId || !roles.length) return true
    
    const selectedRole = roles.find((r) => r.id === roleId)
    if (!selectedRole) return true
    
    const roleName = selectedRole.name.toLowerCase()
    return ["rbt", "bcba", "bcaba", "supervisor"].some((r) => roleName.includes(r))
  }, [roleId, roles])

  const requiresCompanyAndEIN = useMemo(() => {
    if (!roleId || !roles.length) return false
    
    const selectedRole = roles.find((r) => r.id === roleId)
    if (!selectedRole) return false
    
    const roleName = selectedRole.name.toLowerCase()
    return ["rbt", "bcba", "bcaba"].some((r) => roleName.includes(r))
  }, [roleId, roles])

  return (
    <CollapsableSection
      title="Professional Information"
      subtitle="Credentials and professional details"
      icon={<Briefcase className="w-4 h-4" />}
      defaultOpen={true}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Controller
          name="npi"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="National Provider ID (NPI)"
                value={field.value}
                onChange={(value) => {
                  const cleanValue = value.replace(/\D/g, "")
                  field.onChange(cleanValue)
                }}
                onBlur={field.onBlur}
                placeholder=" "
                hasError={!!fieldState.error}
                type="text"
                required
              />
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />

        <Controller
          name="mpi"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="Medicaid / Medicare Number (MPI)"
                value={field.value}
                onChange={(value) => {
                  const cleanValue = value.replace(/\D/g, "")
                  field.onChange(cleanValue)
                }}
                onBlur={field.onBlur}
                placeholder=" "
                hasError={!!fieldState.error}
                type="text"
                required
              />
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />

        <Controller
          name="caqhNumber"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="CAQH Number"
                value={field.value}
                onChange={(value) => {
                  const cleanValue = value.replace(/\D/g, "")
                  field.onChange(cleanValue)
                }}
                onBlur={field.onBlur}
                placeholder=" "
                hasError={!!fieldState.error}
                type="text"
                required
              />
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />

        <Controller
          name="companyName"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="Company Name"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder=" "
                hasError={!!fieldState.error}
                required={requiresCompanyAndEIN}
              />
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />

        <Controller
          name="ein"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="Employer Identification Number (EIN)"
                value={field.value}
                onChange={(value) => {
                  const cleanValue = value.replace(/\D/g, "")
                  field.onChange(cleanValue)
                }}
                onBlur={field.onBlur}
                placeholder=" "
                hasError={!!fieldState.error}
                type="text"
                required={requiresCompanyAndEIN}
              />
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />

        <Controller
          name="employerId"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="Employer ID"
                value={field.value}
                onChange={(value) => {
                  const cleanValue = value.replace(/\D/g, "")
                  field.onChange(cleanValue)
                }}
                onBlur={field.onBlur}
                placeholder=" "
                hasError={!!fieldState.error}
                type="text"
                required
              />
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />
      </div>
    </CollapsableSection>
  )
}
