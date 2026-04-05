import { useEffect, useState } from 'react'

interface CertificateProvider {
  id: string
  name: string
  badge: string
  bg: string
  color: string
}

const CERTIFICATE_PROVIDERS: CertificateProvider[] = [
  { id: 'hana', name: '하나인증서', badge: '하나', bg: '#129d9c', color: '#f3ffff' },
  {
    id: 'kakaobank',
    name: '카카오뱅크',
    badge: 'K',
    bg: '#ffd700',
    color: '#2e2700',
  },
  { id: 'naver', name: '네이버', badge: 'N', bg: '#1ec95b', color: '#f4fff7' },
  {
    id: 'kookmin',
    name: '국민인증서',
    badge: 'KB',
    bg: '#f4cb45',
    color: '#2f2100',
  },
  { id: 'pass', name: '통신사PASS', badge: 'PASS', bg: '#ff4a70', color: '#fff3f6' },
  {
    id: 'banksalad',
    name: '뱅크샐러드',
    badge: 'BS',
    bg: '#e9f3ff',
    color: '#1b66aa',
  },
  { id: 'kakaotalk', name: '카카오톡', badge: 'TALK', bg: '#f1db1e', color: '#261f00' },
  { id: 'woori', name: '우리인증서', badge: 'WON', bg: '#e8f3ff', color: '#11406e' },
  { id: 'shinhan', name: '신한인증서', badge: '신한', bg: '#2265ee', color: '#f4f8ff' },
  { id: 'nonghyup', name: 'NH인증서', badge: 'NH', bg: '#2f70d8', color: '#f2f7ff' },
  {
    id: 'samsung',
    name: '삼성패스',
    badge: 'Pass',
    bg: '#3f64f0',
    color: '#f4f6ff',
  },
  { id: 'toss', name: '토스', badge: 'T', bg: '#4ea8ff', color: '#f0f8ff' },
  { id: 'dream', name: '드림인증', badge: 'D', bg: '#1e65c9', color: '#eff6ff' },
  { id: 'payco', name: '페이코', badge: 'PAYCO', bg: '#ff334b', color: '#fff4f6' },
]

const AGREEMENT_ITEMS = [
  '개인정보 이용 동의',
  '제3자정보제공동의',
  '고유식별정보처리동의',
]

interface CertificateLoginModalProps {
  open: boolean
  onClose: () => void
  onRequestAuth: () => Promise<void>
}

export function CertificateLoginModal({
  open,
  onClose,
  onRequestAuth,
}: CertificateLoginModalProps) {
  const [selectedProvider, setSelectedProvider] = useState(CERTIFICATE_PROVIDERS[0].id)
  const [name, setName] = useState('홍길동')
  const [rrnFront, setRrnFront] = useState('800000')
  const [rrnBack, setRrnBack] = useState('000000')
  const [phonePrefix, setPhonePrefix] = useState('010')
  const [phoneMiddle, setPhoneMiddle] = useState('1234')
  const [phoneLast, setPhoneLast] = useState('1234')
  const [agreements, setAgreements] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(AGREEMENT_ITEMS.map((item) => [item, true])),
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    setSelectedProvider(CERTIFICATE_PROVIDERS[0].id)
    setName('홍길동')
    setRrnFront('800000')
    setRrnBack('000000')
    setPhonePrefix('010')
    setPhoneMiddle('1234')
    setPhoneLast('1234')
    setAgreements(Object.fromEntries(AGREEMENT_ITEMS.map((item) => [item, true])))
    setStatusMessage('')
    setErrorMessage(null)
    setIsSubmitting(false)
  }, [open])

  if (!open) {
    return null
  }

  const allAgreed = AGREEMENT_ITEMS.every((item) => agreements[item])

  const updateAgreement = (key: string, checked: boolean): void => {
    setAgreements((prev) => ({
      ...prev,
      [key]: checked,
    }))
  }

  const handleRequest = async (): Promise<void> => {
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      setStatusMessage('인증 요청 전송 중...')
      await new Promise((resolve) => setTimeout(resolve, 900))
      setStatusMessage('요청 전송 완료. 인증 결과 확인 중...')
      await new Promise((resolve) => setTimeout(resolve, 700))
      await onRequestAuth()
      setStatusMessage('인증 성공. 로그인 처리 완료')
      onClose()
    } catch {
      setErrorMessage('공동인증 로그인 처리에 실패했습니다. 다시 시도해주세요.')
      setStatusMessage('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="cert-modal-backdrop" onClick={onClose}>
      <article
        className="cert-modal"
        role="dialog"
        aria-modal="true"
        aria-label="공동인증 로그인 모달"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="cert-close" type="button" onClick={onClose}>
          ×
        </button>

        <div className="cert-layout">
          <section className="cert-panel">
            <h3 className="cert-heading">민간인증서</h3>
            <div className="cert-provider-grid">
              {CERTIFICATE_PROVIDERS.map((provider) => {
                const isSelected = provider.id === selectedProvider
                return (
                  <button
                    className={`cert-provider-card ${isSelected ? 'cert-provider-selected' : ''}`}
                    key={provider.id}
                    type="button"
                    onClick={() => setSelectedProvider(provider.id)}
                  >
                    <span
                      className="cert-provider-badge"
                      style={{
                        backgroundColor: provider.bg,
                        color: provider.color,
                      }}
                    >
                      {provider.badge}
                    </span>
                    <span className="cert-provider-name">{provider.name}</span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="cert-panel">
            <h3 className="cert-heading">본인인증 정보 입력</h3>

            <div className="cert-field-stack">
              <label className="label">
                이름
                <input
                  className="input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>

              <div className="label">
                주민등록번호
                <div className="cert-inline">
                  <input
                    className="input"
                    value={rrnFront}
                    onChange={(event) => setRrnFront(event.target.value)}
                  />
                  <input
                    className="input"
                    value={rrnBack}
                    onChange={(event) => setRrnBack(event.target.value)}
                  />
                </div>
              </div>

              <div className="label">
                휴대폰 번호
                <div className="cert-inline">
                  <select
                    className="input cert-prefix"
                    value={phonePrefix}
                    onChange={(event) => setPhonePrefix(event.target.value)}
                  >
                    <option value="010">010</option>
                    <option value="011">011</option>
                    <option value="016">016</option>
                  </select>
                  <input
                    className="input"
                    value={phoneMiddle}
                    onChange={(event) => setPhoneMiddle(event.target.value)}
                  />
                  <input
                    className="input"
                    value={phoneLast}
                    onChange={(event) => setPhoneLast(event.target.value)}
                  />
                </div>
              </div>

              <section className="cert-agreement-block">
                <div className="cert-agreement-header">
                  <strong>서비스 이용에 대한 동의</strong>
                  <label className="cert-all-agree">
                    <input
                      checked={allAgreed}
                      type="checkbox"
                      onChange={(event) => {
                        const checked = event.target.checked
                        setAgreements(
                          Object.fromEntries(
                            AGREEMENT_ITEMS.map((item) => [item, checked]),
                          ),
                        )
                      }}
                    />
                    전체동의
                  </label>
                </div>

                {AGREEMENT_ITEMS.map((item) => (
                  <div className="cert-agreement-row" key={item}>
                    <label className="cert-check-label">
                      <input
                        checked={agreements[item]}
                        type="checkbox"
                        onChange={(event) => updateAgreement(item, event.target.checked)}
                      />
                      {item}
                    </label>
                    <button className="cert-view-btn" type="button">
                      보기
                    </button>
                  </div>
                ))}
              </section>
            </div>
          </section>
        </div>

        {statusMessage ? <p className="cert-status">{statusMessage}</p> : null}
        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

        <button
          className="cert-request-btn"
          type="button"
          disabled={isSubmitting}
          onClick={() => void handleRequest()}
        >
          {isSubmitting ? '인증 처리 중...' : '인증 요청'}
        </button>
      </article>
    </div>
  )
}
