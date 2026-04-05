import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import './App.css'

function AppLayout() {
  const { phase } = useAuth()

  const phaseLabel =
    phase === 'authenticated'
      ? '인증됨'
      : phase === 'checking'
        ? '세션 확인 중'
        : '비인증'

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>리액트 인증 리프레시 데모</h1>
          <p className="muted">
            토큰 갱신, 요청 재시도, 보호 라우트 흐름을 최소 예제로 재구성한
            프론트엔드 인증 데모
          </p>
        </div>
        <div className="meta">
          <span className={`status-pill status-${phase}`}>{phaseLabel}</span>
        </div>
      </header>

      <nav className="local-nav">
        <Link to="/login">로그인</Link>
        <Link to="/dashboard">대시보드</Link>
      </nav>

      <main className="stage">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
