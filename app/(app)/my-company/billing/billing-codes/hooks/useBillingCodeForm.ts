import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo } from "react"
import { useCreateBillingCode } from "@/lib/modules/billing-codes/hooks/use-create-billing-code"
import { useUpdateBillingCode } from "@/lib/modules/billing-codes/hooks/use-update-billing-code"
import { useBillingCodeById } from "@/lib/modules/billing-codes/hooks/use-billing-code-by-id"
import { useBillingCodeTypes } from "@/lib/modules/billing-codes/hooks/use-billing-code-types"
import { useBillingCodes } from "@/lib/modules/billing-codes/hooks/use-billing-codes"
import { usePlacesOfService } from "@/lib/modules/addresses/hooks/use-places-of-service"
import { billingCodeFormSchema, getBillingCodeFormDefaults, type BillingCodeFormValues } from "@/lib/schemas/billing-code-form.schema"
import type { CreateBillingCodeDto, UpdateBillingCodeDto } from "@/lib/types/billing-code.types"

interface UseBillingCodeFormProps {
  billingCodeId?: string | null
}

interface UseBillingCodeFormReturn {
  form: ReturnType<typeof useForm<BillingCodeFormValues>>
  
  mode: "create" | "edit"
  isEditing: boolean
  isLoadingBillingCode: boolean
  
  onSubmit: (data: BillingCodeFormValues) => Promise<void>
  isSubmitting: boolean

  placesOfService: { id: string; name: string }[]
  isLoadingPlaces: boolean

  parentOptions: { id: string; code: string; description: string }[]
  isLoadingParents: boolean

  actions: {
    goToList: () => void
  }
}

export function useBillingCodeForm({ billingCodeId = null }: UseBillingCodeFormProps = {}): UseBillingCodeFormReturn {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditing = !!billingCodeId
  const mode = isEditing ? "edit" : "create"
  
  const { create, isLoading: isCreating } = useCreateBillingCode()
  const { update, isLoading: isUpdating } = useUpdateBillingCode()
  const { billingCode, isLoading: isLoadingBillingCode } = useBillingCodeById(billingCodeId)
  const { placesOfService, isLoading: isLoadingPlaces } = usePlacesOfService()
  const { types: billingCodeTypes, getTypeIdByName } = useBillingCodeTypes()
  
  const { billingCodes: allBillingCodes, isLoading: isLoadingParents } = useBillingCodes({
    page: 0,
    pageSize: 1000,
    filters: [],
  })
  
  const parentOptions = useMemo(() => {
    if (!allBillingCodes) return []
    
    return allBillingCodes
      .filter(bc => bc.id !== billingCodeId) 
      .map(bc => ({
        id: bc.id,
        code: bc.code,
        description: bc.description || "", 
      }))
  }, [allBillingCodes, billingCodeId])
  
  const isSubmitting = isCreating || isUpdating

  const form = useForm<BillingCodeFormValues>({
    resolver: zodResolver(billingCodeFormSchema),
    defaultValues: getBillingCodeFormDefaults(),
    mode: "onChange",
  })
  
  useEffect(() => {
    if (!isEditing && searchParams) {
      const catalogMode = searchParams.get("mode")
      
      if (catalogMode === "catalog") {
        const catalogId = searchParams.get("catalogId")
        const type = searchParams.get("type") as "CPT" | "HCPCS" | null
        const code = searchParams.get("code")
        const description = searchParams.get("description")
        
        if (type && code && description) {
          form.reset({
            type,
            code,
            description,
            modifiers: "",
            parent: "",
            placeServiceId: "",
            active: true,
            catalogId: catalogId || undefined,
          })
        }
      }
    }
  }, [isEditing, searchParams, form])
  
  useEffect(() => {
    if (billingCode && isEditing && billingCodeTypes.length > 0) {      
      
      const typeId = (billingCode as any).typeId
      const typeObj = billingCodeTypes.find(t => t.id === typeId)
      const typeName = typeObj?.name || billingCode.type
      
      
      form.reset({
        type: typeName,
        code: billingCode.code,
        description: billingCode.description,
        modifiers: billingCode.modifiers?.join(", ") || "",
        parent: billingCode.parent || "",
        placeServiceId: billingCode.allowedPlacesOfService?.[0] || "",
        active: billingCode.active ?? true,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billingCode, isEditing, billingCodeTypes])
  
  const onSubmit = async (data: BillingCodeFormValues) => {
    const typeId = getTypeIdByName(data.type)
    
    if (!typeId) {
      console.error("Type ID not found for:", data.type)
      return
    }

    if (isEditing && billingCodeId) {
      const dto: UpdateBillingCodeDto = {
        id: billingCodeId,
        typeId,
        code: data.code,
        description: data.description,
        modifiers: data.modifiers || undefined,
        parent: data.parent || undefined,
        placeServiceId: data.placeServiceId || undefined,
      }
      
      const result = await update(dto)
      
      if (result) {
        setTimeout(() => {
          router.push("/my-company/billing/billing-codes")
        }, 1500)
      }
    } else {
      const dto: CreateBillingCodeDto = {
        typeId,
        code: data.code,
        description: data.description,
        modifiers: data.modifiers || undefined,
        parent: data.parent || undefined,
        placeServiceId: data.placeServiceId || undefined,
      }
      
      const result = await create(dto)
      
      if (result) {
        setTimeout(() => {
          router.push("/my-company/billing/billing-codes")
        }, 1500)
      }
    }
  }

  const actions = {
    goToList: () => {
      router.push("/my-company/billing/billing-codes")
    },
  }
  
  return {
    form,
    mode,
    isEditing,
    isLoadingBillingCode,
    onSubmit,
    isSubmitting,
    placesOfService,
    isLoadingPlaces,
    parentOptions,
    isLoadingParents,
    actions,
  }
}
