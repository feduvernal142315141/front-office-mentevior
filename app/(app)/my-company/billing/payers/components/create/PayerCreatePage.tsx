"use client"

import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import type { LucideIcon } from "lucide-react"
import { Building2, Landmark, ShieldCheck } from "lucide-react"
import { Card } from "@/components/custom/Card"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import { useCreatePayer } from "@/lib/modules/payers/hooks/use-create-payer"
import { usePayerCatalogs } from "@/lib/modules/payers/hooks/use-payer-catalogs"
import { PAYER_SOURCE, type PayerBaseFormFields, type PayerSource } from "@/lib/types/payer.types"
import { PayerBaseForm } from "../shared/PayerBaseForm"

interface PayerCreatePageProps {
  source: PayerSource
}

interface SourcePageContent {
  heading: string
  description: string
  icon: LucideIcon
  catalogLabel?: string
}

const SOURCE_PAGE_CONTENT: Record<PayerSource, SourcePageContent> = {
  [PAYER_SOURCE.MANUAL]: {
    heading: "Create Payer Manually",
    description: "Set up a payer profile from scratch with full control over contact and address information.",
    icon: Building2,
  },
  [PAYER_SOURCE.CATALOG]: {
    heading: "Create Payer from Catalog",
    description: "Pick a private insurance from catalog, review details, and create the payer in one page.",
    icon: ShieldCheck,
    catalogLabel: "Private insurance catalog",
  },
  [PAYER_SOURCE.FL_MEDICAID]: {
    heading: "Create FL Medicaid Payer",
    description: "Choose one of the official FL Medicaid options and confirm payer details before creating.",
    icon: Landmark,
    catalogLabel: "FL Medicaid catalog (13)",
  },
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

export function PayerCreatePage({ source }: PayerCreatePageProps) {
  const router = useRouter()
  const { create, isLoading } = useCreatePayer()
  const { privateInsurances, flMedicaidInsurances } = usePayerCatalogs()
  const [selectedCatalogId, setSelectedCatalogId] = useState("")
  const [formData, setFormData] = useState<PayerBaseFormFields>(EMPTY_FORM)

  const content = SOURCE_PAGE_CONTENT[source]
  const Icon = content.icon
  const isCatalogSource = source !== PAYER_SOURCE.MANUAL
  const catalogOptions = source === PAYER_SOURCE.CATALOG ? privateInsurances : flMedicaidInsurances

  const handleCatalogChange = (catalogId: string) => {
    const catalogItem = catalogOptions.find((item) => item.id === catalogId)

    setSelectedCatalogId(catalogId)
    if (catalogItem) {
      setFormData((current) => ({
        ...current,
        name: catalogItem.name,
      }))
    }
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      return
    }

    if (isCatalogSource && !selectedCatalogId) {
      return
    }

    const created = await create({
      source,
      sourceReferenceId: isCatalogSource ? selectedCatalogId : "",
      form: {
        ...formData,
        name: formData.name.trim(),
      },
    })

    if (created) {
      router.push("/my-company/billing/payers")
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await handleCreate()
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 pb-28">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center gap-4">
          <div className="rounded-xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 p-3">
            <Icon className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-3xl font-bold text-transparent">
              {content.heading}
            </h1>
            <p className="mt-1 text-slate-600">{content.description}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card variant="elevated" padding="lg">
            <div className="space-y-6">
              {isCatalogSource && content.catalogLabel && (
                <FloatingSelect
                  label={content.catalogLabel}
                  value={selectedCatalogId}
                  onChange={handleCatalogChange}
                  options={catalogOptions.map((item) => ({
                    value: item.id,
                    label: item.name,
                  }))}
                  onBlur={() => undefined}
                  required
                  searchable
                />
              )}

              <PayerBaseForm value={formData} onChange={setFormData} />
            </div>
          </Card>

          <FormBottomBar
            isSubmitting={isLoading}
            onCancel={() => router.push("/my-company/billing/payers")}
            cancelText="Back"
            submitText="Create payer"
            disabled={!formData.name.trim() || (isCatalogSource && !selectedCatalogId)}
          />
        </form>
      </div>
    </div>
  )
}
