import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import { useCreateRole } from "@/lib/modules/roles/hooks/use-create-role"
import { useUpdateRole } from "@/lib/modules/roles/hooks/use-update-role"
import { useRoleById } from "@/lib/modules/roles/hooks/use-role-by-id"
import { roleFormSchema, getRoleFormDefaults, type RoleFormValues } from "@/lib/schemas/role-form.schema"
import type { CreateRoleDto, UpdateRoleDto } from "@/lib/types/role.types"

interface UseRoleFormProps {
  roleId?: string | null
}

interface UseRoleFormReturn {
  form: ReturnType<typeof useForm<RoleFormValues>>
  
  mode: "create" | "edit"
  isEditing: boolean
  
  isLoadingRole: boolean
  canEditName: boolean 
  usersCount: number
  
  onSubmit: (data: RoleFormValues) => Promise<void>
  isSubmitting: boolean
  
  hasPermissions: boolean
  hasChanges: boolean
  isFormValid: boolean
  
  actions: {
    goToList: () => void
  }
}

export function useRoleForm({ roleId = null }: UseRoleFormProps = {}): UseRoleFormReturn {
  const router = useRouter()
  const isEditing = !!roleId
  const mode = isEditing ? "edit" : "create"
  
  const { create, isLoading: isCreating } = useCreateRole()
  const { update, isLoading: isUpdating } = useUpdateRole()
  const { role, isLoading: isLoadingRole } = useRoleById(roleId)
  
  const isSubmitting = isCreating || isUpdating
  
  const originalValuesRef = useRef<RoleFormValues | null>(null)
  
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: getRoleFormDefaults(),
    mode: "onChange", 
  })
  
  useEffect(() => {
    if (role && isEditing) {
      const initialValues = {
        name: role.name,
        permissions: role.permissions,
        professionalInformation: role.professionalInformation,
        credentialsSignature: role.credentialsSignature,
      }
      form.reset(initialValues)
      originalValuesRef.current = initialValues
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, isEditing]) 
  
  const canEditName = isEditing ? (role?.canEdit ?? false) : true
  const usersCount = role?.usersCount ?? 0
  
  const onSubmit = async (data: RoleFormValues) => {
    if (isEditing && roleId) {
      const dto: UpdateRoleDto = {
        name: canEditName ? data.name.trim() : undefined,
        permissions: data.permissions,
        professionalInformation: data.professionalInformation,
        credentialsSignature: data.credentialsSignature,
      }
      
      const result = await update(roleId, dto)
      
      if (result) {
        setTimeout(() => {
          router.push("/my-company/roles")
        }, 1500)
      }
    } else {
      const dto: CreateRoleDto = {
        name: data.name.trim(),
        permissions: data.permissions,
        professionalInformation: data.professionalInformation,
        credentialsSignature: data.credentialsSignature,
      }
      
      const result = await create(dto)
      
      if (result) {
        setTimeout(() => {
          router.push("/my-company/roles")
        }, 1500)
      }
    }
  }
  
  const actions = {
    goToList: () => {
      router.push("/my-company/roles")
    },
  }
  
  const currentName = form.watch("name")
  const currentPermissions = form.watch("permissions")
  const currentProfessionalInfo = form.watch("professionalInformation")
  const currentCredentialsSignature = form.watch("credentialsSignature")
  
  const hasPermissions = currentPermissions && currentPermissions.length > 0
  
  const hasChanges = isEditing 
    ? (() => {
        if (!originalValuesRef.current) {
          return false
        }
        
        const nameChanged = canEditName && currentName !== originalValuesRef.current.name
        const permissionsChanged = JSON.stringify([...(currentPermissions || [])].sort()) !== 
                                    JSON.stringify([...(originalValuesRef.current.permissions || [])].sort())
        const professionalInfoChanged = currentProfessionalInfo !== originalValuesRef.current.professionalInformation
        const credentialsSignatureChanged = currentCredentialsSignature !== originalValuesRef.current.credentialsSignature
        
        return nameChanged || permissionsChanged || professionalInfoChanged || credentialsSignatureChanged
      })()
    : true 
  
  const isFormValid = isEditing 
    ? hasPermissions && hasChanges && form.formState.isValid
    : hasPermissions && form.formState.isValid

  return {
    form,
    mode,
    isEditing,
    isLoadingRole,
    canEditName,
    usersCount,
    onSubmit,
    isSubmitting,
    hasPermissions,
    hasChanges,
    isFormValid,
    actions,
  }
}
