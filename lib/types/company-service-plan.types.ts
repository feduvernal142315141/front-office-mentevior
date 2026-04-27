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
