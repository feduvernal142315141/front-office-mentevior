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

export interface CreateCompanyServicePlanDto {
  serviceId: string
  serviceName?: string
  name: string
  description?: string
  startDate?: string
  endDate?: string
  active: boolean
  categories: string[]
}

export interface UpdateCompanyServicePlanDto {
  serviceId: string
  serviceName?: string
  name: string
  description?: string
  startDate?: string
  endDate?: string
  active: boolean
  categories: string[]
}
