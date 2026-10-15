import React, { useState, useEffect, useRef } from 'react'
import { ShieldCheck, RefreshCw, AlertCircle, Edit3, KeyRound, AlertTriangle } from 'lucide-react'
import type { CountryCode, OTPVerificationProof } from '../../types/registration'
import { verifyOTPCode, requestOTPResend, getSMSProviderStatus, DEMO_SKIP_OTP } from '../../services/otpService'

interface OTPVerificationProps {
  countryCode: CountryCode
  phoneNumber: string
  verificationId?: string
  onVerified: (proof: OTPVerificationProof) => void
  onEditPhone: () => void
}

const RESEND_COOLDOWN_SECONDS = 30

export const OTPVerification: React.FC<OTPVerificationProps> = ({
  countryCode,
  phoneNumber,
  verificationId,
  onVerified,
  onEditPhone,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS)
  const [providerConfigured, setProviderConfigured] = useState<boolean | null>(null)
  const [missingConfigVars, setMissingConfigVars] = useState<string[]>([])

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Mask phone number: e.g. +91 ******1234
  const maskPhoneNumber = (code: string, num: string) => {
    if (num.length <= 4) return `${code} ${num}`
    const visibleLast = num.slice(-4)
    const maskedLength = num.length - 4
    return `${code} ${'*'.repeat(maskedLength)}${visibleLast}`
  }

  // Check SMS Provider configuration on mount
  useEffect(() => {
    let isMounted = true
    getSMSProviderStatus().then((status) => {
      if (isMounted) {
        setProviderConfigured(status.isConfigured)
        if (!status.isConfigured && status.missingVariables) {
          setMissingConfigVars(status.missingVariables)
        }
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  // Countdown timer for resend
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleDigitChange = (index: number, val: string) => {
    const num = val.replace(/\D/g, '').slice(-1)
    const newDigits = [...digits]
    newDigits[index] = num
    setDigits(newDigits)
    setError(null)
    setStatusMessage(null)

    if (num && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length > 0) {
      const newDigits = [...digits]
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || ''
      }
      setDigits(newDigits)
      setError(null)
      const nextFocus = Math.min(pasted.length, 5)
      inputRefs.current[nextFocus]?.focus()
    }
  }

  const handleVerify = async () => {
    const enteredOtp = digits.join('')
    if (enteredOtp.length < 6) {
      setError('Please enter all 6 digits of the SMS verification code.')
      return
    }

    setIsVerifying(true)
    setError(null)
    setStatusMessage(null)

    try {
      const result = await verifyOTPCode(countryCode, phoneNumber, enteredOtp, verificationId)

      if (result.success && result.status === 'approved' && result.verificationToken) {
        onVerified({
          verificationId: verificationId || 'verified_real',
          phoneNumber: `${countryCode}${phoneNumber}`,
          verifiedAt: new Date().toISOString(),
          verificationToken: result.verificationToken,
        })
      } else {
        setError(result.error || 'The entered verification code is invalid or has expired.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to the SMS verification service.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return

    setIsResending(true)
    setError(null)
    setStatusMessage(null)

    try {
      const result = await requestOTPResend(countryCode, phoneNumber)
      if (result.success) {
        setStatusMessage('A new verification code has been requested via SMS.')
        setCooldown(result.retryAfterSeconds || RESEND_COOLDOWN_SECONDS)
        setDigits(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      } else {
        setError(result.error || 'Failed to resend SMS code. Please try again later.')
        if (result.retryAfterSeconds) {
          setCooldown(result.retryAfterSeconds)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error requesting OTP resend.')
    } finally {
      setIsResending(false)
    }
  }

  const isComplete = digits.every((d) => d !== '')

  return (
    <div className="flex flex-col gap-6">
      {/* Phone number info banner */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAFAFA] border border-[#E6EAE7]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white border border-[#E6EAE7] flex items-center justify-center text-[#29352F]">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-[#6B756F] block">Verification target</span>
            <span className="text-sm font-bold text-[#29352F] tracking-wide">
              {maskPhoneNumber(countryCode, phoneNumber)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onEditPhone}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B5E20] hover:text-[#2E7D32] px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit Number</span>
        </button>
      </div>

      {/* Demo Mode Notice if rendered in Demo Mode */}
      {DEMO_SKIP_OTP && (
        <div
          role="note"
          className="p-3.5 rounded-xl bg-[#FFF0DB]/90 border border-[#FFE0B2] text-xs text-[#9A3412] flex items-start gap-2.5"
        >
          <span className="font-bold px-1.5 py-0.5 rounded-md bg-[#FFE0B2] text-[10px] uppercase tracking-wide shrink-0">Demo Mode</span>
          <div className="leading-relaxed">
            Phone OTP verification is bypassed for hackathon demonstrations.
          </div>
        </div>
      )}

      {/* Explicit Provider Configuration Warning if missing environment variables */}
      {providerConfigured === false && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block text-sm text-amber-950">SMS Provider Configuration Required</span>
            <p className="leading-relaxed text-amber-800">
              Real cellular SMS verification requires Twilio Verify credentials. The following server environment
              variables are currently missing:
            </p>
            <div className="font-mono text-[11px] bg-white/80 p-2 rounded border border-amber-200 text-amber-900">
              {missingConfigVars.join(' • ')}
            </div>
            <p className="text-[11px] text-amber-700">
              Please configure these in your <code className="bg-amber-100 px-1 rounded">.env</code> file or hosting secrets to enable real SMS delivery to Indian mobile numbers.
            </p>
          </div>
        </div>
      )}

      {/* Success / Status Banner */}
      {statusMessage && (
        <div className="p-3 rounded-xl bg-[#E8F5E9] border border-[#C8E6C9] text-xs text-[#1B5E20] font-medium flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* OTP Digits Input Box */}
      <div className="flex flex-col items-center gap-3">
        <label htmlFor="otp-digit-0" className="text-sm font-semibold text-[#29352F]">
          Enter 6-Digit SMS Verification Code
        </label>

        <div className="flex items-center gap-2 sm:gap-3" onPaste={handlePaste}>
          {digits.map((digit, idx) => (
            <input
              key={idx}
              id={`otp-digit-${idx}`}
              ref={(el) => {
                inputRefs.current[idx] = el
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              disabled={isVerifying}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="w-10 sm:w-12 h-12 sm:h-14 text-center text-lg sm:text-xl font-bold text-[#29352F] bg-white border border-[#E6EAE7] rounded-xl focus:border-[#29352F] focus:ring-2 focus:ring-[#29352F]/10 outline-none transition-all disabled:opacity-50"
            />
          ))}
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-1.5 text-xs text-red-600 font-medium text-center max-w-sm mt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Verify Button */}
      <button
        type="button"
        disabled={!isComplete || isVerifying}
        onClick={handleVerify}
        className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#29352F] hover:bg-[#1B231F] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
      >
        {isVerifying ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Verifying SMS Code with Provider...</span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4" />
            <span>Verify Phone Number</span>
          </>
        )}
      </button>

      {/* Resend Action */}
      <div className="text-center text-xs text-[#6B756F]">
        {cooldown > 0 ? (
          <span>
            Didn't receive the SMS code? Resend available in{' '}
            <strong className="font-semibold text-[#29352F]">{cooldown}s</strong>
          </span>
        ) : (
          <button
            type="button"
            disabled={isResending}
            onClick={handleResend}
            className="font-semibold text-[#1B5E20] hover:underline cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
          >
            {isResending && <RefreshCw className="w-3 h-3 animate-spin" />}
            <span>Resend SMS Code</span>
          </button>
        )}
      </div>
    </div>
  )
}
