import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo } from "react"
import { useCreateCredential } from "@/lib/modules/credentials/hooks/use-create-credential"
import { useUpdateCredential } from "@/lib/modules/credentials/hooks/use-update-credential"
import { useCredentialById } from "@/lib/modules/credentials/hooks/use-credential-by-id"
import { useBillingCodes } from "@/lib/modules/billing-codes/hooks/use-billing-codes"
import { credentialFormSchema, getCredentialFormDefaults, type CredentialFormValues } from "@/lib/schemas/credential-form.schema"
import type { CreateCredentialDto, UpdateCredentialDto } from "@/lib/types/credential.types"

interface UseCredentialFormProps {
  credentialId?: string | null
}

interface UseCredentialFormReturn {
  form: ReturnType<typeof useForm<CredentialFormValues>>
  
  mode: "create" | "edit"
  isEditing: boolean
  isLoadingCredential: boolean
  
  onSubmit: (data: CredentialFormValues) => Promise<void>
  isSubmitting: boolean

  billingCodeOptions: { id: string; code: string; type: string }[]
  isLoadingBillingCodes: boolean

  actions: {
    goToList: () => void
  }
}

export function useCredentialForm({ credentialId = null }: UseCredentialFormProps = {}): UseCredentialFormReturn {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditing = !!credentialId
  const mode = isEditing ? "edit" : "create"
  
  const { create, isLoading: isCreating } = useCreateCredential()
  const { update, isLoading: isUpdating } = useUpdateCredential()
  const { credential, isLoading: isLoadingCredential } = useCredentialById(credentialId)
  
  const { billingCodes: allBillingCodes, isLoading: isLoadingBillingCodes } = useBillingCodes({
    page: 0,
    pageSize: 1000,
    filters: [],
  })
  
  const billingCodeOptions = useMemo(() => {
    if (!allBillingCodes) return []
    
    return allBillingCodes.map(bc => ({
      id: bc.id,
      code: bc.code,
      type: bc.type,
    }))
  }, [allBillingCodes])
  
  const isSubmitting = isCreating || isUpdating

  const form = useForm<CredentialFormValues>({
    resolver: zodResolver(credentialFormSchema),
    defaultValues: getCredentialFormDefaults(),
    mode: "onChange",
  })
  
  useEffect(() => {
    if (!isEditing && searchParams) {
      const catalogMode = searchParams.get("mode")
      
      if (catalogMode === "catalog") {
        const catalogId = searchParams.get("catalogId")
        const name = searchParams.get("name")
        const shortName = searchParams.get("shortName")
        const organizationName = searchParams.get("organizationName")
        const website = searchParams.get("website")
        const description = searchParams.get("description")
        const taxonomyCode = searchParams.get("taxonomyCode")
        
        if (name && shortName) {
          form.reset({
            name,
            shortName,
            organizationName: organizationName || "",
            website: website || "",
            taxonomyCode: taxonomyCode || "",
            description: description || "",
            billingCodeIds: [],
            active: true,
            catalogId: catalogId || undefined,
          })
        }
      }
    }
  }, [isEditing, searchParams, form])
  
  useEffect(() => {
    if (credential && isEditing) {
      form.reset({
        name: credential.name,
        shortName: credential.shortName,
        organizationName: credential.organizationName || "",
        website: credential.website || "",
        taxonomyCode: credential.taxonomyCode,
        description: credential.description || "",
        billingCodeIds: credential.billingCodes || credential.allowedBillingCodes || [],
        active: credential.active ?? true,
      })
    }
  }, [credential, isEditing, form])
  
  const onSubmit = async (data: CredentialFormValues) => {
    if (isEditing && credentialId) {
      const dto: UpdateCredentialDto = {
        id: credentialId,
        name: data.name,
        shortName: data.shortName,
        organizationName: data.organizationName || undefined,
        website: data.website || undefined,
        taxonomyCode: data.taxonomyCode,
        description: data.description || undefined,
        billingCodes: data.billingCodeIds && data.billingCodeIds.length > 0 ? data.billingCodeIds : undefined,
      }
      
      const result = await update(dto)
      
      if (result) {
        setTimeout(() => {
          router.push("/my-company/credentials")
        }, 1500)
      }
    } else {
      const dto: CreateCredentialDto = {
        name: data.name,
        shortName: data.shortName,
        organizationName: data.organizationName || undefined,
        website: data.website || undefined,
        taxonomyCode: data.taxonomyCode,
        description: data.description || undefined,
        billingCodes: data.billingCodeIds && data.billingCodeIds.length > 0 ? data.billingCodeIds : undefined,
      }
      
      const result = await create(dto)
      
      if (result) {
        setTimeout(() => {
          router.push("/my-company/credentials")
        }, 1500)
      }
    }
  }

  const actions = {
    goToList: () => {
      router.push("/my-company/credentials")
    },
  }
  
  return {
    form,
    mode,
    isEditing,
    isLoadingCredential,
    onSubmit,
    isSubmitting,
    billingCodeOptions,
    isLoadingBillingCodes,
    actions,
  }
}
