import React, { useState, useEffect, useRef } from 'react'
import {
  CheckCircle2,
  LoaderCircle,
  Phone,
  ShieldCheck,
  RefreshCw,
  Edit3,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import type { CountryCode } from '../../types/registration'

interface VerifiedPhone {
  countryCode: CountryCode
  phoneNumber: string
}

interface PhoneEmailVerificationProps {
  value: VerifiedPhone | null
  onVerified: (phone: VerifiedPhone | null) => void
  accent?: 'green' | 'orange'
  error?: string
  initialCountryCode?: CountryCode
  initialPhoneNumber?: string
}

const COUNTRIES: { code: CountryCode; label: string; flag: string; digits: number }[] = [
  { code: '+91', label: 'India (+91)', flag: '🇮🇳', digits: 10 },
  { code: '+1', label: 'USA / Canada (+1)', flag: '🇺🇸', digits: 10 },
  { code: '+44', label: 'United Kingdom (+44)', flag: '🇬🇧', digits: 10 },
  { code: '+61', label: 'Australia (+61)', flag: '🇦🇺', digits: 9 },
  { code: '+971', label: 'UAE (+971)', flag: '🇦🇪', digits: 9 },
]

export const PhoneEmailVerification: React.FC<PhoneEmailVerificationProps> = ({
  value,
  onVerified,
  accent = 'green',
  error: validationError,
  initialCountryCode = '+91',
  initialPhoneNumber = '',
}) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(value?.countryCode || initialCountryCode || '+91')
  const [phoneDigits, setPhoneDigits] = useState(value?.phoneNumber || initialPhoneNumber || '')
  const [step, setStep] = useState<'input' | 'otp'>('input')
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [demoOtp, setDemoOtp] = useState<string>('123456')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [infoMsg, setInfoMsg] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const currentCountry = COUNTRIES.find((c) => c.code === selectedCountry) || COUNTRIES[0]
  const isGreen = accent === 'green'

  const primaryBtnClass = isGreen
    ? 'bg-[#1E824C] hover:bg-[#166B3D] text-white focus-visible:ring-[#1E824C]/30'
    : 'bg-[#F26522] hover:bg-[#D9531E] text-white focus-visible:ring-[#F26522]/30'

  const focusRingClass = isGreen
    ? 'focus-within:border-[#1E824C] focus-within:ring-1 focus-within:ring-[#1E824C]'
    : 'focus-within:border-[#F26522] focus-within:ring-1 focus-within:ring-[#F26522]'

  const otpInputFocusClass = isGreen
    ? 'focus:border-[#1E824C] focus:ring-2 focus:ring-[#1E824C]/20'
    : 'focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/20'

  const demoBoxClass = isGreen
    ? 'bg-[#E8F5E9] border-[#C8E6C9] text-[#1B5E20]'
    : 'bg-[#FFF7ED] border-[#FFEDD5] text-[#9A3412]'

  const demoIconClass = isGreen ? 'text-[#1E824C]' : 'text-[#F26522]'
  const linkTextClass = isGreen ? 'text-[#1E824C] hover:text-[#166B3D]' : 'text-[#F26522] hover:text-[#D9531E]'

  // Countdown for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Focus first digit box when moving to OTP step
  useEffect(() => {
    if (step === 'otp') {
      inputRefs.current[0]?.focus()
    }
  }, [step])

  // If already verified, show the verified badge card
  if (value) {
    return (
      <div className="rounded-xl border border-[#C8E6C9] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(41,53,47,0.04)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8F5E9] text-[#1E824C]">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#1E824C]">Mobile Number Verified</p>
              <p className="truncate text-sm font-bold tracking-wide text-[#29352F]">
                {value.countryCode} {value.phoneNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onVerified(null)
              setStep('input')
              setOtpDigits(['', '', '', '', '', ''])
              setErrorMsg(null)
              setInfoMsg(null)
            }}
            className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#1B5E20] hover:bg-[#E8F5E9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E824C]/30 cursor-pointer"
          >
            Change
          </button>
        </div>
      </div>
    )
  }

  // Handle sending OTP
  const handleSendOtp = async (isResend = false) => {
    const cleaned = phoneDigits.replace(/\D/g, '')
    if (cleaned.length < 5) {
      setErrorMsg(`Please enter a valid ${currentCountry.digits}-digit mobile number.`)
      return
    }

    setErrorMsg(null)
    setInfoMsg(null)
    setIsSending(true)

    try {
      const endpoint = isResend ? '/api/otp/resend' : '/api/otp/send'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryCode: selectedCountry,
          phoneNumber: cleaned,
        }),
      })

      const result = (await response.json()) as {
        success?: boolean
        demoOtp?: string
        message?: string
        error?: string
      }

      if (response.ok && result.success) {
        if (result.demoOtp) {
          setDemoOtp(result.demoOtp)
        }
        setInfoMsg(result.message || `Verification code sent to ${selectedCountry} ${cleaned}`)
        setStep('otp')
        setResendCooldown(30)
      } else {
        // Fallback for demo: even if backend route isn't reachable, allow testing code
        setDemoOtp('123456')
        setInfoMsg(`Demo verification code generated for ${selectedCountry} ${cleaned}`)
        setStep('otp')
        setResendCooldown(30)
      }
    } catch {
      // Offline / Network fallback
      setDemoOtp('123456')
      setInfoMsg(`Verification code ready for ${selectedCountry} ${cleaned}`)
      setStep('otp')
      setResendCooldown(30)
    } finally {
      setIsSending(false)
    }
  }

  // Handle digit inputs
  const handleDigitChange = (index: number, val: string) => {
    const num = val.replace(/\D/g, '').slice(-1)
    const newDigits = [...otpDigits]
    newDigits[index] = num
    setOtpDigits(newDigits)
    setErrorMsg(null)

    if (num && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length > 0) {
      const newDigits = [...otpDigits]
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || ''
      }
      setOtpDigits(newDigits)
      setErrorMsg(null)
      const nextFocus = Math.min(pasted.length, 5)
      inputRefs.current[nextFocus]?.focus()
    }
  }

  // Handle verifying OTP
  const handleVerifyOtp = async () => {
    const enteredCode = otpDigits.join('').trim()
    if (enteredCode.length < 6) {
      setErrorMsg('Please enter all 6 digits of your verification code.')
      return
    }

    setErrorMsg(null)
    setIsVerifying(true)

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryCode: selectedCountry,
          phoneNumber: phoneDigits.replace(/\D/g, ''),
          code: enteredCode,
        }),
      })

      const result = (await response.json()) as {
        success?: boolean
        status?: string
        error?: string
      }

      if ((response.ok && result.success) || enteredCode === '123456' || enteredCode === demoOtp) {
        onVerified({
          countryCode: selectedCountry,
          phoneNumber: phoneDigits.replace(/\D/g, ''),
        })
        setErrorMsg(null)
      } else {
        setErrorMsg(result.error || 'Invalid verification code. Please check and try again.')
      }
    } catch {
      // Local fallback for demo
      if (enteredCode === '123456' || enteredCode === demoOtp) {
        onVerified({
          countryCode: selectedCountry,
          phoneNumber: phoneDigits.replace(/\D/g, ''),
        })
        setErrorMsg(null)
      } else {
        setErrorMsg('Verification failed. Use demo code 123456 or try again.')
      }
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="rounded-xl border border-[#E6EAE7] bg-[#FDFEFC] p-4 shadow-sm space-y-3.5">
      {step === 'input' ? (
        <>
          <div className="flex items-center justify-between">
            <label htmlFor="phone-number-field" className="text-xs font-bold uppercase tracking-wider text-[#29352F]">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] font-medium text-[#6B756F]">Required for OTP Verification</span>
          </div>

          <div className={`flex rounded-xl border border-[#E6EAE7] bg-white transition-all overflow-hidden ${focusRingClass}`}>
            {/* Country Selector */}
            <div className="relative bg-[#F7F9F7] border-r border-[#E6EAE7] flex items-center px-2.5">
              <span className="text-sm mr-1.5" aria-hidden="true">
                {currentCountry.flag}
              </span>
              <select
                id="country-code-select"
                aria-label="Country Code"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value as CountryCode)}
                className="bg-transparent text-xs font-bold text-[#29352F] focus:outline-none cursor-pointer pr-1"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile Digits */}
            <input
              id="phone-number-field"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={phoneDigits}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\D/g, '').slice(0, currentCountry.digits)
                setPhoneDigits(cleaned)
                setErrorMsg(null)
              }}
              placeholder={`e.g. ${currentCountry.digits === 10 ? '9876543210' : '412345678'}`}
              className="w-full px-3.5 py-2.5 text-sm font-semibold tracking-wide text-[#29352F] placeholder-[#6B756F]/60 bg-white focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => handleSendOtp(false)}
            disabled={isSending}
            className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm transition-all focus:outline-none focus-visible:ring-4 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed ${primaryBtnClass}`}
          >
            {isSending ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                <span>Sending Verification Code…</span>
              </>
            ) : (
              <>
                <Phone className="h-4 w-4" />
                <span>Verify with Mobile Number</span>
                <ArrowRight className="h-4 w-4 ml-0.5" />
              </>
            )}
          </button>
        </>
      ) : (
        /* OTP Verification Step */
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6EAE7]">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#29352F]">Enter 6-Digit Code</p>
              <p className="text-xs text-[#6B756F]">
                Sent to <strong className="text-[#29352F] font-semibold">{selectedCountry} {phoneDigits}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep('input')
                setErrorMsg(null)
                setInfoMsg(null)
              }}
              className={`inline-flex items-center gap-1 text-xs font-semibold cursor-pointer ${linkTextClass}`}
            >
              <Edit3 className="w-3.5 h-3.5" /> Change
            </button>
          </div>

          {/* Quick Demo Helper */}
          <div className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${demoBoxClass}`}>
            <div className="flex items-center gap-1.5">
              <Sparkles className={`w-4 h-4 shrink-0 ${demoIconClass}`} />
              <span>Demo OTP: <strong className="font-mono font-bold tracking-wider">{demoOtp || '123456'}</strong></span>
            </div>
            <button
              type="button"
              onClick={() => {
                const code = (demoOtp || '123456').slice(0, 6)
                setOtpDigits(code.split(''))
                setErrorMsg(null)
              }}
              className={`font-bold underline cursor-pointer ${linkTextClass}`}
            >
              ⚡ Quick Fill
            </button>
          </div>

          {/* 6-Digit Inputs */}
          <div className="flex justify-between gap-1.5 py-1" onPaste={handlePaste}>
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={`w-11 h-12 text-center text-lg font-bold font-mono text-[#29352F] bg-white rounded-lg border border-[#CCD2CE] focus:outline-none transition-all shadow-xs ${otpInputFocusClass}`}
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            type="button"
            onClick={handleVerifyOtp}
            disabled={isVerifying}
            className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm transition-all focus:outline-none focus-visible:ring-4 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed ${primaryBtnClass}`}
          >
            {isVerifying ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                <span>Verifying Code…</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Verify & Confirm Number</span>
              </>
            )}
          </button>

          {/* Resend / Timer */}
          <div className="flex items-center justify-center text-xs text-[#6B756F]">
            {resendCooldown > 0 ? (
              <span>Resend code in <strong className="font-mono text-[#29352F]">{resendCooldown}s</strong></span>
            ) : (
              <button
                type="button"
                onClick={() => handleSendOtp(true)}
                disabled={isSending}
                className={`inline-flex items-center gap-1 font-semibold cursor-pointer ${linkTextClass}`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
                <span>Resend Code</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      {infoMsg && !errorMsg && <p className="text-xs text-[#1E824C] font-medium">{infoMsg}</p>}
      {(errorMsg || validationError) && (
        <p role="alert" className="text-xs font-semibold text-red-600">
          {errorMsg || validationError}
        </p>
      )}
    </div>
  )
}
