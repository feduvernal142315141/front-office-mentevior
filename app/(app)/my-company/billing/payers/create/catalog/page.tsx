"use client"

import { PayerCreatePage } from "../../components/create/PayerCreatePage"
import { PAYER_SOURCE } from "@/lib/types/payer.types"

export default function CreateCatalogPayerPage() {
  return <PayerCreatePage source={PAYER_SOURCE.CATALOG} />
}
