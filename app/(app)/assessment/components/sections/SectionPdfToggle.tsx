"use client"

import { PremiumSwitch } from "@/components/custom/PremiumSwitch"

interface SectionPdfToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

/** Switch de header que decide si la sección se imprime en el PDF del assessment */
export function SectionPdfToggle({ checked, onChange, disabled }: SectionPdfToggleProps) {
  return (
    <PremiumSwitch
      checked={checked}
      onCheckedChange={onChange}
      label="Include in PDF"
      compact
      disabled={disabled}
      className="flex-row-reverse"
    />
  )
}
