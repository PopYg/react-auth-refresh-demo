import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { phase } = useAuth()
  const location = useLocation()

  if (phase === 'checking') {
    return (
      <section className="card">
        <p className="muted">세션 유효성 확인 중...</p>
      </section>
    )
  }

  if (phase !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
