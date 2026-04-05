export interface UserProfile {
  id: string
  name: string
  email: string
  role: string
}

export interface TokenBundle {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: UserProfile
  tokens: TokenBundle
}

export interface RefreshResponse {
  tokens: TokenBundle
}

export type DocumentStatus = 'pending' | 'processing' | 'issued'

export interface DocumentItem {
  id: string
  title: string
  status: DocumentStatus
  lastUpdated: string
}

export interface DebugStats {
  refreshAttemptCount: number
  accessTokenCount: number
}
