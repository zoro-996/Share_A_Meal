import React, { useState } from 'react'
import { RegistrationLayout } from '../common/RegistrationLayout'
import { FormField } from '../common/FormField'
import { PhoneNumberInput } from '../common/PhoneNumberInput'
import { OTPVerification } from '../common/OTPVerification'
import { RegistrationStatus } from '../common/RegistrationStatus'
import type { 
  CountryCode, 
  RegistrationRecord,
  OTPVerificationProof
} from '../../types/registration'
import { requestOTPSend, DEMO_SKIP_OTP } from '../../services/otpService'
import { saveCurrentVolunteer, setActiveRole } from '../../services/donationService'
import { ArrowRight, RefreshCw, AlertCircle } from 'lucide-react'

export const VolunteerRegistration: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)

  // Minimal Form State: Full Name & Phone Number
  const [fullName, setFullName] = useState('')
  const [countryCode, setCountryCode] = useState<CountryCode>('+91')
  const [phoneNumber, setPhoneNumber] = useState('')

  // Submission & SMS State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [verificationId, setVerificationId] = useState<string | undefined>()

  // Validation States
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Completed Record
  const [completedRecord, setCompletedRecord] = useState<RegistrationRecord | null>(null)

  // Validate only the two required fields
  const validate = (): boolean => {
    const errors: Record<string, string> = {}

    if (!fullName.trim()) {
      errors.fullName = 'Full name is required.'
    } else if (fullName.trim().length < 2) {
      errors.fullName = 'Please enter a valid full name (at least 2 characters).'
    }

    if (!phoneNumber) {
      errors.phoneNumber = 'Phone number is required.'
    } else if (countryCode === '+91' && phoneNumber.length !== 10) {
      errors.phoneNumber = 'Please enter a valid 10-digit mobile number.'
    } else if (phoneNumber.length < 8) {
      errors.phoneNumber = 'Please enter a valid mobile number.'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({
      fullName: true,
      phoneNumber: true,
    })

    if (!validate()) {
      return
    }

    // DEMO MODE: Bypass phone OTP screen and proceed directly to Status step
    if (DEMO_SKIP_OTP) {
      const record: RegistrationRecord = {
        id: `vol_${Date.now()}`,
        role: 'volunteer',
        fullName: fullName.trim(),
        phoneNumber,
        countryCode,
        phoneVerified: false, // Explicitly unverified in demo mode
        verificationProof: undefined, // No fake proof generated
        documentStatus: 'approved',
        overallStatus: 'active',
        demoMode: true,
        createdAt: new Date().toISOString(),
        details: {
          volunteerRole: 'individual',
        },
      }

      setCompletedRecord(record)
      saveCurrentVolunteer({
        id: record.id,
        name: fullName.trim(),
        phone: phoneNumber,
        vehicle: 'Two-Wheeler / Bike',
        role: 'individual',
      })
      setActiveRole('volunteer')
      setCurrentStep(3)
      return
    }

    // Normal Production Mode: Request cellular SMS verification
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await requestOTPSend(countryCode, phoneNumber)
      if (response.success) {
        setVerificationId(response.verificationId)
        setCurrentStep(2)
      } else {
        setSubmitError(
          response.error || 'Failed to initiate SMS verification. Please check the phone number.'
        )
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Network error requesting verification code.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOtpVerified = (proof: OTPVerificationProof) => {
    const record: RegistrationRecord = {
      id: `vol_${Date.now()}`,
      role: 'volunteer',
      fullName: fullName.trim(),
      phoneNumber,
      countryCode,
      phoneVerified: true,
      verificationProof: proof,
      documentStatus: 'approved',
      overallStatus: 'active',
      createdAt: new Date().toISOString(),
      details: {
        volunteerRole: 'individual',
      },
    }

    setCompletedRecord(record)
    saveCurrentVolunteer({
      id: record.id,
      name: fullName.trim(),
      phone: phoneNumber,
      vehicle: 'Two-Wheeler / Bike',
      role: 'individual',
    })
    setActiveRole('volunteer')
    setCurrentStep(3)
  }

  return (
    <RegistrationLayout
      role="volunteer"
      title={
        currentStep === 1
          ? 'Join as a Volunteer'
          : currentStep === 2
          ? 'Verify Your Phone Number'
          : 'Volunteer Registration Complete'
      }
      subtitle={
        currentStep === 1
          ? 'Sign up with your name and phone number to start collecting and sharing surplus food.'
          : currentStep === 2
          ? 'Enter the one-time password sent to your phone to complete verification.'
          : completedRecord?.phoneVerified
          ? 'Your phone number has been verified. Welcome to the volunteer team!'
          : 'Registration received. Phone verification pending in demo mode.'
      }
      currentStep={currentStep}
      onBack={currentStep === 2 ? () => setCurrentStep(1) : undefined}
    >
      {/* STEP 1: Minimal Registration Form */}
      {currentStep === 1 && (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Hackathon Demo Notice */}
          {DEMO_SKIP_OTP && (
            <div className="p-3 rounded-xl bg-[#FFF0DB]/80 border border-[#FFE0B2] text-xs text-[#9A3412] flex items-center gap-2">
              <span className="font-bold px-1.5 py-0.5 rounded-md bg-[#FFE0B2] text-[10px] uppercase tracking-wide shrink-0">Demo Mode</span>
              <span>Phone OTP verification is bypassed for demonstration.</span>
            </div>
          )}

          {/* Field 1: Full Name */}
          <FormField
            id="vol-name"
            label="Full Name"
            required
            error={touched.fullName ? formErrors.fullName : undefined}
          >
            <input
              id="vol-name"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value)
                if (touched.fullName) setFormErrors((prev) => ({ ...prev, fullName: '' }))
              }}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, fullName: true }))
                if (!fullName.trim()) setFormErrors((prev) => ({ ...prev, fullName: 'Full name is required.' }))
              }}
              placeholder="e.g. Priya Sharma"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm font-medium text-[#29352F] placeholder-[#6B756F]/60 focus:outline-none focus:border-[#29352F] focus:ring-2 focus:ring-[#29352F]/10"
            />
          </FormField>

          {/* Field 2: Mobile Phone Number */}
          <FormField
            id="vol-phone"
            label="Phone Number"
            required
            error={touched.phoneNumber ? formErrors.phoneNumber : undefined}
          >
            <PhoneNumberInput
              id="vol-phone"
              countryCode={countryCode}
              onCountryCodeChange={setCountryCode}
              phoneNumber={phoneNumber}
              onPhoneNumberChange={(val) => {
                setPhoneNumber(val)
                if (touched.phoneNumber) setFormErrors((prev) => ({ ...prev, phoneNumber: '' }))
              }}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, phoneNumber: true }))
                if (!phoneNumber) setFormErrors((prev) => ({ ...prev, phoneNumber: 'Phone number is required.' }))
              }}
              error={formErrors.phoneNumber}
              hasInteracted={touched.phoneNumber}
            />
          </FormField>

          {/* Error Banner if SMS Send Failed */}
          {submitError && (
            <div role="alert" className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="block font-semibold">Verification Error:</strong>
                <span>{submitError}</span>
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#29352F] hover:bg-[#1B231F] disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs group mt-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Requesting SMS Code...</span>
              </>
            ) : (
              <>
                <span>{DEMO_SKIP_OTP ? 'Continue' : 'Verify & Continue'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>
      )}

      {/* STEP 2: Phone OTP Verification */}
      {currentStep === 2 && (
        <OTPVerification
          countryCode={countryCode}
          phoneNumber={phoneNumber}
          verificationId={verificationId}
          onVerified={handleOtpVerified}
          onEditPhone={() => setCurrentStep(1)}
        />
      )}

      {/* STEP 3: Completed / Status Screen */}
      {currentStep === 3 && completedRecord && (
        <RegistrationStatus record={completedRecord} />
      )}
    </RegistrationLayout>
  )
}
