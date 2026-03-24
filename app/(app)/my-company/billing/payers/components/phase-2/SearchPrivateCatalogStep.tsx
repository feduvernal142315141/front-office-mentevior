"use client"

import { usePrivateInsuranceCatalog } from "@/lib/modules/payers/hooks/use-private-insurance-catalog"
import type { PayerCatalogItem } from "@/lib/types/payer.types"
import { SearchPayerCatalogStep } from "./SearchPayerCatalogStep"

interface SearchPrivateCatalogStepProps {
  onSelect: (item: PayerCatalogItem) => void
  onBulkCreate: (ids: string[]) => void
  isBulkLoading?: boolean
}

export function SearchPrivateCatalogStep({ onSelect, onBulkCreate, isBulkLoading }: SearchPrivateCatalogStepProps) {
  const { filteredItems, isLoading, error, search, setSearch } = usePrivateInsuranceCatalog()

  return (
    <SearchPayerCatalogStep
      description="Select a private insurance to pre-fill the payer details."
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
