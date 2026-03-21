"use client"

import type { PayerBaseFormFields } from "@/lib/types/payer.types"
import { FloatingInput } from "@/components/custom/FloatingInput"

interface PayerBaseFormProps {
  value: PayerBaseFormFields
  onChange: (nextValue: PayerBaseFormFields) => void
}

export function PayerBaseForm({ value, onChange }: PayerBaseFormProps) {
  const handleBlur = () => undefined

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <FloatingInput
          label="Name"
          value={value.name}
          onChange={(nextValue) => onChange({ ...value, name: nextValue })}
          onBlur={handleBlur}
          placeholder="Insurance name"
          required
        />
      </div>

      <div>
        <FloatingInput
          label="Phone"
          value={value.phone}
          onChange={(nextValue) => onChange({ ...value, phone: nextValue })}
          onBlur={handleBlur}
          placeholder="(305) 555-0000"
        />
      </div>

      <div>
        <FloatingInput
          label="Email"
          value={value.email}
          onChange={(nextValue) => onChange({ ...value, email: nextValue })}
          onBlur={handleBlur}
          type="email"
          placeholder="payer@insurance.com"
        />
      </div>

      <div>
        <FloatingInput
          label="Member ID"
          value={value.memberId}
          onChange={(nextValue) => onChange({ ...value, memberId: nextValue })}
          onBlur={handleBlur}
        />
      </div>

      <div>
        <FloatingInput
          label="Group Number"
          value={value.groupNumber}
          onChange={(nextValue) => onChange({ ...value, groupNumber: nextValue })}
          onBlur={handleBlur}
        />
      </div>

      <div className="md:col-span-2">
        <FloatingInput
          label="Address"
          value={value.address.line1}
          onChange={(nextValue) =>
            onChange({
              ...value,
              address: {
                ...value.address,
                line1: nextValue,
              },
            })
          }
          onBlur={handleBlur}
          placeholder="Street and number"
        />
      </div>

      <div>
        <FloatingInput
          label="City"
          value={value.address.city}
          onChange={(nextValue) =>
            onChange({
              ...value,
              address: {
                ...value.address,
                city: nextValue,
              },
            })
          }
          onBlur={handleBlur}
        />
      </div>

      <div>
        <FloatingInput
          label="State"
          value={value.address.state}
          onChange={(nextValue) =>
            onChange({
              ...value,
              address: {
                ...value.address,
                state: nextValue,
              },
            })
          }
          onBlur={handleBlur}
        />
      </div>

      <div>
        <FloatingInput
          label="Zip Code"
          value={value.address.zipCode}
          onChange={(nextValue) =>
            onChange({
              ...value,
              address: {
                ...value.address,
                zipCode: nextValue,
              },
            })
          }
          onBlur={handleBlur}
        />
      </div>
    </div>
  )
}
