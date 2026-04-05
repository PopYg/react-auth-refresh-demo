# react-auth-refresh-demo

## Overview
This project is a compact React demo that implements a common authentication recovery pattern: handling expired access tokens without breaking user flow.  
Core topics are `axios interceptors`, `single-flight refresh`, and `protected routes`.

## Why This Demo Exists
- To demonstrate authentication flow handling beyond a basic login form
- To generalize production-like patterns without exposing NDA/internal company code
- To document expiration/retry/concurrency behavior in a reproducible way

## What Problem It Solves
- Duplicate refresh calls when multiple requests receive 401 concurrently
- Broken user flow when token expiration is not recovered gracefully
- Missing route-level access control for authenticated pages

## What The Demo Shows
- Login with access token + refresh token persistence
- Request interceptor that automatically attaches access token
- Response interceptor that detects 401 and executes one refresh request
- Automatic retry of failed original requests after successful refresh
- Route guard (`ProtectedRoute`) for authenticated pages
- Dashboard metrics to verify refresh behavior
  - Access Token TTL
  - Refresh Attempt Count
  - Active Access Tokens

## Tech Stack
- React 19
- TypeScript
- Vite
- axios
- react-router-dom

## Folder Structure
```text
src
├─ api
│  ├─ client.ts        # axios instances/interceptors + mock adapter
│  └─ mockServer.ts    # mock API implementation
├─ auth
│  ├─ AuthContext.tsx  # auth state context
│  └─ tokenStore.ts    # localStorage + external store
├─ components
│  ├─ ProtectedRoute.tsx
│  └─ CertificateLoginModal.tsx
├─ pages
│  ├─ LoginPage.tsx
│  └─ DashboardPage.tsx
└─ types
   └─ auth.ts
```

## Architecture Decisions
1. `mockServer` is isolated from UI to test auth/retry behavior deterministically
2. A shared `refreshPromise` enforces single-flight refresh under concurrent 401 responses
3. Token storage (`tokenStore`) is separated from React state for interceptor consistency
4. Route-level protection is explicitly handled by `ProtectedRoute`

## Update Log
- Dashboard simplification
  - Removed `Documents` and `Event Log` sections
  - Kept only auth verification metrics
- Added automatic metric refresh
  - Poll `/auth/debug/stats` every 2 seconds
  - Keep `Refresh Attempt Count` and `Active Access Tokens` up to date
- Refined dashboard actions
  - `프로필 재조회` (Reload Profile), `토큰 강제 만료` (Force Expire Token), `로그아웃`
- Fixed 401 error path in mock adapter
  - Applied `validateStatus` and throw `AxiosError` for non-2xx responses
  - Ensured response interceptor 401/refresh flow is triggered correctly
- UI text cleanup
  - Unified major UI labels in Korean
  - Removed extra top-bar helper text and user display line

## Trade-offs
- Uses a mock adapter, so behavior is not identical to a real network/security environment
- Token model is intentionally simplified (no full JWT claims/scope policy coverage)
- Some edge cases are out of scope to focus on the core auth flow

## Quick Check
```bash
npm install
npm run dev
```

1. Open `http://localhost:5173` and sign in
2. Check token TTL on `/dashboard`
3. Run `토큰 강제 만료`, then `프로필 재조회` to trigger refresh
4. Confirm `Refresh Attempt Count` increments

## Demo Account
- ID: `demo@local.test`
- PW: `pass1234`
