
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useCreateUser } from "@/lib/modules/users/hooks/use-create-user"
import { useUpdateUser } from "@/lib/modules/users/hooks/use-update-user"
import { useUserById } from "@/lib/modules/users/hooks/use-user-by-id"
import { userFormSchema, getUserFormDefaults, type UserFormValues } from "@/lib/schemas/user-form.schema"
import type { CreateMemberUserDto, UpdateMemberUserDto } from "@/lib/types/user.types"
import { useRoles } from "@/lib/modules/roles/hooks/use-roles"
import { useMemberUserTypeCatalog } from "@/lib/modules/member-user-types/hooks/use-member-user-type-catalog"
import { isoToLocalDate } from "@/lib/date"
import { formatPhoneInput } from "@/lib/utils/phone-format"

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
  user: any
  memberUserTypes: Array<{ id: string; name: string }>
  isLoadingMemberUserTypes: boolean
  
  onSubmit: (data: UserFormValues) => Promise<void>
  isSubmitting: boolean

  actions: {
    goToList: () => void
  }
}

export function useUserForm({ userId = null }: UseUserFormProps = {}): UseUserFormReturn {
  const router = useRouter()
  const isEditing = !!userId
  const mode = isEditing ? "edit" : "create"
  
  const { create, isLoading: isCreating } = useCreateUser()
  const { update, isLoading: isUpdating } = useUpdateUser()
  const { user, isLoading: isLoadingUser } = useUserById(userId)
  const { roles, isLoading: isLoadingRoles } = useRoles()
  const { memberUserTypes, isLoading: isLoadingMemberUserTypes } = useMemberUserTypeCatalog()
  
  const isSubmitting = isCreating || isUpdating

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
        cellphone: formatPhoneInput(user.cellphone || ""),
        hiringDate: isoToLocalDate(user.hiringDate),
        roleId: user.roleId || user.role?.id || "",
        active: user.active ?? true,
        terminated: user.terminated ?? false,
        memberUserTypeIds: user.memberUserTypesIds || user.memberUserTypeIds || [],
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
        memberUserTypeIds: data.memberUserTypeIds,
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
        memberUserTypeIds: data.memberUserTypeIds || [],
      }
      
      const result = await create(dto)
      
      if (result) {
        setTimeout(() => {
          router.push("/users")
        }, 1500)
      }
    }
  }

  const actions = {
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
    user,
    memberUserTypes,
    isLoadingMemberUserTypes,
    onSubmit,
    isSubmitting,
    actions,
  }
}
