import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { fetchMeRequest, loginRequest, logoutRequest } from '../api/client'
import type { LoginRequest, UserProfile } from '../types/auth'
import {
  clearTokens,
  getTokenSnapshot,
  setTokens,
  subscribeTokenSnapshot,
  type TokenSnapshot,
} from './tokenStore'

type AuthPhase = 'checking' | 'authenticated' | 'anonymous'

interface AuthContextValue {
  phase: AuthPhase
  user: UserProfile | null
  tokens: TokenSnapshot
  lastError: string | null
  login: (payload: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  reloadProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const tokens = useSyncExternalStore(
    subscribeTokenSnapshot,
    getTokenSnapshot,
    getTokenSnapshot,
  )
  const [phase, setPhase] = useState<AuthPhase>(
    tokens.accessToken ? 'checking' : 'anonymous',
  )
  const [user, setUser] = useState<UserProfile | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)

  useEffect(() => {
    if (!tokens.accessToken) {
      setPhase('anonymous')
      setUser(null)
      return
    }

    let cancelled = false
    setPhase('checking')

    const run = async (): Promise<void> => {
      try {
        const profile = await fetchMeRequest()

        if (cancelled) {
          return
        }

        setUser(profile)
        setPhase('authenticated')
        setLastError(null)
      } catch {
        if (cancelled) {
          return
        }

        clearTokens()
        setUser(null)
        setPhase('anonymous')
        setLastError('세션이 만료되어 재로그인이 필요합니다.')
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [tokens.accessToken])

  const login = async (payload: LoginRequest): Promise<void> => {
    const response = await loginRequest(payload)
    setTokens(response.tokens)
    setUser(response.user)
    setPhase('authenticated')
    setLastError(null)
  }

  const logout = async (): Promise<void> => {
    try {
      await logoutRequest()
    } finally {
      clearTokens()
      setUser(null)
      setPhase('anonymous')
    }
  }

  const reloadProfile = async (): Promise<void> => {
    const profile = await fetchMeRequest()
    setUser(profile)
    setPhase('authenticated')
    setLastError(null)
  }

  return (
    <AuthContext.Provider
      value={{
        phase,
        user,
        tokens,
        lastError,
        login,
        logout,
        reloadProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
