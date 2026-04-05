import { AxiosHeaders, type AxiosRequestConfig } from 'axios'
import type {
  DebugStats,
  DocumentItem,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  TokenBundle,
  UserProfile,
} from '../types/auth'

interface MockApiResponse<T = unknown> {
  status: number
  data: T
}

interface DemoUserRecord {
  id: string
  name: string
  email: string
  password: string
  role: string
}

interface AccessSession {
  userId: string
  expiresAt: number
}

const ACCESS_TOKEN_TTL_MS = 7_000

const DEMO_USER: DemoUserRecord = {
  id: 'usr-1001',
  name: 'Demo Operator',
  email: 'demo@local.test',
  password: 'pass1234',
  role: 'document-reviewer',
}

export const DEMO_ACCOUNT = {
  email: DEMO_USER.email,
  password: DEMO_USER.password,
}

const accessSessions = new Map<string, AccessSession>()
const refreshSessions = new Map<string, string>()
let refreshAttemptCount = 0

const demoDocuments: DocumentItem[] = [
  {
    id: 'doc-001',
    title: 'Verification Request A',
    status: 'pending',
    lastUpdated: '2026-03-24 09:20',
  },
  {
    id: 'doc-002',
    title: 'Submission Follow-up B',
    status: 'processing',
    lastUpdated: '2026-03-24 13:44',
  },
  {
    id: 'doc-003',
    title: 'Issued Document C',
    status: 'issued',
    lastUpdated: '2026-03-25 10:17',
  },
]

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function randomToken(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}-${Math.random().toString(16).slice(2, 8)}`
}

function issueTokens(userId: string): TokenBundle {
  const accessToken = randomToken('atk')
  const refreshToken = randomToken('rtk')
  const accessTokenExpiresAt = Date.now() + ACCESS_TOKEN_TTL_MS

  accessSessions.set(accessToken, {
    userId,
    expiresAt: accessTokenExpiresAt,
  })
  refreshSessions.set(refreshToken, userId)

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
  }
}

function parseBody<T>(data: unknown): Partial<T> {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as Partial<T>
    } catch {
      return {}
    }
  }

  if (typeof data === 'object' && data !== null) {
    return data as Partial<T>
  }

  return {}
}

function getPath(url: string | undefined): string {
  if (!url) {
    return '/'
  }

  if (url.startsWith('http')) {
    return new URL(url).pathname
  }

  return url.startsWith('/api/') ? url.replace('/api', '') : url
}

function getAuthorization(config: AxiosRequestConfig): string | null {
  const headers = config.headers

  if (!headers) {
    return null
  }

  if (headers instanceof AxiosHeaders) {
    const value = headers.get('Authorization')
    return typeof value === 'string' ? value : null
  }

  const authValue =
    (headers as Record<string, unknown>).Authorization ??
    (headers as Record<string, unknown>).authorization

  return typeof authValue === 'string' ? authValue : null
}

function toPublicUser(user: DemoUserRecord): UserProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }
}

function unauthorized(message = 'Unauthorized'): MockApiResponse {
  return {
    status: 401,
    data: {
      message,
    },
  }
}

function authenticate(config: AxiosRequestConfig): {
  user: DemoUserRecord
  accessToken: string
} | null {
  const authHeader = getAuthorization(config)

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const accessToken = authHeader.replace('Bearer ', '')
  const session = accessSessions.get(accessToken)

  if (!session) {
    return null
  }

  if (Date.now() >= session.expiresAt) {
    accessSessions.delete(accessToken)
    return null
  }

  if (session.userId !== DEMO_USER.id) {
    return null
  }

  return {
    user: DEMO_USER,
    accessToken,
  }
}

export async function handleMockRequest(
  config: AxiosRequestConfig,
): Promise<MockApiResponse> {
  await delay(220 + Math.floor(Math.random() * 180))

  const method = (config.method ?? 'get').toUpperCase()
  const path = getPath(config.url)

  if (method === 'POST' && path === '/auth/login') {
    const body = parseBody<LoginRequest>(config.data)
    const email = typeof body.email === 'string' ? body.email : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (email !== DEMO_USER.email || password !== DEMO_USER.password) {
      return unauthorized('Invalid email or password')
    }

    const payload: LoginResponse = {
      user: toPublicUser(DEMO_USER),
      tokens: issueTokens(DEMO_USER.id),
    }

    return {
      status: 200,
      data: payload,
    }
  }

  if (method === 'POST' && path === '/auth/refresh') {
    refreshAttemptCount += 1
    const body = parseBody<{ refreshToken: string }>(config.data)
    const refreshToken =
      typeof body.refreshToken === 'string' ? body.refreshToken : null

    if (!refreshToken) {
      return unauthorized('Missing refresh token')
    }

    const userId = refreshSessions.get(refreshToken)

    if (!userId) {
      return unauthorized('Refresh token expired')
    }

    refreshSessions.delete(refreshToken)
    const payload: RefreshResponse = {
      tokens: issueTokens(userId),
    }

    return {
      status: 200,
      data: payload,
    }
  }

  if (method === 'POST' && path === '/auth/logout') {
    const body = parseBody<{ refreshToken: string }>(config.data)
    if (typeof body.refreshToken === 'string') {
      refreshSessions.delete(body.refreshToken)
    }

    return {
      status: 204,
      data: null,
    }
  }

  if (method === 'GET' && path === '/me') {
    const session = authenticate(config)
    if (!session) {
      return unauthorized('Access token expired')
    }

    return {
      status: 200,
      data: toPublicUser(session.user),
    }
  }

  if (method === 'GET' && path === '/documents') {
    const session = authenticate(config)
    if (!session) {
      return unauthorized('Access token expired')
    }

    return {
      status: 200,
      data: {
        items: demoDocuments,
      },
    }
  }

  if (method === 'POST' && path === '/auth/debug/expire-access') {
    const session = authenticate(config)
    if (!session) {
      return unauthorized('Access token expired')
    }

    const prev = accessSessions.get(session.accessToken)
    if (prev) {
      accessSessions.set(session.accessToken, {
        userId: prev.userId,
        expiresAt: Date.now() - 1,
      })
    }

    return {
      status: 200,
      data: {
        message: 'access token expired manually',
      },
    }
  }

  if (method === 'GET' && path === '/auth/debug/stats') {
    const session = authenticate(config)
    if (!session) {
      return unauthorized('Access token expired')
    }

    const payload: DebugStats = {
      refreshAttemptCount,
      accessTokenCount: accessSessions.size,
    }

    return {
      status: 200,
      data: payload,
    }
  }

  return {
    status: 404,
    data: {
      message: `Route not found: ${method} ${path}`,
    },
  }
}
