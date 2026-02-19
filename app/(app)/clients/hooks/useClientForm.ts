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
import { getMockInsurances, type Insurance } from "@/lib/modules/clients/mocks/insurances.mock"
import { useUsers } from "@/lib/modules/users/hooks/use-users"

interface UseClientFormProps {
  clientId?: string | null
}

interface UseClientFormReturn {
  form: ReturnType<typeof useForm<ClientFormValues>>
  
  mode: "create" | "edit"
  isEditing: boolean
  insurances: Insurance[]
  rbts: Array<{ id: string; name: string }>
  isLoadingRbts: boolean
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
  
  const { users, isLoading: isLoadingUsers } = useUsers({
    page: 0,
    pageSize: 1000,
    filters: [],
  })

  const rbts = users
    .filter((u) => u.roleName?.toLowerCase().includes("rbt"))
    .map((u) => ({
      id: u.id,
      name: u.fullName,
    }))

  const insurances = getMockInsurances()
  const isSubmitting = isCreating || isUpdating

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(isEditing ? clientEditFormSchema : clientCreateFormSchema),
    defaultValues: getClientFormDefaults(),
  })
  
  useEffect(() => {
    if (client && isEditing) {
      form.reset({
        firstName: client.firstName,
        lastName: client.lastName,
        phoneNumber: client.phoneNumber,
        chartId: client.chartId || "",
        diagnosisCode: client.diagnosisCode || "",
        insuranceId: client.insuranceId || "",
        rbtId: client.rbtId || "",
        dateOfBirth: client.dateOfBirth ? isoToLocalDate(client.dateOfBirth) : "",
        guardianName: client.guardianName || "",
        guardianPhone: client.guardianPhone || "",
        address: client.address || "",
        active: client.active ?? true,
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
        diagnosisCode: data.diagnosisCode || undefined,
        insuranceId: data.insuranceId || undefined,
        rbtId: data.rbtId || undefined,
        dateOfBirth: data.dateOfBirth || undefined,
        guardianName: data.guardianName || undefined,
        guardianPhone: data.guardianPhone || undefined,
        address: data.address || undefined,
        active: data.active,
      }
      
      const result = await update(dto)
      
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
        active: data.active,
        chartId: data.chartId || undefined,
        diagnosisCode: data.diagnosisCode || undefined,
        insuranceId: data.insuranceId || undefined,
        rbtId: data.rbtId || undefined,
        dateOfBirth: data.dateOfBirth || undefined,
        guardianName: data.guardianName || undefined,
        guardianPhone: data.guardianPhone || undefined,
        address: data.address || undefined,
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
    insurances,
    rbts,
    isLoadingRbts: isLoadingUsers,
    isLoadingClient,
    client,
    onSubmit,
    isSubmitting,
    actions,
  }
}
