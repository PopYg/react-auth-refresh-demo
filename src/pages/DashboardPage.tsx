import { useEffect, useState } from 'react'
import { expireAccessTokenRequest, fetchDebugStatsRequest } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import type { DebugStats } from '../types/auth'

export function DashboardPage() {
  const { user, tokens, logout, reloadProfile } = useAuth()
  const [stats, setStats] = useState<DebugStats | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(Date.now())
    }, 500)

    return () => {
      window.clearInterval(timerId)
    }
  }, [])

  const loadStats = async (): Promise<void> => {
    const nextStats = await fetchDebugStatsRequest()
    setStats(nextStats)
  }

  useEffect(() => {
    let cancelled = false

    const run = async (): Promise<void> => {
      try {
        const nextStats = await fetchDebugStatsRequest()
        if (!cancelled) {
          setStats(nextStats)
        }
      } catch {
        if (!cancelled) {
          setStats(null)
        }
      }
    }

    void run()
    const intervalId = window.setInterval(() => {
      void run()
    }, 2_000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [tokens.accessToken])

  const handleReloadProfile = async (): Promise<void> => {
    setBusy(true)
    setActionError(null)

    try {
      await reloadProfile()
      await loadStats()
    } catch {
      setActionError('프로필 재조회에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const handleForceExpire = async (): Promise<void> => {
    setBusy(true)
    setActionError(null)

    try {
      await expireAccessTokenRequest()
      await loadStats()
    } catch {
      setActionError('토큰 강제 만료 테스트에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const handleLogout = async (): Promise<void> => {
    setBusy(true)
    setActionError(null)

    try {
      await logout()
    } catch {
      setActionError('로그아웃에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const accessTokenRemainingSec = tokens.accessTokenExpiresAt
    ? Math.max(0, Math.ceil((tokens.accessTokenExpiresAt - now) / 1000))
    : 0

  return (
    <section className="stack">
      <article className="card stack">
        <h2>인증 대시보드</h2>
        <p className="muted">
          토큰 만료 이후 인증 API 요청이 발생하면 refresh가 실행됩니다.
        </p>

        <div className="actions">
          <button className="button-secondary" onClick={() => void handleReloadProfile()}>
            프로필 재조회
          </button>
          <button className="button-ghost" onClick={() => void handleForceExpire()}>
            토큰 강제 만료
          </button>
          <button className="button" onClick={() => void handleLogout()}>
            로그아웃
          </button>
        </div>

        <dl className="info-grid">
          <div className="metric">
            <dt>사용자</dt>
            <dd>{user ? `${user.name} / ${user.email}` : '-'}</dd>
          </div>
          <div className="metric">
            <dt>액세스 토큰 잔여 시간</dt>
            <dd>{accessTokenRemainingSec}s</dd>
          </div>
          <div className="metric">
            <dt>리프레시 시도 횟수</dt>
            <dd>{stats ? stats.refreshAttemptCount : '미조회'}</dd>
          </div>
          <div className="metric">
            <dt>활성 액세스 토큰 수</dt>
            <dd>{stats ? stats.accessTokenCount : '미조회'}</dd>
          </div>
        </dl>

        <p className="tiny muted">
          통계는 2초마다 자동 갱신됩니다. TTL이 0이 되면 다음 인증 API 요청 시
          refresh가 동작합니다.
        </p>
        {actionError ? <p className="error-text">{actionError}</p> : null}
        {busy ? <p className="tiny muted">처리 중...</p> : null}
      </article>
    </section>
  )
}
