
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
import { useAccountProfile } from "@/lib/modules/account-profile/hooks/use-account-profile"
import { useUpdateAccountProfile } from "@/lib/modules/account-profile/hooks/use-update-account-profile"

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
      form.reset({
        legalName: accountProfile.legalName,
        agencyEmail: accountProfile.agencyEmail,
        phoneNumber: accountProfile.phoneNumber,
        fax: accountProfile.fax || "",
        webSite: accountProfile.webSite || "",
        ein: accountProfile.ein,
        npi: accountProfile.npi,
        mpi: accountProfile.mpi,
        taxonomyCode: accountProfile.taxonomyCode,
        logo: accountProfile.logo || "",
      })
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
        form.reset({
          legalName: accountProfile.legalName,
          agencyEmail: accountProfile.agencyEmail,
          phoneNumber: accountProfile.phoneNumber,
          fax: accountProfile.fax || "",
          webSite: accountProfile.webSite || "",
          ein: accountProfile.ein,
          npi: accountProfile.npi,
          mpi: accountProfile.mpi,
          taxonomyCode: accountProfile.taxonomyCode,
          logo: accountProfile.logo || "",
        })
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
