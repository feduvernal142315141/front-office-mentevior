export interface CompanyServicePlan {
  id: string
  serviceId: string
  serviceName: string
  name: string
  description: string
  startDate?: string
  endDate?: string
  active: boolean
  categories: string[]
}

export interface ServicePlanCategorySummary {
  id: string
  categoryId: string
  categoryName: string
  totalItems: number
}

export interface CreateCompanyServicePlanDto {
  serviceId: string
  name: string
  description?: string
  startDate?: string
  endDate?: string
  active: boolean
  categories: string[]
}

export interface UpdateCompanyServicePlanDto {
  id: string
  serviceId: string
  name: string
  description?: string
  startDate?: string
  endDate?: string
  active: boolean
  categories: string[]
}
