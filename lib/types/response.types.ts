
export interface PaginatedResponse<T> {
  entities: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}
