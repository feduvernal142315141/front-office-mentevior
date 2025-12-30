
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useCreateUser } from "@/lib/modules/users/hooks/use-create-user"
import { useUpdateUser } from "@/lib/modules/users/hooks/use-update-user"
import { useUserById } from "@/lib/modules/users/hooks/use-user-by-id"
import { userFormSchema, getUserFormDefaults, type UserFormValues } from "@/lib/schemas/user-form.schema"
import type { CreateMemberUserDto, UpdateMemberUserDto } from "@/lib/types/user.types"
import {useRoles} from "@/lib/modules/roles/hooks/use-roles"
import { isoToLocalDate } from "@/lib/date"

interface UIState {
  showPassword: boolean
  isRedirecting: boolean
  redirectCountdown: number
}

interface UseUserFormProps {
  userId?: string | null
}

interface UseUserFormReturn {
  form: ReturnType<typeof useForm<UserFormValues>>
  
  mode: "create" | "edit"
  isEditing: boolean
  roles: Array<{ id: string; name: string }>
  isLoadingRoles: boolean
  isLoadingUser: boolean
  
  onSubmit: (data: UserFormValues) => Promise<void>
  isSubmitting: boolean

  response: { email: string; id: string } | null
  
  uiState: UIState

  actions: {
    createAnother: () => void
    goToList: () => void
  }
}

export function useUserForm({ userId = null }: UseUserFormProps = {}): UseUserFormReturn {
  const router = useRouter()
  const isEditing = !!userId
  const mode = isEditing ? "edit" : "create"
  
  const { create, isLoading: isCreating, response } = useCreateUser()
  const { update, isLoading: isUpdating } = useUpdateUser()
  const { user, isLoading: isLoadingUser } = useUserById(userId)
  const { roles, isLoading: isLoadingRoles } = useRoles()
  
  const isSubmitting = isCreating || isUpdating

  const [uiState, setUIState] = useState<UIState>({
    showPassword: false,
    isRedirecting: false,
    redirectCountdown: 10,
  })

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: getUserFormDefaults(),
  })
  
  useEffect(() => {
    if (user && isEditing) {
      form.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        cellphone: user.cellphone || "",
        hiringDate: isoToLocalDate(user.hiringDate),
        roleId: user.role?.id || "",
        active: user.active ?? true,
        terminated: user.terminated ?? false,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isEditing]) 
  
  const onSubmit = async (data: UserFormValues) => {
    if (isEditing && userId) {
      const dto: UpdateMemberUserDto = {
        id: userId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        cellphone: data.cellphone,
        hiringDate: data.hiringDate,
        roleId: data.roleId,
        active: data.active,
        terminated: data.terminated,
      }
      
      const result = await update(dto)
      
      if (result) {
        setTimeout(() => {
          router.push("/users")
        }, 1500)
      }
    } else {
      const dto: CreateMemberUserDto = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        cellphone: data.cellphone,
        hiringDate: data.hiringDate,
        roleId: data.roleId,
      }
      
      const result = await create(dto)
      
      if (result) {
        setUIState((prev) => ({
          ...prev,
          showPassword: true,
          isRedirecting: true,
        }))
      }
    }
  }

  useEffect(() => {
    if (!uiState.showPassword || !uiState.isRedirecting || isEditing) return
    
    const interval = setInterval(() => {
      setUIState((prev) => {
        const newCountdown = prev.redirectCountdown - 1
        return { ...prev, redirectCountdown: newCountdown }
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [uiState.showPassword, uiState.isRedirecting, isEditing])

  // Separate effect to handle redirect when countdown reaches 0
  useEffect(() => {
    if (uiState.redirectCountdown <= 0 && uiState.isRedirecting && !isEditing) {
      router.push("/users")
    }
  }, [uiState.redirectCountdown, uiState.isRedirecting, isEditing, router])
  

  const actions = {
    createAnother: () => {
      setUIState({
        showPassword: false,
        isRedirecting: false,
        redirectCountdown: 10,
      })
      form.reset(getUserFormDefaults())
    },
  
    goToList: () => {
      router.push("/users")
    },
  }
  
  return {
    form,
    mode,
    isEditing,
    roles,
    isLoadingRoles,
    isLoadingUser,
    onSubmit,
    isSubmitting,
    response,
    uiState,
    actions,
  }
}
