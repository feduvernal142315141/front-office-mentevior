import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useCreateAddress } from "@/lib/modules/addresses/hooks/use-create-address"
import { useUpdateAddress } from "@/lib/modules/addresses/hooks/use-update-address"
import { useAddressById } from "@/lib/modules/addresses/hooks/use-address-by-id"
import { useCountries } from "@/lib/modules/addresses/hooks/use-countries"
import { useStates } from "@/lib/modules/addresses/hooks/use-states"
import { usePlacesOfService } from "@/lib/modules/addresses/hooks/use-places-of-service"
import { addressFormSchema, getAddressFormDefaults, type AddressFormValues } from "@/lib/schemas/address-form.schema"
import type { CreateAddressDto, UpdateAddressDto } from "@/lib/types/address.types"
import { isoToLocalDate } from "@/lib/date"

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

  countries: { id: string; name: string }[]
  states: { id: string; name: string }[]
  placesOfService: { id: string; name: string }[]
  isLoadingCountries: boolean
  isLoadingStates: boolean
  isLoadingPlaces: boolean

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
  
  const { countries, isLoading: isLoadingCountries } = useCountries()
  const { placesOfService, isLoading: isLoadingPlaces } = usePlacesOfService()
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null)
  const { states, isLoading: isLoadingStates } = useStates(selectedCountryId)
  
  const isSubmitting = isCreating || isUpdating

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: getAddressFormDefaults(),
    mode: "onChange",
  })
  
  const watchCountryId = form.watch("countryId")
  
  useEffect(() => {
    if (watchCountryId) {
      setSelectedCountryId(watchCountryId)
      if (watchCountryId !== form.getValues("countryId")) {
        form.setValue("stateId", "")
      }
    } else {
      setSelectedCountryId(null)
      form.setValue("stateId", "")
    }
  }, [watchCountryId, form])
  
  useEffect(() => {
    if (address && isEditing) {
      if (address.countryId) {
        setSelectedCountryId(address.countryId)
      }
      
      form.reset({
        nickName: address.nickName || "",
        placeServiceId: address.placeServiceId || "",
        countryId: address.countryId || "",
        stateId: address.stateId || "",
        city: address.city || "",
        address: address.address || "",
        zipCode: address.zipCode || "",
        //startDate: address.startDate ? isoToLocalDate(address.startDate) : "",
        //endDate: address.endDate ? isoToLocalDate(address.endDate) : "",
        //active: address.active ?? true,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isEditing])
  
  const onSubmit = async (data: AddressFormValues) => {
    if (isEditing && addressId) {
      const dto: UpdateAddressDto = {
        id: addressId,
        nickName: data.nickName,
        placeServiceId: data.placeServiceId,
        stateId: data.stateId,
        city: data.city,
        address: data.address,
        zipCode: data.zipCode,
        //startDate: data.startDate,
        //endDate: data.endDate,
        //active: data.active ?? true,
      }
      
      const result = await update(dto)
      
      if (result) {
        setTimeout(() => {
          router.push("/my-company/address")
        }, 1500)
      }
    } else {
      const dto: CreateAddressDto = {
        nickName: data.nickName,
        placeServiceId: data.placeServiceId,
        stateId: data.stateId,
        city: data.city,
        address: data.address,
        zipCode: data.zipCode,
        //startDate: data.startDate,
        //endDate: data.endDate,
        //active: data.active ?? true,
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
    placesOfService,
    isLoadingCountries,
    isLoadingStates,
    isLoadingPlaces,
    actions,
  }
}
