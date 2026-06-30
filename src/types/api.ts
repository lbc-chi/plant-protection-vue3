export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp?: number
}

export interface PaginatedData<T = any> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface ApiError {
  code: number
  message: string
  details?: string
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export interface RequestConfig {
  url: string
  method: HttpMethod
  params?: Record<string, any>
  data?: any
  headers?: Record<string, string>
  timeout?: number
}
