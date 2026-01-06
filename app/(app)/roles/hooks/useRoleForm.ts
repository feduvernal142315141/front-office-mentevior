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
  
  // Store original values to detect changes
  const originalValuesRef = useRef<RoleFormValues | null>(null)
  
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: getRoleFormDefaults(),
    mode: "onChange", // Validate on every change
  })
  
  useEffect(() => {
    if (role && isEditing) {
      const initialValues = {
        name: role.name,
        permissions: role.permissions,
      }
      form.reset(initialValues)
      originalValuesRef.current = initialValues
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, isEditing]) // ✅ Solo role e isEditing, form.reset es estable
  
  const canEditName = isEditing ? (role?.canEdit ?? false) : true
  const usersCount = role?.usersCount ?? 0
  
  const onSubmit = async (data: RoleFormValues) => {
    if (isEditing && roleId) {
      const dto: UpdateRoleDto = {
        name: canEditName ? data.name : undefined,
        permissions: data.permissions,
      }
      
      const result = await update(roleId, dto)
      
      if (result) {
        setTimeout(() => {
          router.push("/roles")
        }, 1500)
      }
    } else {
      const dto: CreateRoleDto = {
        name: data.name,
        permissions: data.permissions,
      }
      
      const result = await create(dto)
      
      if (result) {
        setTimeout(() => {
          router.push("/roles")
        }, 1500)
      }
    }
  }
  
  const actions = {
    goToList: () => {
      router.push("/roles")
    },
  }
  
  // Watch all form values to detect changes in real-time
  const currentName = form.watch("name")
  const currentPermissions = form.watch("permissions")
  
  const hasPermissions = currentPermissions && currentPermissions.length > 0
  
  // Detect changes by comparing current values with original values
  const hasChanges = isEditing 
    ? (() => {
        if (!originalValuesRef.current) {
          console.log("🔴 originalValuesRef.current is null")
          return false
        }
        
        const nameChanged = canEditName && currentName !== originalValuesRef.current.name
        const permissionsChanged = JSON.stringify([...(currentPermissions || [])].sort()) !== 
                                   JSON.stringify([...(originalValuesRef.current.permissions || [])].sort())
        
        console.log("🔍 CHANGE DETECTION:", {
          canEditName,
          currentName,
          originalName: originalValuesRef.current.name,
          nameChanged,
          permissionsChanged,
          hasChanges: nameChanged || permissionsChanged
        })
        
        return nameChanged || permissionsChanged
      })()
    : true // Always has changes in create mode
  
  const isFormValid = isEditing 
    ? hasPermissions && hasChanges && form.formState.isValid
    : hasPermissions && form.formState.isValid
  
  console.log("🎯 FORM VALIDATION:", {
    isEditing,
    hasPermissions,
    hasChanges,
    isValid: form.formState.isValid,
    errors: form.formState.errors,
    isFormValid
  })

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
