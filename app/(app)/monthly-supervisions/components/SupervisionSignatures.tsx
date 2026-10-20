"use client"

import { useState } from "react"
import { PenLine } from "lucide-react"
import { SignatureEditorModal } from "@/app/(app)/my-profile/manager/credentials-signature/components/SignatureEditorModal"
import { Button } from "@/components/custom/Button"
import { CustomModal } from "@/components/custom/CustomModal"
import { useSignature } from "@/lib/modules/signature/hooks/use-signature"
import { cn } from "@/lib/utils"

interface SupervisionSignaturesProps {
  supervisorId: string
  supervisorName: string
  supervisorCredentials?: string
  superviseeId: string
  superviseeName: string
  /** Data URL o `null` */
  supervisorSign: string | null
  superviseeSign: string | null
  onSupervisorSignChange: (dataUrl: string | null) => void
  onSuperviseeSignChange: (dataUrl: string | null) => void
  canEditSupervisorSignature?: boolean
  canEditSuperviseeSignature?: boolean
  disabled?: boolean
  hasError?: boolean
}

/**
 * Firmas del supervisor y del supervisee.
 *
 * Mismo lenguaje visual que el bloque de firmas de las session notes: nombre y
 * credencial a la izquierda, trazo sobre una línea a la derecha. El editor
 * devuelve base64 pelado y acá se le pone el prefijo `data:image/png;base64,`
 * que espera el contrato.
 */
export function SupervisionSignatures({
  supervisorId,
  supervisorName,
  supervisorCredentials,
  superviseeId,
  superviseeName,
  supervisorSign,
  superviseeSign,
  onSupervisorSignChange,
  onSuperviseeSignChange,
  canEditSupervisorSignature = true,
  canEditSuperviseeSignature = true,
  disabled,
  hasError,
}: SupervisionSignaturesProps) {
  const [editing, setEditing] = useState<"supervisor" | "supervisee" | null>(null)
  const [choosingSignatureFor, setChoosingSignatureFor] = useState<"supervisor" | "supervisee" | null>(null)
  const {
    signature: registeredSupervisorSignature,
    isLoading: isLoadingRegisteredSupervisorSignature,
  } = useSignature(supervisorId || null, canEditSupervisorSignature)
  const {
    signature: registeredSuperviseeSignature,
    isLoading: isLoadingRegisteredSuperviseeSignature,
  } = useSignature(superviseeId || null, canEditSuperviseeSignature)

  const handleEdit = (role: "supervisor" | "supervisee") => {
    const isLoadingRegisteredSignature = role === "supervisor"
      ? isLoadingRegisteredSupervisorSignature
      : isLoadingRegisteredSuperviseeSignature
    const registeredSignature = role === "supervisor"
      ? registeredSupervisorSignature
      : registeredSuperviseeSignature

    if (disabled || isLoadingRegisteredSignature) return
    if (registeredSignature?.url) {
      setChoosingSignatureFor(role)
      return
    }
    setEditing(role)
  }

  const handleUseRegisteredSignature = () => {
    if (choosingSignatureFor === "supervisor" && registeredSupervisorSignature?.url) {
      onSupervisorSignChange(registeredSupervisorSignature.url)
    }
    if (choosingSignatureFor === "supervisee" && registeredSuperviseeSignature?.url) {
      onSuperviseeSignChange(registeredSuperviseeSignature.url)
    }
    setChoosingSignatureFor(null)
  }

  const handleSave = (base64: string) => {
    const dataUrl = `data:image/png;base64,${base64}`
    if (editing === "supervisor") onSupervisorSignChange(dataUrl)
    if (editing === "supervisee") onSuperviseeSignChange(dataUrl)
    setEditing(null)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm italic text-slate-600">
        The supervisor certifies that the supervision described in this report took place as documented.
      </p>

      <div
        className={cn(
          "overflow-hidden rounded-2xl border bg-white",
          hasError ? "border-red-300" : "border-[#037ECC]/20",
        )}
      >
        <SignatureRow
          role="Supervisor"
          name={supervisorName}
          credentials={supervisorCredentials}
          signature={supervisorSign}
          onEdit={() => handleEdit("supervisor")}
          disabled={
            disabled ||
            !canEditSupervisorSignature ||
            isLoadingRegisteredSupervisorSignature
          }
        />
        <SignatureRow
          role="Supervisee"
          name={superviseeName}
          signature={superviseeSign}
          onEdit={() => handleEdit("supervisee")}
          disabled={
            disabled ||
            !canEditSuperviseeSignature ||
            isLoadingRegisteredSuperviseeSignature
          }
          isLast
        />
      </div>

      {hasError && (
        <p className="text-xs font-medium text-red-500">The supervisor signature is required</p>
      )}

      <SignatureEditorModal
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        onSave={handleSave}
      />

      <CustomModal
        open={choosingSignatureFor !== null}
        onOpenChange={(open) => !open && setChoosingSignatureFor(null)}
        title={`${choosingSignatureFor === "supervisor" ? "Supervisor" : "Supervisee"} signature`}
        description="This user already has a registered signature. Choose how to sign this Monthly Supervision."
        maxWidthClassName="sm:max-w-[520px]"
      >
        <div className="space-y-4 p-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            {/* The registered signature is read-only here; choosing it never updates the user's saved signature. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={choosingSignatureFor === "supervisor"
                ? registeredSupervisorSignature?.url
                : registeredSuperviseeSignature?.url}
              alt="Registered signature"
              className="max-h-24 max-w-full object-contain brightness-50 contrast-150"
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setChoosingSignatureFor(null)
                if (choosingSignatureFor) setEditing(choosingSignatureFor)
              }}
            >
              Use a new signature
            </Button>
            <Button
              onClick={() => {
                handleUseRegisteredSignature()
              }}
            >
              Use registered signature
            </Button>
          </div>
        </div>
      </CustomModal>
    </div>
  )
}

function SignatureRow({
  role,
  name,
  credentials,
  signature,
  onEdit,
  disabled,
  isLast,
}: {
  role: string
  name: string
  credentials?: string
  signature: string | null
  onEdit: () => void
  disabled?: boolean
  isLast?: boolean
}) {
  return (
    <div className={cn("grid grid-cols-2", !isLast && "border-b border-[#037ECC]/10")}>
      <div className="border-r border-[#037ECC]/10 px-6 py-5">
        <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-[#037ECC]/70">
          {role}
        </span>
        <p className="text-sm font-semibold text-slate-800">{name || "—"}</p>
        {credentials && <p className="mt-0.5 text-xs text-slate-500">{credentials}</p>}
      </div>

      <div className="px-6 py-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#037ECC]/70">
            Signature
          </span>
          {!disabled && (
            <button
              type="button"
              onClick={onEdit}
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white",
                "text-slate-500 transition-all duration-150 hover:border-[#037ECC]/40 hover:text-[#037ECC]",
              )}
              title="Edit signature"
              aria-label={`Edit ${role.toLowerCase()} signature`}
            >
              <PenLine className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="relative flex min-h-[64px] items-end pb-3">
          {signature ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={signature}
              alt={`${role} signature`}
              className="max-h-[52px] max-w-full object-contain brightness-50 contrast-150"
            />
          ) : (
            <button
              type="button"
              onClick={onEdit}
              disabled={disabled}
              className="text-xs italic text-slate-300 transition-colors hover:text-[#037ECC] disabled:hover:text-slate-300"
            >
              Click to sign
            </button>
          )}
          <div className="absolute bottom-0 left-0 right-0 border-b border-[#037ECC]/20" />
        </div>
      </div>
    </div>
  )
}
