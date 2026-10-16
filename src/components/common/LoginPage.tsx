import React, { useState } from 'react'
import { ArrowLeft, Eye, EyeOff, LockKeyhole, LogIn, UserRound } from 'lucide-react'
import type { CountryCode } from '../../types/registration'
import type { AppRole } from '../../services/authService'
import { loginUser } from '../../services/authService'
import { PhoneNumberInput } from './PhoneNumberInput'
import { useNavigation } from '../../context/useNavigation'

interface LoginPageProps {
  role: AppRole
  onAuthenticated: () => Promise<void>
}

export const LoginPage: React.FC<LoginPageProps> = ({ role, onAuthenticated }) => {
  const { navigate } = useNavigation()
  const [countryCode, setCountryCode] = useState<CountryCode>('+91')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const roleTitle = role === 'donor' ? 'Donor Login' : 'Volunteer Login'

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!phone.trim() || !password) {
      setError('Enter your phone number and password.')
      return
    }
    setIsSubmitting(true)
    try {
      const authenticated = await loginUser(countryCode, phone, password)
      await onAuthenticated()
      navigate(authenticated.role === 'donor' ? '/donor/dashboard' : '/volunteer/dashboard')
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
          <div><h1 className="font-heading text-xl font-bold">{roleTitle}</h1><p className="text-sm text-[#6B756F]">Use your registered phone number and password.</p></div>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div><label className="block text-sm font-medium mb-1.5">Phone Number</label><PhoneNumberInput countryCode={countryCode} phoneNumber={phone} onCountryCodeChange={setCountryCode} onPhoneNumberChange={setPhone} /></div>
          <div><label htmlFor="login-password" className="block text-sm font-medium mb-1.5">Password</label><div className="relative"><LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B756F]" /><input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full pl-10 pr-11 py-2.5 text-sm rounded-xl border border-[#E6EAE7] focus:outline-none focus:border-[#1E824C]" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B756F] hover:text-[#29352F] cursor-pointer">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="w-full py-3 rounded-xl bg-[#29352F] hover:bg-[#1B231F] text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"><LogIn className="w-4 h-4" />{isSubmitting ? 'Logging in…' : 'Login'}</button>
        </form>
        <p className="mt-5 text-center text-sm text-[#6B756F]">New here? <button type="button" onClick={() => navigate(role === 'donor' ? '/register/donor' : '/register/volunteer')} className="font-medium text-[#1B5E20] hover:underline cursor-pointer">Register as a {role}</button></p>
      </section>
    </main>
  )
}
