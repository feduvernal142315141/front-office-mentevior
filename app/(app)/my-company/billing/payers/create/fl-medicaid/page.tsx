"use client"

import { PayerCreatePage } from "../../components/create/PayerCreatePage"
import { PAYER_SOURCE } from "@/lib/types/payer.types"

export default function CreateFlMedicaidPayerPage() {
  return <PayerCreatePage source={PAYER_SOURCE.FL_MEDICAID} />
}
