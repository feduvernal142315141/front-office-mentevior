import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useCreateClient } from "@/lib/modules/clients/hooks/use-create-client"
import { useUpdateClient } from "@/lib/modules/clients/hooks/use-update-client"
import { useClientById } from "@/lib/modules/clients/hooks/use-client-by-id"
import { 
  clientCreateFormSchema,
  clientEditFormSchema,
  getClientFormDefaults, 
  type ClientFormValues 
} from "@/lib/schemas/client-form.schema"
import type { CreateClientDto, UpdateClientDto } from "@/lib/types/client.types"
import { isoToLocalDate } from "@/lib/date"

interface UseClientFormProps {
  clientId?: string | null
}

interface UseClientFormReturn {
  form: ReturnType<typeof useForm<ClientFormValues>>
  
  mode: "create" | "edit"
  isEditing: boolean
  isLoadingClient: boolean
  client: any
  
  onSubmit: (data: ClientFormValues) => Promise<void>
  isSubmitting: boolean

  actions: {
    goToList: () => void
  }
}

export function useClientForm({ clientId = null }: UseClientFormProps = {}): UseClientFormReturn {
  const router = useRouter()
  const isEditing = !!clientId
  const mode = isEditing ? "edit" : "create"
  
  const { create, isLoading: isCreating } = useCreateClient()
  const { update, isLoading: isUpdating } = useUpdateClient()
  const { client, isLoading: isLoadingClient } = useClientById(clientId)

  const isSubmitting = isCreating || isUpdating

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(isEditing ? clientEditFormSchema : clientCreateFormSchema),
    defaultValues: getClientFormDefaults(),
  })
  
  useEffect(() => {
    if (client && isEditing) {
      form.reset({
        firstName: client.firstName || "",
        lastName: client.lastName || "",
        phoneNumber: client.phoneNumber || "",
        chartId: client.chartId || "",
        brithDate: client.brithDate ? isoToLocalDate(client.brithDate) : "",
        languages: client.languages?.map(l => l.id) || [],
        genderId: client.genderId || "",
        email: client.email || "",
        ssn: client.ssn || "",
      })
    }
  }, [client, isEditing, form])
  
  const onSubmit = async (data: ClientFormValues) => {
    if (isEditing && clientId) {
      const dto: UpdateClientDto = {
        id: clientId,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        chartId: data.chartId || undefined,
        brithDate: data.brithDate || undefined,
        languages: data.languages && data.languages.length > 0 ? data.languages : undefined,
        genderId: data.genderId || undefined,
        email: data.email || undefined,
        ssn: data.ssn || undefined,
      }
      
      const result = await update(clientId, dto)
      
      if (result) {
        setTimeout(() => {
          router.push("/clients")
        }, 1500)
      }
    } else {
      const dto: CreateClientDto = {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        chartId: data.chartId || undefined,
        brithDate: data.brithDate || undefined,
        languages: data.languages && data.languages.length > 0 ? data.languages : undefined,
        genderId: data.genderId || undefined,
        email: data.email || undefined,
        ssn: data.ssn || undefined,
      }
      
      const result = await create(dto)
      
      if (result) {
        setTimeout(() => {
          router.push("/clients")
        }, 1500)
      }
    }
  }

  const actions = {
    goToList: () => {
      router.push("/clients")
    },
  }
  
  return {
    form,
    mode,
    isEditing,
    isLoadingClient,
    client,
    onSubmit,
    isSubmitting,
    actions,
  }
}
