"use client"

import { use } from "react"
import { PayerManagePage } from "../../components/manage/PayerManagePage"

interface ManagePayerPageProps {
  params: Promise<{ id: string }>
}

export default function ManagePayerRoute({ params }: ManagePayerPageProps) {
  const { id } = use(params)
  return <PayerManagePage payerId={id} />
}
