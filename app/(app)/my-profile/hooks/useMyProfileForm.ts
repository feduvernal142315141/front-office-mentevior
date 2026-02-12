import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useUpdateUser } from "@/lib/modules/users/hooks/use-update-user"
import { useAuth } from "@/lib/hooks/use-auth"
import { userFormSchema, getUserFormDefaults, type UserFormValues } from "@/lib/schemas/user-form.schema"
import type { UpdateMemberUserDto } from "@/lib/types/user.types"
import { useUserById } from "@/lib/modules/users/hooks/use-user-by-id"
import { isoToLocalDate } from "@/lib/date"
import {useRoles} from "@/lib/modules/roles/hooks/use-roles"

interface UseMyProfileFormReturn {
  form: ReturnType<typeof useForm<UserFormValues>>
  roles: Array<{ id: string; name: string }>
  isLoadingRoles: boolean
  isLoadingUser: boolean
  user: any
  currentRole: { id: string; name: string } | null
  onSubmit: (data: UserFormValues) => Promise<void>
  isSubmitting: boolean
  actions: {
    goToDashboard: () => void
  }
}

export function useMyProfileForm(): UseMyProfileFormReturn {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const userId = currentUser?.id || null
  
  const { update, isLoading: isUpdating } = useUpdateUser()
  const { user, isLoading: isLoadingUser } = useUserById(userId)
  const { roles, isLoading: isLoadingRoles } = useRoles()
  
  const isSubmitting = isUpdating

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: getUserFormDefaults(),
  })
  
  useEffect(() => {
    if (user && userId) {
      form.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        cellphone: user.cellphone || "",
        hiringDate: isoToLocalDate(user.hiringDate),
        roleId: user.roleId || user.role?.id || "",
        active: user.active ?? true,
        terminated: user.terminated ?? false,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userId]) 
  
  const onSubmit = async (data: UserFormValues) => {
    if (!userId) return
    
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
        router.push("/dashboard")
      }, 1500)
    }
  }

  const actions = {
    goToDashboard: () => {
      router.push("/dashboard")
    },
  }
  
  return {
    form,
    roles,
    isLoadingRoles,
    isLoadingUser,
    user,
    currentRole: user?.role ? { id: user.role.id, name: user.role.name } : null,
    onSubmit,
    isSubmitting,
    actions,
  }
}
