// API Client Utility
// Centralized API configuration and request handling

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'

export interface ApiError {
  message: string
  statusCode?: number
  errors?: Array<{ field: string; message: string }>
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token')
  }

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('auth_token')
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const token = this.getToken()

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      // Handle network errors
      if (!response.ok && response.status === 0) {
        throw new Error('Network error: Could not connect to server. Is the backend running?')
      }

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return {} as T
      }

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        throw new Error('Invalid JSON response from server')
      }

      if (!response.ok) {
        const error: ApiError = {
          message: data.error || 'An error occurred',
          statusCode: response.status,
          errors: data.errors,
        }
        throw error
      }

      // Handle success response format
      // Backend returns { success: true, token, user } for auth endpoints
      // Backend returns { success: true, data: [...] } for other endpoints
      if (data.success !== undefined) {
        // For auth endpoints, return the whole object (has token and user)
        if (data.token || data.user) {
          return data as T
        }
        // For endpoints with data field, return the whole response object
        // so hooks can access both data and other fields (like count)
        if (data.data !== undefined) {
          return data as T
        }
        return data as T
      }

      return data as T
    } catch (error) {
      if (error instanceof Error) {
        throw {
          message: error.message,
          statusCode: 0,
        } as ApiError
      }
      throw error
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      url += `?${searchParams.toString()}`
    }
    return this.request<T>(url, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const token = this.getToken()

    const headers: HeadersInit = {}
    // Don't set Content-Type for FormData - browser will set it with boundary

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      })

      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return {} as T
      }

      const data = await response.json()

      if (!response.ok) {
        const error: ApiError = {
          message: data.error || 'An error occurred',
          statusCode: response.status,
          errors: data.errors,
        }
        throw error
      }

      return data as T
    } catch (error) {
      if (error instanceof Error) {
        throw {
          message: error.message,
          statusCode: 0,
        } as ApiError
      }
      throw error
    }
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL)

// Export for testing
export default ApiClient

