"use client"

import { useState } from "react"
import { Button } from "@/components/custom/Button"
import { CustomModal } from "@/components/custom/CustomModal"
import { Checkbox } from "@/components/custom/Checkbox"
import { useSignaturePad } from "@/components/custom/SignaturePad"
import { SIGNATURE_AGREEMENT_TEXT } from "@/lib/constants/credentials.constants"

interface SignatureEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (imageBase64: string) => void
  disabled?: boolean
  isSaving?: boolean
}

export function SignatureEditorModal({
  open,
  onOpenChange,
  onSave,
  disabled = false,
  isSaving = false,
}: SignatureEditorModalProps) {
  const [agreementAccepted, setAgreementAccepted] = useState(false)
  const { canvasProps, clear, isEmpty, toDataURL, hasDrawn } = useSignaturePad({
    disabled,
  })

  const handleSave = () => {
    if (!agreementAccepted || isEmpty()) return
    const dataUrl = toDataURL("image/png")
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, "")
    onSave(base64)
    handleClose()
  }

  const handleClose = () => {
    clear()
    setAgreementAccepted(false)
    onOpenChange(false)
  }

  const handleClear = () => {
    clear()
  }

  return (
    <CustomModal
      open={open}
      onOpenChange={handleClose}
      title="Digital Signature"
      description="Draw your handwritten signature and accept the legal agreement to save."
      maxWidthClassName="sm:max-w-[860px]"
    >
      <div className="p-6 space-y-4">
        <canvas {...canvasProps} className="w-full rounded-lg border border-gray-200 bg-white touch-none" />

        <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4">
          <p className="text-xs text-blue-900 leading-relaxed mb-3">
            {SIGNATURE_AGREEMENT_TEXT}
          </p>
          <Checkbox
            checked={agreementAccepted}
            onCheckedChange={setAgreementAccepted}
            label="I agree and understand the Electronic Signature Agreement"
            size="sm"
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={handleClear} disabled={isSaving}>
            Clear
          </Button>
          <Button
            onClick={handleSave}
            disabled={disabled || !agreementAccepted || !hasDrawn || isSaving}
            loading={isSaving}
          >
            Save Signature
          </Button>
        </div>
      </div>
    </CustomModal>
  )
}
