import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { storage } from './storage'

interface RequestConfig extends AxiosRequestConfig {
  showError?: boolean
  showLoading?: boolean
}

interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const instance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    if ((config as RequestConfig).showLoading) {
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

instance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data

    if (res.code === 200 || res.code === 0) {
      return res.data
    }

    const error = new Error(res.message || '请求失败') as Error & { code: number; data: any }
    error.code = res.code
    error.data = res.data

    if ((response.config as RequestConfig).showError !== false) {
      console.error(`[API Error] ${res.message}`)
    }

    return Promise.reject(error)
  },
  (error) => {
    let message = '网络错误，请稍后重试'

    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '请求参数错误'
          break
        case 401:
          message = '未授权，请重新登录'
          storage.removeToken()
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求资源不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        default:
          message = `请求失败 (${error.response.status})`
      }
    } else if (error.code === 'ECONNABORTED') {
      message = '请求超时，请稍后重试'
    }

    const errorObj = new Error(message) as Error & { status?: number }
    errorObj.status = error.response?.status

    if ((error.config as RequestConfig)?.showError !== false) {
      console.error(`[API Error] ${message}`)
    }

    return Promise.reject(errorObj)
  }
)

export function get<T = any>(url: string, params?: Record<string, any>, config?: RequestConfig): Promise<T> {
  return instance.get(url, { params, ...config })
}

export function post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
  return instance.post(url, data, config)
}

export function put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
  return instance.put(url, data, config)
}

export function del<T = any>(url: string, config?: RequestConfig): Promise<T> {
  return instance.delete(url, config)
}

export function upload<T = any>(url: string, file: File | FormData, onProgress?: (percent: number) => void): Promise<T> {
  const formData = file instanceof FormData ? file : new FormData()
  if (!(file instanceof FormData)) {
    formData.append('file', file)
  }

  return instance.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(percent)
      }
    }
  })
}

export function download(url: string, filename?: string, params?: Record<string, any>): Promise<void> {
  return instance.get(url, {
    params,
    responseType: 'blob'
  }).then((data: Blob) => {
    const blobUrl = window.URL.createObjectURL(new Blob([data]))
    const link = document.createElement('a')
    link.href = blobUrl
    link.setAttribute('download', filename || 'download')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(blobUrl)
  })
}

export default instance
