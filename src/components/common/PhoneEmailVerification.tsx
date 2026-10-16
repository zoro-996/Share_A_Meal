import React, { useEffect, useRef, useState } from 'react'
import { CheckCircle2, LoaderCircle, Phone } from 'lucide-react'
import type { CountryCode } from '../../types/registration'

declare global {
  interface Window {
    phoneEmailListener?: (user: { user_json_url?: string }) => void
  }
}

interface VerifiedPhone {
  countryCode: CountryCode
  phoneNumber: string
}

interface PhoneEmailVerificationProps {
  value: VerifiedPhone | null
  onVerified: (phone: VerifiedPhone | null) => void
  accent?: 'green' | 'orange'
  error?: string
}

const CLIENT_ID = import.meta.env.VITE_PHONE_EMAIL_CLIENT_ID as string | undefined
const PHONE_EMAIL_SCRIPT = 'https://www.phone.email/sign_in_button_v1.js'

export const PhoneEmailVerification: React.FC<PhoneEmailVerificationProps> = ({ value, onVerified, accent = 'green', error: validationError }) => {
  const widgetRef = useRef<HTMLDivElement>(null)
  const [isReady, setIsReady] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (value) return
    if (!CLIENT_ID) return

    const handleVerified = async (event: Event) => {
      const userJsonUrl = (event as CustomEvent<{ userJsonUrl?: string }>).detail?.userJsonUrl
      if (!userJsonUrl) {
        setError('Phone verification did not return a verified number. Please try again.')
        setIsVerifying(false)
        return
      }

      try {
        const response = await fetch('/api/phone-email/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userJsonUrl }),
        })
        const result = await response.json() as { success?: boolean; countryCode?: CountryCode; phoneNumber?: string; error?: string }
        if (!response.ok || !result.success || !result.countryCode || !result.phoneNumber) {
          throw new Error(result.error || 'We could not confirm the verified mobile number.')
        }
        onVerified({ countryCode: result.countryCode, phoneNumber: result.phoneNumber })
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not confirm the verified mobile number. Please try again.')
      } finally {
        setIsVerifying(false)
      }
    }

    window.phoneEmailListener = (user) => {
      window.dispatchEvent(new CustomEvent('share-a-meal-phone-email', {
        detail: { userJsonUrl: user?.user_json_url },
      }))
    }
    window.addEventListener('share-a-meal-phone-email', handleVerified)

    const script = document.createElement('script')
    const handleLoad = () => setIsReady(true)
    script.addEventListener('load', handleLoad)
    script.src = PHONE_EMAIL_SCRIPT
    script.async = true
    document.body.appendChild(script)

    return () => {
      window.removeEventListener('share-a-meal-phone-email', handleVerified)
      script.removeEventListener('load', handleLoad)
      script.remove()
    }
  }, [onVerified, value])

  // The provider script mutates the DOM outside React. Remove its generated
  // button as soon as a verified number is available, leaving only our UI.
  useEffect(() => {
    if (value) document.querySelectorAll('#btn_ph_login').forEach((element) => element.remove())
  }, [value])

  const openVerification = () => {
    setError(null)
    if (!CLIENT_ID) {
      setError('Phone verification is not configured. Add VITE_PHONE_EMAIL_CLIENT_ID to .env.local and restart the app.')
      return
    }
    const providerButton = widgetRef.current?.querySelector<HTMLElement>('button, a, input[type="button"], input[type="submit"]')
    if (!providerButton) {
      setError('Phone verification is still loading. Please try again in a moment.')
      return
    }
    setIsVerifying(true)
    providerButton.click()
  }

  const green = accent === 'green'
  const buttonClass = green
    ? 'bg-[#1E824C] hover:bg-[#166B3D] focus-visible:ring-[#1E824C]/30'
    : 'bg-[#B45309] hover:bg-[#92400E] focus-visible:ring-[#B45309]/30'

  if (value) {
    return (
      <div className="rounded-xl border border-[#C8E6C9] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(41,53,47,0.04)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8F5E9] text-[#1E824C]">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#6B756F]">Mobile number verified</p>
              <p className="truncate text-sm font-bold tracking-wide text-[#29352F]">{value.countryCode} {value.phoneNumber}</p>
            </div>
          </div>
          <button type="button" onClick={() => onVerified(null)} className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#1B5E20] hover:bg-[#E8F5E9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E824C]/30 cursor-pointer">
            Change
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div ref={widgetRef} style={{ position: 'fixed', left: '-10000px', top: '-10000px', width: '1px', height: '1px', overflow: 'hidden', opacity: 0, pointerEvents: 'none' }} data-client-id={CLIENT_ID || ''}>
        <div className="pe_signin_button" data-client-id={CLIENT_ID || ''} />
      </div>
      <button type="button" onClick={openVerification} disabled={isVerifying || !isReady} className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-sm transition-all focus:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer ${buttonClass}`}>
        {isVerifying ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
        <span>{isVerifying ? 'Verifying mobile number…' : 'Verify with Mobile Number'}</span>
      </button>
      {!isReady && CLIENT_ID && <p className="text-xs text-[#6B756F]">Loading secure phone verification…</p>}
      {(error || validationError) && <p role="alert" className="text-xs font-medium text-red-600">{error || validationError}</p>}
    </div>
  )
}
