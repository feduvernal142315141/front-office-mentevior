import type {
  CreatePayerDto,
  ListPayersQueryDto,
  Payer,
  PayerCatalogItem,
  PayerPlanTypeItem,
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
  getPlanTypeCatalog(): Promise<PayerPlanTypeItem[]>
  refresh(): Promise<void>
}
