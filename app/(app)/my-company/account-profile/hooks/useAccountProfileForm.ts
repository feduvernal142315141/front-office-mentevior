
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  accountProfileSchema, 
  getAccountProfileDefaults, 
  type AccountProfileFormValues 
} from "@/lib/schemas/account-profile.schema"
import type { UpdateAccountProfileDto } from "@/lib/types/account-profile.types"
import type { AccountProfile } from "@/lib/types/account-profile.types"
import { useAccountProfile } from "@/lib/modules/account-profile/hooks/use-account-profile"
import { useUpdateAccountProfile } from "@/lib/modules/account-profile/hooks/use-update-account-profile"

/**
 * Mapea la respuesta del API a los valores del form. Ojo con
 * `chartStartNumber`: el backend lo devuelve como número y el schema lo valida
 * como string, así que hay que normalizarlo o zod falla con
 * "Expected string, received number" apenas se abre la pantalla.
 */
function toFormValues(profile: AccountProfile): AccountProfileFormValues {
  return {
    legalName: profile.legalName,
    agencyEmail: profile.agencyEmail,
    phoneNumber: profile.phoneNumber,
    fax: profile.fax || "",
    webSite: profile.webSite || "",
    ein: profile.ein,
    npi: profile.npi,
    mpi: profile.mpi,
    taxonomyCode: profile.taxonomyCode,
    logo: profile.logo || "",
    chartPrefix: profile.chartPrefix || "BA",
    chartStartNumber: profile.chartStartNumber != null ? String(profile.chartStartNumber) : "1",
  }
}

interface UseAccountProfileFormReturn {
  form: ReturnType<typeof useForm<AccountProfileFormValues>>
  
  isLoadingData: boolean
  isSubmitting: boolean
  
  onSubmit: (data: AccountProfileFormValues) => Promise<void>
  
  actions: {
    cancel: () => void
  }
}

export function useAccountProfileForm(): UseAccountProfileFormReturn {
  const router = useRouter()
  
  const { accountProfile, isLoading: isLoadingData } = useAccountProfile()
  const { update, isLoading: isUpdating } = useUpdateAccountProfile()
  
  const isSubmitting = isUpdating

  const form = useForm<AccountProfileFormValues>({
    resolver: zodResolver(accountProfileSchema),
    defaultValues: getAccountProfileDefaults(),
  })
  
  useEffect(() => {
    if (accountProfile) {
      form.reset(toFormValues(accountProfile))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountProfile])
  
  const onSubmit = async (data: AccountProfileFormValues) => {
    let cleanLogo = data.logo || ""
    if (cleanLogo.startsWith("data:image")) {
      const base64Index = cleanLogo.indexOf("base64,")
      if (base64Index !== -1) {
        cleanLogo = cleanLogo.substring(base64Index + 7)
      }
    }

    const dto: UpdateAccountProfileDto = {
      legalName: data.legalName,
      agencyEmail: data.agencyEmail,
      phoneNumber: data.phoneNumber,
      fax: data.fax || "",
      webSite: data.webSite || "",
      ein: data.ein,
      npi: data.npi,
      mpi: data.mpi,
      taxonomyCode: data.taxonomyCode,
      logo: cleanLogo,
      chartPrefix: data.chartPrefix,
      chartStartNumber: data.chartStartNumber,
    }
    
    const result = await update(dto)
    
    if (result) {
      console.log("Account profile updated successfully")
      router.push("/my-company")
    }
  }

  const actions = {
    cancel: () => {
      if (accountProfile) {
        form.reset(toFormValues(accountProfile))
      }
      router.push("/my-company")
    },
  }
  
  return {
    form,
    isLoadingData,
    isSubmitting,
    onSubmit,
    actions,
  }
}
