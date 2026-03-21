"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/custom/Button"
import { CustomModal } from "@/components/custom/CustomModal"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import { useConfigurePayerPlan } from "@/lib/modules/payers/hooks/use-configure-payer-plan"
import { usePayerCatalogs } from "@/lib/modules/payers/hooks/use-payer-catalogs"
import { PLAN_TYPE_STATUS, type Payer } from "@/lib/types/payer.types"

interface PlanConfigModalProps {
  payer: Payer | null
  open: boolean
  onOpenChange: (nextOpen: boolean) => void
  onSaved: () => void
}

export function PlanConfigModal({ payer, open, onOpenChange, onSaved }: PlanConfigModalProps) {
  const [planTypeId, setPlanTypeId] = useState("")
  const [notes, setNotes] = useState("")
  const { planTypes } = usePayerCatalogs()
  const { configure, isLoading } = useConfigurePayerPlan()

  useEffect(() => {
    if (payer) {
      setPlanTypeId(payer.planTypeId)
      setNotes(payer.notes)
    }
  }, [payer])

  const handleSave = async () => {
    if (!payer || !planTypeId) {
      return
    }

    const saved = await configure({
      payerId: payer.id,
      planTypeId,
      notes,
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
      title="Plan configuration"
      description="Phase 3: configure payer plan with mock catalog"
      maxWidthClassName="sm:max-w-[640px]"
    >
      <div className="p-6 space-y-6">
        <FloatingSelect
          label="Plan Type"
          value={planTypeId}
          onChange={setPlanTypeId}
          options={planTypes.map((planType) => ({
            value: planType.id,
            label: `${planType.name} ${planType.status === PLAN_TYPE_STATUS.DEPRECATED ? "(Deprecated)" : "(Valid)"}`,
          }))}
          onBlur={() => undefined}
          required
        />

        <FloatingTextarea
          label="Internal Notes"
          value={notes}
          onChange={setNotes}
          onBlur={() => undefined}
          rows={4}
          placeholder="Coverage notes and billing caveats"
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" loading={isLoading} onClick={handleSave} disabled={!planTypeId}>
            Save plan
          </Button>
        </div>
      </div>
    </CustomModal>
  )
}
