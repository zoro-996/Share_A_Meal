import React, { useState } from 'react'
import { ArrowLeft, LockKeyhole, LogIn, UserRound, ShieldCheck } from 'lucide-react'
import type { CountryCode } from '../../types/registration'
import type { AppRole } from '../../services/authService'
import { loginUser } from '../../services/authService'
import { PhoneEmailVerification } from './PhoneEmailVerification'
import { useNavigation } from '../../context/useNavigation'

interface LoginPageProps {
  role: AppRole
  onAuthenticated: () => Promise<void>
}

export const LoginPage: React.FC<LoginPageProps> = ({ role, onAuthenticated }) => {
  const { navigate } = useNavigation()
  const [verifiedPhone, setVerifiedPhone] = useState<{ countryCode: CountryCode; phoneNumber: string } | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const roleTitle = role === 'donor' ? 'Donor Login' : 'Volunteer Login'
  const accent = role === 'donor' ? 'green' : 'orange'

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!verifiedPhone) {
      setError('Verify your mobile number with OTP before logging in.')
      return
    }
    setIsSubmitting(true)
    try {
      await loginUser(verifiedPhone.countryCode, verifiedPhone.phoneNumber, password.trim() || undefined, role)
      await onAuthenticated()
      navigate(role === 'donor' ? '/donor/dashboard' : '/volunteer/dashboard')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to log in.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-8 text-[#29352F]">
      <section className="w-full max-w-md bg-white rounded-2xl border border-[#E6EAE7] shadow-sm p-5 sm:p-7">
        <button type="button" onClick={() => navigate('/')} className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6B756F] hover:text-[#29352F] cursor-pointer">
          <ArrowLeft className="w-4 h-4" />Back to home
        </button>
        <div className="mt-5 flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${role === 'donor' ? 'bg-[#E8F5E9] text-[#1B5E20]' : 'bg-[#FFF0DB] text-[#9A3412]'}`}>
            <UserRound className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold">{roleTitle}</h1>
            <p className="text-sm text-[#6B756F]">Verify your mobile number with OTP to access your dashboard.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#29352F] mb-2">1. Mobile OTP verification</p>
            <PhoneEmailVerification
              value={verifiedPhone}
              onVerified={(phone) => {
                setVerifiedPhone(phone)
                setError(null)
              }}
              accent={accent}
            />
          </div>

          {verifiedPhone && (
            <>
              <div className="flex items-center gap-2 rounded-xl border border-[#C8E6C9] bg-[#E8F5E9] px-3.5 py-2.5 text-xs font-medium text-[#1B5E20]">
                <ShieldCheck className="w-4 h-4 shrink-0 text-[#1B5E20]" />
                <span>Mobile number verified ({verifiedPhone.countryCode} {verifiedPhone.phoneNumber}). Ready to enter dashboard.</span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="login-password" className="block text-sm font-medium">2. Password <span className="text-[#6B756F] text-xs font-normal">(Optional if verified with OTP)</span></label>
                </div>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B756F]" />
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter password or leave blank"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-[#E6EAE7] focus:outline-none focus:border-[#1E824C]"
                  />
                </div>
              </div>
              {error && <p role="alert" className="text-sm text-red-600 font-medium">{error}</p>}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 rounded-xl ${role === 'donor' ? 'bg-[#1E824C] hover:bg-[#166B3D]' : 'bg-[#F26522] hover:bg-[#D9531E]'} text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm`}
              >
                <LogIn className="w-4 h-4" />
                {isSubmitting ? 'Logging in…' : `Enter ${roleTitle}`}
              </button>
            </>
          )}
        </form>
        <p className="mt-5 text-center text-sm text-[#6B756F]">
          New here?{' '}
          <button
            type="button"
            onClick={() => navigate(role === 'donor' ? '/register/donor' : '/register/volunteer')}
            className="font-medium text-[#1B5E20] hover:underline cursor-pointer"
          >
            Register as a {role}
          </button>
        </p>
      </section>
    </main>
  )
}
