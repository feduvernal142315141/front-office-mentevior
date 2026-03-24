"use client"

import { useStateInsuranceCatalog } from "@/lib/modules/payers/hooks/use-state-insurance-catalog"
import type { PayerCatalogItem } from "@/lib/types/payer.types"
import { SearchPayerCatalogStep } from "./SearchPayerCatalogStep"

interface SearchStateCatalogStepProps {
  onSelect: (item: PayerCatalogItem) => void
  onBulkCreate: (ids: string[]) => void
  isBulkLoading?: boolean
}

export function SearchStateCatalogStep({ onSelect, onBulkCreate, isBulkLoading }: SearchStateCatalogStepProps) {
  const { filteredItems, isLoading, error, search, setSearch } = useStateInsuranceCatalog()

  return (
    <SearchPayerCatalogStep
      description="Select a state insurance to pre-fill the payer details."
      items={filteredItems}
      isLoading={isLoading}
      error={error}
      search={search}
      onSearchChange={setSearch}
      onSelect={onSelect}
      onBulkCreate={onBulkCreate}
      isBulkLoading={isBulkLoading}
    />
  )
}
