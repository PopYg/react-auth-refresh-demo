import type { TokenBundle } from '../types/auth'

const STORAGE_KEY = 'react-auth-refresh-demo.tokens'

export interface TokenSnapshot {
  accessToken: string | null
  refreshToken: string | null
  accessTokenExpiresAt: number | null
}

const EMPTY_SNAPSHOT: TokenSnapshot = {
  accessToken: null,
  refreshToken: null,
  accessTokenExpiresAt: null,
}

function readSnapshotFromStorage(): TokenSnapshot {
  if (typeof window === 'undefined') {
    return EMPTY_SNAPSHOT
  }

  const raw = localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return EMPTY_SNAPSHOT
  }

  try {
    const parsed = JSON.parse(raw) as TokenSnapshot
    const isValid =
      (typeof parsed.accessToken === 'string' || parsed.accessToken === null) &&
      (typeof parsed.refreshToken === 'string' || parsed.refreshToken === null) &&
      (typeof parsed.accessTokenExpiresAt === 'number' ||
        parsed.accessTokenExpiresAt === null)

    return isValid ? parsed : EMPTY_SNAPSHOT
  } catch {
    return EMPTY_SNAPSHOT
  }
}

let snapshot = readSnapshotFromStorage()
const listeners = new Set<() => void>()

function persistSnapshot(): void {
  if (typeof window === 'undefined') {
    return
  }

  if (!snapshot.accessToken && !snapshot.refreshToken) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
}

function notifyListeners(): void {
  listeners.forEach((listener) => listener())
}

export function subscribeTokenSnapshot(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getTokenSnapshot(): TokenSnapshot {
  return snapshot
}

export function setTokens(tokens: TokenBundle): void {
  snapshot = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accessTokenExpiresAt: tokens.accessTokenExpiresAt,
  }
  persistSnapshot()
  notifyListeners()
}

export function clearTokens(): void {
  snapshot = EMPTY_SNAPSHOT
  persistSnapshot()
  notifyListeners()
}
