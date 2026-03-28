"use client"

import { use } from "react"
import { PayerEditPage } from "../../components/edit/PayerEditPage"

interface EditPayerPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ returnTo?: string }>
}

export default function EditPayerPage({ params, searchParams }: EditPayerPageProps) {
  const { id } = use(params)
  const { returnTo } = use(searchParams)
  return <PayerEditPage payerId={id} returnTo={returnTo} />
}
