import type {
  CreatePayerDto,
  ListPayersQueryDto,
  Payer,
  PayerCatalogItem,
  PayerPlanTypeItem,
  UpdatePayerDto,
  UpdatePayerPlanDto,
} from "@/lib/types/payer.types"

export interface PayersServiceContract {
  list(query: ListPayersQueryDto): Promise<Payer[]>
  create(data: CreatePayerDto): Promise<Payer>
  update(data: UpdatePayerDto): Promise<Payer>
  updatePlan(data: UpdatePayerPlanDto): Promise<Payer>
  getPrivateInsurancesCatalog(): Promise<PayerCatalogItem[]>
  getFlMedicaidCatalog(): Promise<PayerCatalogItem[]>
  getPlanTypeCatalog(): Promise<PayerPlanTypeItem[]>
  refresh(): Promise<void>
}
