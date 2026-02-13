"use client"

import { FormProvider, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { 
  generalInformationSchema, 
  type GeneralInformationFormValues,
  getGeneralInformationDefaults,
} from "@/lib/schemas/general-information.schema"
import { PersonalInformationSection } from "./PersonalInformationSection"
import { ProfessionalInformationSection } from "./ProfessionalInformationSection"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useGeneralInformation } from "@/lib/modules/general-information/hooks/use-general-information"
import { useUpdateGeneralInformation } from "@/lib/modules/general-information/hooks/use-update-general-information"
import type { GeneralInformation } from "@/lib/types/general-information.types"
import type { UpdateGeneralInformationDto } from "@/lib/types/general-information.types"
import { useAuth } from "@/lib/hooks/use-auth"

/**
 * Maps the backend response (nested objects) to flat form values.
 */
function mapToFormValues(data: GeneralInformation): GeneralInformationFormValues {
  return {
    id: data.id ?? "",
    firstName: data.firstName ?? "",
    lastName: data.lastName ?? "",
    birthday: data.birthday ? data.birthday.split("T")[0] : "",
    country: data.country?.name ?? "United States",
    state: data.state?.id ?? "",
    city: data.city ?? "",
    zipCode: data.zipCode ?? "",
    homeAddressLine1: data.homeAddressLine1 ?? "",
    email: data.email ?? "",
    cellphone: data.cellphone ?? "",
    roleId: data.role?.id ?? "",
    roleName: data.role?.name ?? "",
    hiringDate: data.hiringDate ? data.hiringDate.split("T")[0] : "",
    ssn: data.ssn ?? "",
    npi: data.professionalInfo?.npi ?? "",
    mpi: data.professionalInfo?.mpi ?? "",
    caqhNumber: data.professionalInfo?.caqhNumber ?? "",
    companyName: data.professionalInfo?.companyName ?? "",
    ein: data.professionalInfo?.ein ?? "",
    employerId: data.professionalInfo?.employerId ?? "",
  }
}

/**
 * Maps flat form values to the DTO expected by the PUT endpoint.
 */
function mapToDto(data: GeneralInformationFormValues): UpdateGeneralInformationDto {
  return {
    id: data.id || null,
    firstName: data.firstName,
    lastName: data.lastName,
    birthday: data.birthday,
    country: data.country,
    stateId: data.state,
    city: data.city,
    zipCode: data.zipCode,
    homeAddressLine1: data.homeAddressLine1,
    email: data.email,
    cellphone: data.cellphone,
    roleId: data.roleId,
    hiringDate: data.hiringDate,
    ssn: data.ssn.replace(/\D/g, ""), // Send only digits to backend
    npi: data.npi ?? "",
    mpi: data.mpi ?? "",
    caqhNumber: data.caqhNumber ?? "",
    companyName: data.companyName ?? "",
    ein: data.ein ?? "",
    employerId: data.employerId ?? "",
  }
}

interface GeneralInformationFormProps {
  memberUserId: string | null
  onCancelRoute?: string
  onSuccessRoute?: string
}

export function GeneralInformationForm({
  memberUserId,
  onCancelRoute = "/my-profile",
  onSuccessRoute = "/my-profile",
}: GeneralInformationFormProps) {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { generalInformation, isLoading } = useGeneralInformation(memberUserId)
  const { update, isLoading: isSubmitting } = useUpdateGeneralInformation()

  const roleValue = currentUser?.role || (currentUser as any)?.roleName || ""
  const normalizedRole = String(roleValue).replace(/[\s_-]/g, "").toLowerCase()
  const isSuperAdmin = normalizedRole.includes("superadmin")
  const isEditingSelf = currentUser?.id && memberUserId ? currentUser.id === memberUserId : false
  const canEditRole = isSuperAdmin && !isEditingSelf

  const form = useForm<GeneralInformationFormValues>({
    resolver: zodResolver(generalInformationSchema),
    defaultValues: getGeneralInformationDefaults(),
  })

  useEffect(() => {
    if (generalInformation) {
      form.reset(mapToFormValues(generalInformation))
    }
  }, [generalInformation, form])

  const onSubmit = async (data: GeneralInformationFormValues) => {
    const dto = {
      ...mapToDto(data),
      ...(memberUserId ? { memberUserId } : {}),
    }
    const result = await update(dto)

    if (result) {
      setTimeout(() => {
        router.push(onSuccessRoute)
      }, 500)
    }
  }

  const handleCancel = () => {
    router.push(onCancelRoute)
  }

  if (isLoading) {
    return (
      <div className="space-y-8 pb-24">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6" />
          <div className="border-t border-gray-200 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>

        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6" />
          <div className="border-t border-gray-200 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="pb-24 space-y-8">
          <PersonalInformationSection canEditRole={canEditRole} />
          <ProfessionalInformationSection />
        </div>

        <FormBottomBar
          isSubmitting={isSubmitting}
          onCancel={handleCancel}
          submitText="Update Information"
        />
      </form>
    </FormProvider>
  )
}
