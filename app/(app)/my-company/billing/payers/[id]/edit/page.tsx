"use client"

import { use } from "react"
import { PayerEditPage } from "../../components/edit/PayerEditPage"

interface EditPayerPageProps {
  params: Promise<{ id: string }>
}

export default function EditPayerPage({ params }: EditPayerPageProps) {
  const { id } = use(params)
  return <PayerEditPage payerId={id} />
}
