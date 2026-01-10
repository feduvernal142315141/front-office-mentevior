import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useCreateAddress } from "@/lib/modules/addresses/hooks/use-create-address"
import { useUpdateAddress } from "@/lib/modules/addresses/hooks/use-update-address"
import { useAddressById } from "@/lib/modules/addresses/hooks/use-address-by-id"
import { useCountries } from "@/lib/modules/addresses/hooks/use-countries"
import { useStates } from "@/lib/modules/addresses/hooks/use-states"
import { addressFormSchema, getAddressFormDefaults, type AddressFormValues } from "@/lib/schemas/address-form.schema"
import type { CreateAddressDto, UpdateAddressDto } from "@/lib/types/address.types"

interface UseAddressFormProps {
  addressId?: string | null
}

interface UseAddressFormReturn {
  form: ReturnType<typeof useForm<AddressFormValues>>
  
  mode: "create" | "edit"
  isEditing: boolean
  isLoadingAddress: boolean
  
  onSubmit: (data: AddressFormValues) => Promise<void>
  isSubmitting: boolean

  // Catalogs
  countries: { id: string; name: string }[]
  states: { id: string; name: string }[]
  isLoadingCountries: boolean
  isLoadingStates: boolean

  actions: {
    goToList: () => void
  }
}

export function useAddressForm({ addressId = null }: UseAddressFormProps = {}): UseAddressFormReturn {
  const router = useRouter()
  const isEditing = !!addressId
  const mode = isEditing ? "edit" : "create"
  
  const { create, isLoading: isCreating } = useCreateAddress()
  const { update, isLoading: isUpdating } = useUpdateAddress()
  const { address, isLoading: isLoadingAddress } = useAddressById(addressId)
  
  // Catalogs
  const { countries, isLoading: isLoadingCountries } = useCountries()
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null)
  const { states, isLoading: isLoadingStates } = useStates(selectedCountryId)
  
  const isSubmitting = isCreating || isUpdating

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: getAddressFormDefaults(),
  })
  
  // Watch countryId changes to load states
  const watchCountryId = form.watch("countryId")
  
  useEffect(() => {
    if (watchCountryId) {
      setSelectedCountryId(watchCountryId)
      // Reset stateId when country changes
      if (watchCountryId !== form.getValues("countryId")) {
        form.setValue("stateId", "")
      }
    } else {
      setSelectedCountryId(null)
      form.setValue("stateId", "")
    }
  }, [watchCountryId, form])
  
  // Load address data for editing
  useEffect(() => {
    if (address && isEditing) {
      // Set countryId first to trigger states loading
      if (address.countryId) {
        setSelectedCountryId(address.countryId)
      }
      
      form.reset({
        countryId: address.countryId || "",
        stateId: address.stateId || "",
        city: address.city,
        address: address.address,
        zipCode: address.zipCode,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isEditing])
  
  const onSubmit = async (data: AddressFormValues) => {
    if (isEditing && addressId) {
      const dto: UpdateAddressDto = {
        id: addressId,
        stateId: data.stateId,
        city: data.city,
        address: data.address,
        zipCode: data.zipCode,
      }
      
      const result = await update(dto)
      
      if (result) {
        setTimeout(() => {
          router.push("/my-company/address")
        }, 1500)
      }
    } else {
      const dto: CreateAddressDto = {
        stateId: data.stateId,
        city: data.city,
        address: data.address,
        zipCode: data.zipCode,
      }
      
      const result = await create(dto)
      
      if (result) {
        setTimeout(() => {
          router.push("/my-company/address")
        }, 1500)
      }
    }
  }

  const actions = {
    goToList: () => {
      router.push("/my-company/address")
    },
  }
  
  return {
    form,
    mode,
    isEditing,
    isLoadingAddress,
    onSubmit,
    isSubmitting,
    countries,
    states,
    isLoadingCountries,
    isLoadingStates,
    actions,
  }
}
