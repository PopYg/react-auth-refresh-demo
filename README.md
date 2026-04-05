# 리액트 인증 리프레시 데모

## 개요
만료된 access token을 사용자 흐름을 깨지 않고 복구하는 인증 패턴을 React로 구현한 데모입니다.  
핵심 주제는 `axios 인터셉터`, `single-flight refresh`, `보호 라우트`입니다.

## 이 데모를 만든 이유
- 로그인 화면 구현을 넘어 인증 상태 흐름 제어 패턴을 명확히 보여주기 위함
- NDA 대상 실무 코드를 공개하지 않고, 구조 패턴만 일반화한 샘플을 제공하기 위함
- 토큰 만료/재시도/동시성 처리 방식을 재현 가능한 형태로 문서화하기 위함

## 해결하려는 문제
- 동시에 여러 API 요청이 401을 받을 때 refresh 요청이 중복 호출되는 문제
- 토큰 만료 시 사용자 흐름이 강제 중단되는 문제
- 인증 필요 페이지의 접근 제어 누락 문제

## 데모에서 확인할 수 있는 내용
- 로그인 후 access token + refresh token 저장
- 요청 인터셉터에서 access token 자동 첨부
- 응답 인터셉터에서 401 감지 후 refresh 단일 실행(single-flight)
- refresh 성공 후 실패한 원요청 자동 재시도
- `ProtectedRoute` 기반 인증 페이지 접근 제어
- 대시보드 지표를 통한 refresh 동작 확인
  - 액세스 토큰 잔여 시간(Access Token TTL)
  - 리프레시 시도 횟수(Refresh Attempt Count)
  - 활성 액세스 토큰 수(Active Access Tokens)

## 기술 스택
- React 19
- TypeScript
- Vite
- axios
- react-router-dom

## 폴더 구조
```text
src
├─ api
│  ├─ client.ts        # axios 인스턴스/인터셉터 + mock adapter
│  └─ mockServer.ts    # 테스트용 mock API
├─ auth
│  ├─ AuthContext.tsx  # 인증 상태 컨텍스트
│  └─ tokenStore.ts    # localStorage + 외부 store
├─ components
│  ├─ ProtectedRoute.tsx
│  └─ CertificateLoginModal.tsx
├─ pages
│  ├─ LoginPage.tsx
│  └─ DashboardPage.tsx
└─ types
   └─ auth.ts
```

## 아키텍처 결정
1. `mockServer`를 분리해 인증/재시도 로직을 UI와 독립적으로 테스트
2. `refreshPromise` 공유로 동시 401 상황에서 refresh 단일 실행 보장
3. 토큰 저장소(`tokenStore`)를 React 상태와 분리해 인터셉터 접근 일관성 확보
4. 인증 페이지 접근 제어를 라우팅 계층(`ProtectedRoute`)에서 명시적으로 처리

## 작업 내역
- 대시보드 단순화
  - `Documents`, `Event Log` 섹션 제거
  - 인증 검증에 필요한 지표 카드만 유지
- 지표 자동 갱신 추가
  - `/auth/debug/stats`를 2초 주기로 조회
  - `Refresh Attempt Count`, `Active Access Tokens` 실시간 반영
- 인증 동작 검증 버튼 정리
  - `프로필 재조회`, `토큰 강제 만료`, `로그아웃`
- 401 처리 경로 수정
  - mock adapter에서 `validateStatus`를 적용해 비정상 상태코드 시 `AxiosError`를 throw
  - 응답 인터셉터의 401 분기/refresh 로직이 정상 트리거되도록 수정
- UI 텍스트 정리
  - 주요 화면 문구 한글 통일
  - 상단 보조 문구/사용자 표시 텍스트 제거

## 트레이드오프
- mock adapter 기반이므로 실제 네트워크/보안 환경과 완전히 동일하지 않음
- 토큰 모델을 단순화해 JWT claims/scope/정교한 만료 정책은 범위에서 제외
- 핵심 인증 흐름 검증 중심으로 일부 예외 케이스는 축약

## 실행 확인
```bash
npm install
npm run dev
```

1. `http://localhost:5173` 접속 후 로그인
2. `/dashboard`에서 토큰 잔여 시간 확인
3. `토큰 강제 만료` 실행 후 `프로필 재조회`로 refresh 발생 확인
4. `리프레시 시도 횟수` 증가 여부 확인

## 데모 계정
- ID: `demo@local.test`
- PW: `pass1234`
