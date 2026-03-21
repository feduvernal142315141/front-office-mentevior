"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/custom/Button"
import { CustomModal } from "@/components/custom/CustomModal"
import { useUpdatePayer } from "@/lib/modules/payers/hooks/use-update-payer"
import type { Payer, PayerBaseFormFields } from "@/lib/types/payer.types"
import { PayerBaseForm } from "../shared/PayerBaseForm"

interface EditPayerModalProps {
  payer: Payer | null
  open: boolean
  onOpenChange: (nextOpen: boolean) => void
  onSaved: () => void
}

const EMPTY_FORM: PayerBaseFormFields = {
  name: "",
  phone: "",
  email: "",
  memberId: "",
  groupNumber: "",
  address: {
    line1: "",
    city: "",
    state: "",
    zipCode: "",
  },
}

export function EditPayerModal({ payer, open, onOpenChange, onSaved }: EditPayerModalProps) {
  const [formData, setFormData] = useState<PayerBaseFormFields>(EMPTY_FORM)
  const { update, isLoading } = useUpdatePayer()

  useEffect(() => {
    if (payer) {
      setFormData(payer.form)
    }
  }, [payer])

  const handleSave = async () => {
    if (!payer || !formData.name.trim()) {
      return
    }

    const saved = await update({
      payerId: payer.id,
      form: {
        ...formData,
        name: formData.name.trim(),
      },
    })

    if (saved) {
      onSaved()
      onOpenChange(false)
    }
  }

  return (
    <CustomModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit payer"
      description="Phase 3: base fields shared with manual creation"
      maxWidthClassName="sm:max-w-[960px]"
    >
      <div className="p-6 space-y-6">
        <PayerBaseForm value={formData} onChange={setFormData} />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={isLoading}
            onClick={handleSave}
            disabled={!formData.name.trim()}
          >
            Save changes
          </Button>
        </div>
      </div>
    </CustomModal>
  )
}
