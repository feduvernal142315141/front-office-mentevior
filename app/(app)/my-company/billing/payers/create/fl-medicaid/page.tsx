"use client"

import { useSearchParams } from "next/navigation"
import { PayerCreatePage } from "../../components/create/PayerCreatePage"
import { PAYER_SOURCE } from "@/lib/types/payer.types"

export default function CreateFlMedicaidPayerPage() {
  const searchParams = useSearchParams()
  const initialCatalogId = searchParams.get("catalogId") ?? undefined
  const initialName = searchParams.get("name") ?? undefined

  return (
    <PayerCreatePage
      source={PAYER_SOURCE.FL_MEDICAID}
      initialCatalogId={initialCatalogId}
      initialName={initialName}
    />
  )
}
