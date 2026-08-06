"use client"

import { useState } from "react"
import { PenLine } from "lucide-react"
import { SignatureEditorModal } from "@/app/(app)/my-profile/manager/credentials-signature/components/SignatureEditorModal"
import { cn } from "@/lib/utils"

interface SupervisionSignaturesProps {
  supervisorName: string
  supervisorCredentials?: string
  superviseeName: string
  /** Data URL o `null` */
  supervisorSign: string | null
  superviseeSign: string | null
  onSupervisorSignChange: (dataUrl: string | null) => void
  onSuperviseeSignChange: (dataUrl: string | null) => void
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
  supervisorName,
  supervisorCredentials,
  superviseeName,
  supervisorSign,
  superviseeSign,
  onSupervisorSignChange,
  onSuperviseeSignChange,
  disabled,
  hasError,
}: SupervisionSignaturesProps) {
  const [editing, setEditing] = useState<"supervisor" | "supervisee" | null>(null)

  const handleSave = (base64: string) => {
    const dataUrl = `data:image/png;base64,${base64}`
    if (editing === "supervisor") onSupervisorSignChange(dataUrl)
    if (editing === "supervisee") onSuperviseeSignChange(dataUrl)
    setEditing(null)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm italic text-slate-600">
        By signing below, both parties certify that the supervision described in this report took
        place as documented.
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
          onEdit={() => !disabled && setEditing("supervisor")}
          disabled={disabled}
        />
        <SignatureRow
          role="Supervisee"
          name={superviseeName}
          signature={superviseeSign}
          onEdit={() => !disabled && setEditing("supervisee")}
          disabled={disabled}
          isLast
        />
      </div>

      {hasError && (
        <p className="text-xs font-medium text-red-500">Both signatures are required</p>
      )}

      <SignatureEditorModal
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        onSave={handleSave}
      />
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
