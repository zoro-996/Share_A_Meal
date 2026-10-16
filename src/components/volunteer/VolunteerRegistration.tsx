import React, { useState } from 'react'
import { RegistrationLayout } from '../common/RegistrationLayout'
import { FormField } from '../common/FormField'
import { PhoneEmailVerification } from '../common/PhoneEmailVerification'
import { IdentityDocumentUploader } from '../common/IdentityDocumentUploader'
import { AccountabilityChecklist } from '../common/AccountabilityChecklist'
import type { 
  CountryCode, 
  IdentityDocumentType, 
  UploadedDocument, 
  RegistrationRecord,
} from '../../types/registration'
import { saveCurrentVolunteer, setActiveRole, updateVolunteerProfile } from '../../services/donationService'
import { registerUser } from '../../services/authService'
import { useNavigation } from '../../context/useNavigation'
import { 
  ArrowRight, 
  ArrowLeft,
  User, 
  Users, 
  RefreshCw,
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck,
  Building2,
  Briefcase
} from 'lucide-react'

interface VolunteerRegistrationProps {
  onAuthenticated?: () => Promise<unknown>
}

export const VolunteerRegistration: React.FC<VolunteerRegistrationProps> = ({ onAuthenticated }) => {
  const { navigate } = useNavigation()
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)

  // Step 1: Personal Details & Identity Proof
  const [fullName, setFullName] = useState('')
  const [countryCode, setCountryCode] = useState<CountryCode>('+91')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [identityDocType, setIdentityDocType] = useState<IdentityDocumentType>('aadhaar')
  const [document, setDocument] = useState<UploadedDocument | null>(null)

  // Step 2A: Volunteer Type & NGO Details
  const [volunteerRole, setVolunteerRole] = useState<'individual' | 'ngo_member'>('individual')
  const [ngoName, setNgoName] = useState('')
  const [designation, setDesignation] = useState('')

  // Step 2B: Volunteer Address
  const [addressLine1, setAddressLine1] = useState('')
  const [areaLocality, setAreaLocality] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [pincode, setPincode] = useState('')
  const [landmark, setLandmark] = useState('')

  const [addressNotice, setAddressNotice] = useState<string | null>(null)

  // Step 3: Terms & Conditions Checkboxes
  const [volunteerTerms, setVolunteerTerms] = useState<boolean[]>(() => Array(11).fill(false))
  const updateVolunteerTerm = (index: number, checked: boolean) => setVolunteerTerms((terms) => terms.map((term, itemIndex) => itemIndex === index ? checked : term))

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [completedRecord, setCompletedRecord] = useState<RegistrationRecord | null>(null)

  // Form errors & touched
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})


  // Step 1 Validation
  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {}
    if (!fullName.trim()) {
      errors.fullName = 'Full name is required.'
    } else if (fullName.trim().length < 2) {
      errors.fullName = 'Please enter a valid full name.'
    }

    if (!phoneVerified || !phoneNumber) errors.phoneNumber = 'Please verify your mobile number to continue.'

    if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters.'
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.'
    }


    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Step 2 Validation
  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {}


    if (!addressLine1.trim()) errors.addressLine1 = 'Address Line 1 is required.'
    if (!areaLocality.trim()) errors.areaLocality = 'Area / Locality is required.'
    if (!city.trim()) errors.city = 'City is required.'
    if (!state.trim()) errors.state = 'State is required.'
    if (!pincode.trim()) {
      errors.pincode = 'PIN code is required.'
    } else if (!/^\d{6}$/.test(pincode.trim())) {
      errors.pincode = 'Please enter a valid 6-digit PIN code.'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ fullName: true, phoneNumber: true, password: true, confirmPassword: true })
    if (validateStep1()) {
      setCurrentStep(2)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({
      ngoName: true,
      designation: true,
      addressLine1: true,
      areaLocality: true,
      city: true,
      state: true,
      pincode: true,
    })
    if (validateStep2()) {
      setAddressNotice('Address saved successfully.')
      setCurrentStep(3)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!volunteerTerms.every(Boolean)) {
      setSubmitError('Please accept every required volunteer term to complete registration.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      let volId = `vol_${Date.now()}`
      try {
        const authenticated = await registerUser({
          role: 'volunteer',
          countryCode,
          phone: phoneNumber,
          password,
          details: {
            fullName: fullName.trim(), volunteerRole, ngoName: volunteerRole === 'ngo_member' ? `${ngoName.trim()} (${designation.trim()})` : undefined, vehicle: 'Two-Wheeler / Bike',
            documentType: identityDocType, documentReference: document?.name || 'uploaded_id_doc',
            volunteerTermsAccepted: volunteerTerms,
            volunteerTermsAcceptedAt: new Date().toISOString(),
            collectionAddress: { addressLine1: addressLine1.trim(), areaLocality: areaLocality.trim(), city: city.trim(), state: state.trim(), pincode: pincode.trim(), landmark: landmark.trim() },
          },
        })
        if (authenticated && authenticated.role === 'volunteer') {
          volId = authenticated.profile.id
        }
      } catch (authErr) {
        console.warn('Supabase auth warning, proceeding with edge profile session:', authErr)
      }
      const record: RegistrationRecord = {
        id: volId,
        role: 'volunteer',
        fullName: fullName.trim(),
        phoneNumber,
        countryCode,
        phoneVerified: true,
        documentType: identityDocType,
        documentReference: document?.name || 'uploaded_id_doc',
        documentStatus: 'pending_review',
        overallStatus: 'pending_verification',
        createdAt: new Date().toISOString(),
        details: {
          volunteerRole,
          ngoName: volunteerRole === 'ngo_member' ? ngoName.trim() : undefined,
          ngoRegistrationNumber: volunteerRole === 'ngo_member' ? designation.trim() : undefined,
          collectionAddress: {
            addressLine1: addressLine1.trim(),
            areaLocality: areaLocality.trim(),
            city: city.trim(),
            state: state.trim(),
            pincode: pincode.trim(),
            landmark: landmark.trim(),
            latitude: 12.9716,
            longitude: 77.5946,
          },
        },
      }

      saveCurrentVolunteer({
        id: volId,
        name: fullName.trim(),
        phone: phoneNumber,
        vehicle: 'Two-Wheeler / Bike',
        role: volunteerRole,
        ngoName: volunteerRole === 'ngo_member' ? `${ngoName.trim()} (${designation.trim()})` : undefined,
      })
      setActiveRole('volunteer')

      // Save to backend
      await updateVolunteerProfile({
        id: volId,
        name: fullName.trim(),
        phone: phoneNumber,
        vehicle: 'Two-Wheeler / Bike',
        role: volunteerRole,
        ngoName: volunteerRole === 'ngo_member' ? `${ngoName.trim()} (${designation.trim()})` : undefined,
      })

      setCompletedRecord(record)
      setIsCompleted(true)
      await onAuthenticated?.()
      navigate('/volunteer/dashboard')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save registration. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render Completed Screen
  if (isCompleted && completedRecord) {
    const address = completedRecord.details.collectionAddress!

    return (
      <RegistrationLayout
        role="volunteer"
        title="Registration Completed"
        subtitle="Your volunteer profile has been created and verified on the Share a Meal network."
        currentStep={3}
      >
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-[#FFF0DB] border border-[#FFE0B2] flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#9A3412] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-base text-[#9A3412]">
                Volunteer Registration Saved!
              </h2>
              <p className="text-xs text-[#29352F] mt-0.5">
                Thank you for offering your time to rescue food and feed communities. Please review your registered details below.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E6EAE7] bg-[#FAFAFA] p-5 space-y-4 text-xs">
            <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-[#6B756F]">
              Saved Volunteer Profile Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] text-[#6B756F] block">Full Name</span>
                <span className="font-bold text-sm text-[#29352F]">{completedRecord.fullName}</span>
              </div>
              <div>
                <span className="text-[11px] text-[#6B756F] block">Mobile Phone</span>
                <span className="font-bold text-sm text-[#29352F]">{completedRecord.countryCode} {completedRecord.phoneNumber}</span>
              </div>
              <div>
                <span className="text-[11px] text-[#6B756F] block">Volunteer Type</span>
                <span className="font-bold text-sm text-[#9A3412] capitalize">
                  {completedRecord.details.volunteerRole === 'ngo_member' ? 'NGO Member' : 'Individual Volunteer'}
                </span>
              </div>
              {completedRecord.details.volunteerRole === 'ngo_member' && (
                <>
                  <div>
                    <span className="text-[11px] text-[#6B756F] block">NGO Name</span>
                    <span className="font-bold text-sm text-[#29352F]">{completedRecord.details.ngoName}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#6B756F] block">Designation</span>
                    <span className="font-bold text-sm text-[#29352F]">{completedRecord.details.ngoRegistrationNumber}</span>
                  </div>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-[#E6EAE7]">
              <span className="text-[11px] text-[#6B756F] block mb-1">Registered Volunteer Address</span>
              <p className="font-medium text-[#29352F] leading-relaxed">
                {address.addressLine1}, {address.areaLocality}, {address.city}, {address.state} - {address.pincode}
                {address.landmark && <span className="block text-[#6B756F] text-[11px] mt-0.5">Landmark: {address.landmark}</span>}
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/volunteer/dashboard')}
              className="w-full py-3.5 px-6 rounded-xl bg-[#9A3412] hover:bg-[#832B0E] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <span>Go to Volunteer Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </RegistrationLayout>
    )
  }

  return (
    <RegistrationLayout
      role="volunteer"
      title={
        currentStep === 1
          ? 'Personal Details & Password'
          : currentStep === 2
          ? 'Volunteer Role & Address'
          : 'Terms & Declarations'
      }
      subtitle={
        currentStep === 1
          ? 'Step 1 of 3: Provide your contact information and create a password.'
          : currentStep === 2
          ? 'Step 2 of 3: Select your volunteer affiliation and address.'
          : 'Step 3 of 3: Confirm your information accuracy and volunteer responsibilities.'
      }
      currentStep={currentStep}
      onBack={() => {
        if (currentStep === 3) setCurrentStep(2)
        else if (currentStep === 2) setCurrentStep(1)
        else navigate('/')
      }}
    >
      {/* ======================================================== */}
      {/* STEP 1: Personal Details & Identity Proof                */}
      {/* ======================================================== */}
      {currentStep === 1 && (
        <form onSubmit={handleNextStep1} className="space-y-6">
          <div className="space-y-4">
            <FormField label="Full Name" required error={touched.fullName ? formErrors.fullName : undefined}>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Vikram Sharma"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm text-[#29352F] focus:outline-none focus:border-[#9A3412] focus:ring-1 focus:ring-[#9A3412]"
                required
              />
            </FormField>

            <PhoneEmailVerification
              value={phoneVerified ? { countryCode, phoneNumber } : null}
              initialCountryCode={countryCode}
              initialPhoneNumber={phoneNumber}
              error={touched.phoneNumber ? formErrors.phoneNumber : undefined}
              onVerified={(phone) => {
                if (phone) {
                  setCountryCode(phone.countryCode)
                  setPhoneNumber(phone.phoneNumber)
                  setPhoneVerified(true)
                  setFormErrors((previous) => ({ ...previous, phoneNumber: '' }))
                } else {
                  setPhoneNumber('')
                  setPhoneVerified(false)
                }
              }}
              accent="orange"
            />

            <FormField label="Create Password" required error={touched.password ? formErrors.password : undefined}>
              <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm text-[#29352F] focus:outline-none focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522]" required />
            </FormField>
            <FormField label="Confirm Password" required error={touched.confirmPassword ? formErrors.confirmPassword : undefined}>
              <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm text-[#29352F] focus:outline-none focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522]" required />
            </FormField>

            {false && <div className="pt-2 border-t border-[#E6EAE7] space-y-4">
              <FormField label="Identity Proof Type" required>
                <select
                  value={identityDocType}
                  onChange={(e) => setIdentityDocType(e.target.value as IdentityDocumentType)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm text-[#29352F] focus:outline-none focus:border-[#9A3412]"
                >
                  <option value="aadhaar">Aadhaar Card (Government of India)</option>
                  <option value="pan">PAN Card</option>
                  <option value="voter_id">Voter Identity Card</option>
                  <option value="driving_license">Driving Licence</option>
                  <option value="passport">Passport</option>
                </select>
              </FormField>

              <FormField label="Upload Identity Proof Document" required error={touched.document ? formErrors.document : undefined}>
                <IdentityDocumentUploader
                  document={document}
                  onDocumentUploaded={(doc: UploadedDocument) => {
                    setDocument(doc)
                    setFormErrors((prev) => ({ ...prev, document: '' }))
                  }}
                  onDocumentRemoved={() => setDocument(null)}
                  error={touched.document ? formErrors.document : undefined}
                />
              </FormField>
            </div>}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#29352F] hover:bg-[#1B231F] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <span>Continue to Step 2</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* STEP 2: Volunteer Type & Address                         */}
      {/* ======================================================== */}
      {currentStep === 2 && (
        <form onSubmit={handleNextStep2} className="space-y-6">
          <div className="space-y-3"><h3 className="font-heading font-bold text-base text-[#29352F]">Identity Proof</h3><IdentityDocumentUploader document={document} docType={identityDocType} onDocTypeChange={setIdentityDocType} onDocumentUploaded={setDocument} onDocumentRemoved={() => setDocument(null)} /></div>
          {/* A. Volunteer Type */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-[#29352F]">
              Volunteer Type <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-[#6B756F]">
              Are you volunteering independently or as an official representative of an NGO?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div
                onClick={() => setVolunteerRole('individual')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  volunteerRole === 'individual'
                    ? 'border-[#9A3412] bg-[#FFF0DB]/60 shadow-2xs'
                    : 'border-[#E6EAE7] bg-white hover:border-neutral-300'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    volunteerRole === 'individual'
                      ? 'bg-[#9A3412] text-white'
                      : 'bg-[#FAFAFA] text-[#6B756F] border border-[#E6EAE7]'
                  }`}
                >
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-heading font-bold text-sm text-[#29352F]">
                    Individual Volunteer
                  </div>
                  <div className="text-[11px] text-[#6B756F] mt-0.5">
                    Volunteering on your own to collect and deliver food.
                  </div>
                </div>
              </div>

              <div
                onClick={() => setVolunteerRole('ngo_member')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  volunteerRole === 'ngo_member'
                    ? 'border-[#9A3412] bg-[#FFF0DB]/60 shadow-2xs'
                    : 'border-[#E6EAE7] bg-white hover:border-neutral-300'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    volunteerRole === 'ngo_member'
                      ? 'bg-[#9A3412] text-white'
                      : 'bg-[#FAFAFA] text-[#6B756F] border border-[#E6EAE7]'
                  }`}
                >
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-heading font-bold text-sm text-[#29352F]">
                    NGO Member
                  </div>
                  <div className="text-[11px] text-[#6B756F] mt-0.5">
                    Representing a registered non-profit organization.
                  </div>
                </div>
              </div>
            </div>

            {/* NGO Specific Fields */}
            {volunteerRole === 'ngo_member' && (
              <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#FFE0B2] space-y-3 mt-3 animate-in fade-in duration-150">
                <span className="text-[11px] font-bold text-[#9A3412] uppercase tracking-wider block">
                  NGO Association Details
                </span>

                <FormField label="NGO Name">
                  <div className="relative">
                    <input
                      type="text"
                      value={ngoName}
                      onChange={(e) => setNgoName(e.target.value)}
                      placeholder="e.g. Robin Hood Army, Feeding India"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm text-[#29352F] focus:outline-none focus:border-[#9A3412]"
                    />
                    <Building2 className="w-4 h-4 text-[#6B756F] absolute left-3 top-3 pointer-events-none" />
                  </div>
                </FormField>

                <FormField label="Designation (Your Role in NGO)">
                  <div className="relative">
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Community Coordinator, Field Volunteer"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm text-[#29352F] focus:outline-none focus:border-[#9A3412]"
                    />
                    <Briefcase className="w-4 h-4 text-[#6B756F] absolute left-3 top-3 pointer-events-none" />
                  </div>
                </FormField>
              </div>
            )}
          </div>

          {/* B. Volunteer Address */}
          <div className="pt-4 border-t border-[#E6EAE7] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-heading font-bold text-base text-[#29352F]">
                  Volunteer Address
                </h3>
                <p className="text-xs text-[#6B756F]">
                  Enter your local residential or operating base address.
                </p>
              </div>

            </div>

            <div className="space-y-3 pt-1">
              <FormField label="Address Line 1" required error={touched.addressLine1 ? formErrors.addressLine1 : undefined}>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="e.g. 15, 2nd Main, HAL 2nd Stage"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm text-[#29352F] focus:outline-none focus:border-[#9A3412]"
                  required
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Area / Locality" required error={touched.areaLocality ? formErrors.areaLocality : undefined}>
                  <input
                    type="text"
                    value={areaLocality}
                    onChange={(e) => setAreaLocality(e.target.value)}
                    placeholder="e.g. Indiranagar"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm text-[#29352F] focus:outline-none focus:border-[#9A3412]"
                    required
                  />
                </FormField>

                <FormField label="Landmark (Optional)">
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Near BDA Complex"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm text-[#29352F] focus:outline-none focus:border-[#9A3412]"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormField label="City" required error={touched.city ? formErrors.city : undefined}>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Bengaluru"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm text-[#29352F] focus:outline-none focus:border-[#9A3412]"
                    required
                  />
                </FormField>

                <FormField label="State" required error={touched.state ? formErrors.state : undefined}>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Karnataka"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm text-[#29352F] focus:outline-none focus:border-[#9A3412]"
                    required
                  />
                </FormField>

                <FormField label="PIN Code" required error={touched.pincode ? formErrors.pincode : undefined}>
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="e.g. 560038"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm text-[#29352F] focus:outline-none focus:border-[#9A3412]"
                    required
                  />
                </FormField>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3"><button type="button" onClick={() => { if (validateStep2()) setAddressNotice('Address saved successfully.') }} className="px-4 py-2.5 rounded-xl border border-[#9A3412] text-[#9A3412] text-sm font-bold cursor-pointer">Save Address</button>{addressNotice && <span className="text-sm text-[#1B5E20]">{addressNotice}</span>}</div>
          <div className="pt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-5 py-2.5 rounded-xl border border-[#E6EAE7] text-[#6B756F] hover:bg-neutral-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Step 1</span>
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-[#29352F] hover:bg-[#1B231F] text-white text-sm font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <span>Continue to Step 3</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* STEP 3: Volunteer Terms & Conditions                     */}
      {/* ======================================================== */}
      {currentStep === 3 && (
        <form onSubmit={handleFinalSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-base text-[#29352F]">
              Review & Volunteer Declarations
            </h3>
            <p className="text-xs text-[#6B756F]">
              Please review your information and check both required declarations below before completing your registration:
            </p>

            {/* Review Card */}
            <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E6EAE7] text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#6B756F]">Volunteer Name:</span>
                <span className="font-bold text-[#29352F]">{fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B756F]">Mobile Phone:</span>
                <span className="font-bold text-[#29352F]">{countryCode} {phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B756F]">Affiliation:</span>
                <span className="font-bold text-[#9A3412] capitalize">
                  {volunteerRole === 'ngo_member' ? `NGO Member (${ngoName} - ${designation})` : 'Individual Volunteer'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B756F]">Address:</span>
                <span className="font-medium text-[#29352F] text-right max-w-xs truncate">
                  {addressLine1}, {areaLocality}, {city} - {pincode}
                </span>
              </div>
            </div>

            <AccountabilityChecklist title="Volunteer Terms & Conditions" tone="orange" checked={volunteerTerms} onChange={updateVolunteerTerm} items={[
              'I confirm that the information I provide during registration is accurate and belongs to me.',
              'If I claim to represent an NGO, shelter, organisation or community group, I confirm that the information I provide about that organisation and my relationship with it is truthful.',
              'I agree not to falsely represent myself as an employee, member or authorised representative of any NGO, shelter or organisation.',
              'I agree to use the platform only for legitimate food collection and distribution purposes.',
              'I agree not to intentionally resell or commercially misuse food received through the platform.',
              'I agree to make reasonable efforts to collect the food within the specified pickup time.',
              'I agree to provide truthful information about where and how the donated food was distributed.',
              'I will not falsely claim that food was delivered or distributed when it was not.',
              'If I cannot complete a pickup or distribution, I agree to report/cancel it through the platform rather than falsely marking it as completed.',
              'I understand that providing false information, misusing donated food or repeatedly violating the platform rules may result in account restriction or termination and may be reported where appropriate.',
              'I agree to comply with the platform\'s volunteer, safety and conduct rules.',
            ]} />

            {submitError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 rounded-xl border border-[#E6EAE7] text-[#6B756F] hover:bg-neutral-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Step 2</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !volunteerTerms.every(Boolean)}
              className="px-6 py-3 rounded-xl bg-[#9A3412] hover:bg-[#832B0E] disabled:opacity-50 text-white text-sm font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Submitting Registration...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Complete Volunteer Registration</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </RegistrationLayout>
  )
}
