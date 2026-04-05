import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CertificateLoginModal } from '../components/CertificateLoginModal'
import { DEMO_ACCOUNT } from '../api/mockServer'
import { useAuth } from '../auth/AuthContext'

interface LocationState {
  from?: string
}

export function LoginPage() {
  const { login, phase, lastError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState<'account' | 'certificate'>('account')
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false)
  const [email, setEmail] = useState(DEMO_ACCOUNT.email)
  const [password, setPassword] = useState(DEMO_ACCOUNT.password)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const state = location.state as LocationState | null
  const nextPath = state?.from ?? '/dashboard'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      await login({
        email,
        password,
      })
      navigate(nextPath, { replace: true })
    } catch {
      setErrorMessage('로그인 실패: 데모 계정 정보를 확인해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCertificateLogin = async (): Promise<void> => {
    setErrorMessage(null)

    await login({
      email: DEMO_ACCOUNT.email,
      password: DEMO_ACCOUNT.password,
    })
    navigate(nextPath, { replace: true })
  }

  return (
    <>
      <section className="card card-login stack">
        <h2>모의 로그인</h2>
        <p className="muted">
          로그인 진입 방식을 `계정 로그인`과 `공동인증 로그인`으로 분기한 데모입니다.
        </p>
        <div className="login-mode-switch">
          <button
            className={`mode-button ${mode === 'account' ? 'mode-active' : ''}`}
            type="button"
            onClick={() => setMode('account')}
          >
            계정 로그인
          </button>
          <button
            className={`mode-button ${mode === 'certificate' ? 'mode-active' : ''}`}
            type="button"
            onClick={() => setMode('certificate')}
          >
            공동인증 로그인
          </button>
        </div>

        <div className="callout">
          <p>
            데모 아이디: <strong>{DEMO_ACCOUNT.email}</strong>
          </p>
          <p>
            데모 비밀번호: <strong>{DEMO_ACCOUNT.password}</strong>
          </p>
        </div>

        {phase === 'checking' ? (
          <p className="tiny muted">기존 세션을 확인 중입니다.</p>
        ) : null}
        {lastError ? <p className="error-text">{lastError}</p> : null}
        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
        {mode === 'account' ? (
          <form className="stack" onSubmit={handleSubmit}>
            <label className="label">
              이메일
              <input
                className="input"
                type="email"
                value={email}
                autoComplete="username"
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="label">
              비밀번호
              <input
                className="input"
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <button className="button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? '로그인 중...' : '로그인'}
            </button>
          </form>
        ) : (
          <section className="certificate-entry stack">
            <p className="tiny muted">
              공동인증 로그인 버튼 클릭 시, 실무형 인증 모달 UI를 데모 프로세스로
              확인할 수 있습니다.
            </p>
            <button
              className="button-ghost"
              type="button"
              onClick={() => setIsCertificateModalOpen(true)}
            >
              공동인증 로그인 시작
            </button>
          </section>
        )}
      </section>

      <CertificateLoginModal
        open={isCertificateModalOpen}
        onClose={() => setIsCertificateModalOpen(false)}
        onRequestAuth={handleCertificateLogin}
      />
    </>
  )
}
