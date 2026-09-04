import type { PlanTypeCatalogItem } from "@/lib/types/plan-type.types"
import type {
  ClaimMdEnrollmentStartResult,
  ClaimMdEnrollType,
  CreatePayerDto,
  ListPayersQueryDto,
  PayerClearingHouseItem,
  PayerCatalogSearchItem,
  Payer,
  PayerCatalogItem,
  SearchPayerCatalogQuery,
  UpdatePayerDto,
} from "@/lib/types/payer.types"

export interface PayersListResult {
  payers: Payer[]
  totalCount: number
}

export interface PayerCatalogSearchResult {
  items: PayerCatalogSearchItem[]
  totalCount: number
  /**
   * El clearing house no tiene proveedor de catálogo (Availity y Sunshine Health hoy).
   * No es un fallo transitorio: reintentar da 422 siempre, así que quien consuma esto
   * debe dejar de pedir para ese clearing house.
   */
  unsupported: boolean
}

export interface PayersServiceContract {
  list(query: ListPayersQueryDto): Promise<PayersListResult>
  getById(id: string): Promise<Payer>
  create(data: CreatePayerDto): Promise<Payer>
  update(data: UpdatePayerDto): Promise<Payer>
  delete(id: string): Promise<void>
  createFromPrivateInsurance(ids: string[]): Promise<void>
  getPrivateInsurancesCatalog(): Promise<PayerCatalogItem[]>
  getClearingHouseCatalog(): Promise<PayerClearingHouseItem[]>
  searchPayerCatalog(
    clearingHouseId: string,
    query: SearchPayerCatalogQuery,
  ): Promise<PayerCatalogSearchResult>
  getPlanTypeCatalog(): Promise<PlanTypeCatalogItem[]>
  startClaimMdEnrollment(
    payerId: string,
    enrollType?: ClaimMdEnrollType,
  ): Promise<ClaimMdEnrollmentStartResult>
  refresh(): Promise<void>
}
