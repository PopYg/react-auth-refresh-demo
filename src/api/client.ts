import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { clearTokens, getTokenSnapshot, setTokens } from '../auth/tokenStore'
import type {
  DebugStats,
  DocumentItem,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  UserProfile,
} from '../types/auth'
import { handleMockRequest } from './mockServer'

type RetryableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

async function mockAdapter(
  config: InternalAxiosRequestConfig,
): Promise<AxiosResponse> {
  const result = await handleMockRequest(config)
  const response: AxiosResponse = {
    data: result.data,
    status: result.status,
    statusText: String(result.status),
    headers: {},
    config,
  }

  const validateStatus =
    config.validateStatus ?? ((status: number) => status >= 200 && status < 300)

  if (!validateStatus(response.status)) {
    throw new AxiosError(
      `Request failed with status code ${response.status}`,
      undefined,
      config,
      undefined,
      response,
    )
  }

  return response
}

const api = axios.create({
  baseURL: '/api',
  adapter: mockAdapter,
})

const refreshApi = axios.create({
  baseURL: '/api',
  adapter: mockAdapter,
})

api.interceptors.request.use((config) => {
  const { accessToken } = getTokenSnapshot()
  const headers = AxiosHeaders.from(config.headers)

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  config.headers = headers
  return config
})

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken } = getTokenSnapshot()

  if (!refreshToken) {
    return null
  }

  const response = await refreshApi.post<RefreshResponse>('/auth/refresh', {
    refreshToken,
  })
  setTokens(response.data.tokens)
  return response.data.tokens.accessToken
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalConfig = error.config as RetryableConfig | undefined
    const statusCode = error.response?.status

    if (!originalConfig || statusCode !== 401 || originalConfig._retry) {
      return Promise.reject(error)
    }

    originalConfig._retry = true

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null
        })
      }

      const nextAccessToken = await refreshPromise

      if (!nextAccessToken) {
        clearTokens()
        return Promise.reject(error)
      }

      const retryHeaders = AxiosHeaders.from(originalConfig.headers)
      retryHeaders.set('Authorization', `Bearer ${nextAccessToken}`)
      originalConfig.headers = retryHeaders

      return api(originalConfig)
    } catch (refreshError) {
      clearTokens()
      return Promise.reject(refreshError)
    }
  },
)

export async function loginRequest(payload: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', payload)
  return response.data
}

export async function logoutRequest(): Promise<void> {
  const { refreshToken } = getTokenSnapshot()

  await api.post('/auth/logout', {
    refreshToken,
  })
}

export async function fetchMeRequest(): Promise<UserProfile> {
  const response = await api.get<UserProfile>('/me')
  return response.data
}

export async function fetchDocumentsRequest(): Promise<DocumentItem[]> {
  const response = await api.get<{ items: DocumentItem[] }>('/documents')
  return response.data.items
}

export async function expireAccessTokenRequest(): Promise<void> {
  await api.post('/auth/debug/expire-access')
}

export async function fetchDebugStatsRequest(): Promise<DebugStats> {
  const response = await api.get<DebugStats>('/auth/debug/stats')
  return response.data
}
