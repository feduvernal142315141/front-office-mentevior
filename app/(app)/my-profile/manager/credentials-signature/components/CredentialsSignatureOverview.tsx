"use client"

import { useState, useCallback, useMemo } from "react"
import { toast } from "sonner"
import { useAuth } from "@/lib/hooks/use-auth"
import { useUserById } from "@/lib/modules/users/hooks/use-user-by-id"
import { useUserCredentials } from "@/lib/modules/user-credentials/hooks/use-user-credentials"
import { useSignature } from "@/lib/modules/signature/hooks/use-signature"
import { ELIGIBLE_ROLES_FOR_CREDENTIALS } from "@/lib/constants/credentials.constants"
import type {
  UserCredential,
  CreateUserCredentialDto,
  UpdateUserCredentialDto,
} from "@/lib/types/user-credentials.types"
import { AlertsBanner } from "./AlertsBanner"
import { CredentialsSection } from "./CredentialsSection"
import { SignatureSection } from "./SignatureSection"
import { SignatureEditorModal } from "./SignatureEditorModal"
import { SignatureScrollIndicator } from "./SignatureScrollIndicator"
import { ConfirmationModal } from "@/components/custom/ConfirmationModal"

const DEFAULT_PAGE_SIZE = 5

export function CredentialsSignatureOverview() {
  const { user } = useAuth()
  const { user: fullUser } = useUserById(user?.id || null)

  const {
    credentials,
    credentialTypes,
    isLoadingTypes,
    expiredCredentials,
    expiringSoonCredentials,
    create: createCredential,
    update: updateCredential,
    isCreating,
    isUpdating,
    getComputedStatus,
  } = useUserCredentials()

  const {
    signature,
    hasSignature,
    save: saveSignature,
    remove: removeSignature,
    isSaving: isSavingSignature,
  } = useSignature()

  const [editingCredential, setEditingCredential] = useState<UserCredential | null>(null)
  const [isSignatureEditorOpen, setIsSignatureEditorOpen] = useState(false)
  const [isDeleteSignatureModalOpen, setIsDeleteSignatureModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const roleName = fullUser?.role?.name || user?.role || "Unknown"
  const canManageCredentials = ELIGIBLE_ROLES_FOR_CREDENTIALS.includes(
    roleName as (typeof ELIGIBLE_ROLES_FOR_CREDENTIALS)[number]
  )
  const isSignatureBlocked = expiredCredentials.length > 0

  const paginatedCredentials = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(credentials.length / pageSize))
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * pageSize
    const end = start + pageSize
    return credentials.slice(start, end)
  }, [credentials, page, pageSize])

  const handleSaveCredential = useCallback(
    async (data: CreateUserCredentialDto) => {
      await createCredential(data)
      setPage(1)
    },
    [createCredential]
  )

  const handleUpdateCredential = useCallback(
    async (id: string, data: UpdateUserCredentialDto) => {
      await updateCredential(id, data)
      setEditingCredential(null)
    },
    [updateCredential]
  )

  const handleCancelEdit = useCallback(() => {
    setEditingCredential(null)
  }, [])

  const handleEditCredential = useCallback((credential: UserCredential) => {
    setEditingCredential(credential)
    
    setTimeout(() => {
      const container = document.getElementById("main-scroll")
      const formElement = document.getElementById("credentials-form")
      
      if (container && formElement) {
        const containerRect = container.getBoundingClientRect()
        const formRect = formElement.getBoundingClientRect()
        const targetY = container.scrollTop + (formRect.top - containerRect.top) - 30
        
        container.scrollTo({ top: targetY, behavior: "smooth" })
      }
    }, 100)
  }, [])

  const handleOpenSignatureEditor = useCallback(() => {
    if (isSignatureBlocked) {
      toast.error("This user cannot sign documents because at least one credential is expired.")
      return
    }
    setIsSignatureEditorOpen(true)
  }, [isSignatureBlocked])

  const handleSaveSignature = useCallback(
    async (imageBase64: string) => {
      await saveSignature(imageBase64)
      setIsSignatureEditorOpen(false)
    },
    [saveSignature]
  )

  const handleDeleteSignature = useCallback(() => {
    if (!hasSignature) return
    setIsDeleteSignatureModalOpen(true)
  }, [hasSignature])

  const handleConfirmDeleteSignature = useCallback(async () => {
    await removeSignature()
    setIsDeleteSignatureModalOpen(false)
  }, [removeSignature])

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1)
  }, [])

  return (
    <div className="space-y-6">
      <AlertsBanner
        expiredCount={expiredCredentials.length}
        expiringSoonCount={expiringSoonCredentials.length}
        hasSignature={hasSignature}
      />

      <CredentialsSection
        roleName={roleName}
        canManageCredentials={canManageCredentials}
        credentials={paginatedCredentials}
        credentialTypes={credentialTypes}
        isLoadingTypes={isLoadingTypes}
        editingCredential={editingCredential}
        onSave={handleSaveCredential}
        onUpdate={handleUpdateCredential}
        onCancelEdit={handleCancelEdit}
        onEdit={handleEditCredential}
        isSaving={isCreating || isUpdating}
        getComputedStatus={getComputedStatus}
        page={page}
        pageSize={pageSize}
        total={credentials.length}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        signatureSection={
          <SignatureSection
            signature={signature}
            blocked={isSignatureBlocked}
            onOpenEditor={handleOpenSignatureEditor}
            onDelete={handleDeleteSignature}
          />
        }
      />

      <SignatureEditorModal
        open={isSignatureEditorOpen}
        onOpenChange={setIsSignatureEditorOpen}
        onSave={handleSaveSignature}
        disabled={isSignatureBlocked}
        isSaving={isSavingSignature}
      />

      <ConfirmationModal
        open={isDeleteSignatureModalOpen}
        onOpenChange={setIsDeleteSignatureModalOpen}
        title="Delete Signature"
        description="Are you sure you want to delete your current signature? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDeleteSignature}
        variant="danger"
      />

      {/* Indicador flotante para la sección de firma */}
      <SignatureScrollIndicator />
    </div>
  )
}
