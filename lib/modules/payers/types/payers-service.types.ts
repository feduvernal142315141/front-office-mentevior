import type { PlanTypeCatalogItem } from "@/lib/types/plan-type.types"
import type {
  CreatePayerDto,
  ListPayersQueryDto,
  PayerClearingHouseItem,
  Payer,
  PayerCatalogItem,
  UpdatePayerDto,
} from "@/lib/types/payer.types"

export interface PayersListResult {
  payers: Payer[]
  totalCount: number
}

export interface PayersServiceContract {
  list(query: ListPayersQueryDto): Promise<PayersListResult>
  getById(id: string): Promise<Payer>
  create(data: CreatePayerDto): Promise<Payer>
  update(data: UpdatePayerDto): Promise<Payer>
  delete(id: string): Promise<void>
  createFromPrivateInsurance(ids: string[]): Promise<void>
  createFromStateInsurance(ids: string[]): Promise<void>
  getPrivateInsurancesCatalog(): Promise<PayerCatalogItem[]>
  getFlMedicaidCatalog(): Promise<PayerCatalogItem[]>
  getClearingHouseCatalog(): Promise<PayerClearingHouseItem[]>
  getPlanTypeCatalog(): Promise<PlanTypeCatalogItem[]>
  refresh(): Promise<void>
}
