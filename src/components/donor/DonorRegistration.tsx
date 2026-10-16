import React, { useState } from 'react'
import { RegistrationLayout } from '../common/RegistrationLayout'
import { FormField } from '../common/FormField'
import { PhoneEmailVerification } from '../common/PhoneEmailVerification'
import { IdentityDocumentUploader } from '../common/IdentityDocumentUploader'
import { AccountabilityChecklist } from '../common/AccountabilityChecklist'
import type { 
  CountryCode, 
  FoodSourceType, 
  IdentityDocumentType, 
  UploadedDocument, 
  RegistrationRecord,
} from '../../types/registration'
import { saveCurrentDonor, setActiveRole, updateDonorProfile } from '../../services/donationService'
import { registerUser } from '../../services/authService'
import { useNavigation } from '../../context/useNavigation'
import { 
  ArrowRight, 
  ArrowLeft,
  Utensils, 
  Home, 
  Building2,
  Calendar, 
  Sparkles,
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  X,
  ShieldCheck,
  Building
} from 'lucide-react'

interface DonorRegistrationProps {
  onAuthenticated?: () => Promise<unknown>
}

export const DonorRegistration: React.FC<DonorRegistrationProps> = ({ onAuthenticated }) => {
  const { navigate } = useNavigation()
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)

  // Step 1: Personal Details & ID Proof
  const [fullName, setFullName] = useState('')
  const [countryCode, setCountryCode] = useState<CountryCode>('+91')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [identityDocType, setIdentityDocType] = useState<IdentityDocumentType>('aadhaar')
  const [document, setDocument] = useState<UploadedDocument | null>(null)

  // Step 2A: Food Source
  const [foodSourceType, setFoodSourceType] = useState<FoodSourceType>('restaurant')
  const [customFoodSource, setCustomFoodSource] = useState('')
  const [showOtherModal, setShowOtherModal] = useState(false)
  const [tempOtherText, setTempOtherText] = useState('')

  // Step 2B: Donor Address
  const [addressLine1, setAddressLine1] = useState('')
  const [areaLocality, setAreaLocality] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [pincode, setPincode] = useState('')
  const [landmark, setLandmark] = useState('')
  const [latitude] = useState<number | null>(null)
  const [longitude] = useState<number | null>(null)

  const [addressNotice, setAddressNotice] = useState<string | null>(null)

  // Step 3: Terms & Conditions Checkboxes
  const [donorTerms, setDonorTerms] = useState<boolean[]>(() => Array(7).fill(false))
  const updateDonorTerm = (index: number, checked: boolean) => setDonorTerms((terms) => terms.map((term, itemIndex) => itemIndex === index ? checked : term))

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [completedRecord, setCompletedRecord] = useState<RegistrationRecord | null>(null)

  // Validation States
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

    if (foodSourceType === 'other' && !customFoodSource.trim()) {
      errors.foodSource = 'Please specify your custom food source.'
    }

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
      addressLine1: true,
      areaLocality: true,
      city: true,
      state: true,
      pincode: true,
      foodSource: true,
    })
    if (validateStep2()) {
      setAddressNotice('Address saved successfully.')
      setCurrentStep(3)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!donorTerms.every(Boolean)) {
      setSubmitError('Please accept every required donor term to complete registration.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const authenticated = await registerUser({
        role: 'donor',
        countryCode,
        phone: phoneNumber,
        password,
        details: {
          fullName: fullName.trim(),
          donorType: foodSourceType,
          customFoodSource: foodSourceType === 'other' ? customFoodSource.trim() : undefined,
          documentType: identityDocType,
          documentReference: document?.privateReferenceId,
          donorTermsAccepted: donorTerms,
          donorTermsAcceptedAt: new Date().toISOString(),
          collectionAddress: {
            addressLine1: addressLine1.trim(), areaLocality: areaLocality.trim(), city: city.trim(), state: state.trim(), pincode: pincode.trim(), landmark: landmark.trim(), latitude: latitude || 12.9784, longitude: longitude || 77.6408,
          },
        },
      })
      if (!authenticated || authenticated.role !== 'donor') throw new Error('Your donor profile could not be created.')
      const donorRecordId = authenticated.profile.id
      const record: RegistrationRecord = {
        id: donorRecordId,
        role: 'donor',
        fullName: fullName.trim(),
        phoneNumber,
        countryCode,
        phoneVerified: true,
        documentType: identityDocType,
        documentReference: document?.privateReferenceId,
        documentStatus: document ? 'pending_review' : undefined,
        overallStatus: 'pending_verification',
        createdAt: new Date().toISOString(),
        details: {
          foodSourceType,
          customFoodSource: foodSourceType === 'other' ? customFoodSource.trim() : undefined,
          collectionAddress: {
            addressLine1: addressLine1.trim(),
            areaLocality: areaLocality.trim(),
            city: city.trim(),
            state: state.trim(),
            pincode: pincode.trim(),
            landmark: landmark.trim(),
            latitude: latitude || 12.9784,
            longitude: longitude || 77.6408,
          },
        },
      }

      // Persist to local session and backend API
      saveCurrentDonor({
        id: donorRecordId,
        name: fullName.trim(),
        phone: phoneNumber,
        donorType: foodSourceType,
        collectionAddress: {
          addressLine1: addressLine1.trim(),
          areaLocality: areaLocality.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          landmark: landmark.trim(),
          latitude: latitude || 12.9784,
          longitude: longitude || 77.6408,
        },
      })
      setActiveRole('donor')

      // Save to backend endpoint
      await updateDonorProfile({
        id: donorRecordId,
        name: fullName.trim(),
        phone: phoneNumber,
        donorType: foodSourceType,
        collectionAddress: {
          addressLine1: addressLine1.trim(),
          areaLocality: areaLocality.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          landmark: landmark.trim(),
          latitude: latitude || 12.9784,
          longitude: longitude || 77.6408,
        },
      })

      setCompletedRecord(record)
      setIsCompleted(true)
      await onAuthenticated?.()
      navigate('/donor/dashboard')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save registration. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // FOOD SOURCE OPTIONS
  const FOOD_SOURCES: Array<{ id: FoodSourceType; label: string; icon: React.ReactNode; desc: string }> = [
    { id: 'restaurant', label: 'Restaurant', icon: <Utensils className="w-5 h-5" />, desc: 'Eateries, cafes & commercial kitchens' },
    { id: 'hotel', label: 'Hotel', icon: <Building className="w-5 h-5" />, desc: 'Buffets, banquets & room service' },
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" />, desc: 'Home-cooked meals & household surplus' },
    { id: 'catering', label: 'Catering', icon: <Building2 className="w-5 h-5" />, desc: 'Corporate catering & party orders' },
    { id: 'function_event', label: 'Function / Event', icon: <Calendar className="w-5 h-5" />, desc: 'Weddings, conventions & large celebrations' },
    { id: 'other', label: 'Other', icon: <Sparkles className="w-5 h-5" />, desc: 'Community halls, bakeries or custom facilities' },
  ]

  // Render Completion Screen if finished
  if (isCompleted && completedRecord) {
    const address = completedRecord.details.collectionAddress!
    const sourceLabel = completedRecord.details.foodSourceType === 'other' && completedRecord.details.customFoodSource
      ? `Other (${completedRecord.details.customFoodSource})`
      : completedRecord.details.foodSourceType?.replace('_', ' ').toUpperCase()

    return (
      <RegistrationLayout
        role="donor"
        title="Registration Completed"
        subtitle="Your donor profile has been created and verified on the Share a Meal network."
        currentStep={3}
      >
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-[#E8F5E9] border border-[#C8E6C9] flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#1B5E20] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-base text-[#1B5E20]">
                Registration Successfully Saved!
              </h2>
              <p className="text-xs text-[#29352F] mt-0.5">
                Thank you for joining our mission to ensure no good food goes to waste. Please review your registered details below.
              </p>
            </div>
          </div>

          {/* Saved Summary Details */}
          <div className="rounded-2xl border border-[#E6EAE7] bg-[#FAFAFA] p-5 space-y-4 text-xs">
            <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-[#6B756F]">
              Saved Donor Profile Information
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
                <span className="text-[11px] text-[#6B756F] block">Food Source</span>
                <span className="font-bold text-sm text-[#1B5E20] capitalize">{sourceLabel}</span>
              </div>
              <div>
                <span className="text-[11px] text-[#6B756F] block">Identity Document</span>
                <span className="font-semibold text-xs text-[#29352F] capitalize">{completedRecord.documentType} ({completedRecord.documentReference})</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E6EAE7]">
              <span className="text-[11px] text-[#6B756F] block mb-1">Registered Donor Address</span>
              <p className="font-medium text-[#29352F] leading-relaxed">
                {address.addressLine1}, {address.areaLocality}, {address.city}, {address.state} - {address.pincode}
                {address.landmark && <span className="block text-[#6B756F] text-[11px] mt-0.5">Landmark: {address.landmark}</span>}
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/donor/dashboard')}
              className="w-full py-3.5 px-6 rounded-xl bg-[#1E824C] hover:bg-[#166B3D] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <span>Go to Donor Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </RegistrationLayout>
    )
  }

  return (
    <RegistrationLayout
      role="donor"
      title={
        currentStep === 1
          ? 'Personal Details & Password'
          : currentStep === 2
          ? 'Food Source & Donor Address'
          : 'Terms & Conditions'
      }
      subtitle={
        currentStep === 1
          ? 'Step 1 of 3: Provide your contact information and create a password.'
          : currentStep === 2
          ? 'Step 2 of 3: Select where surplus food originates and your collection address.'
          : 'Step 3 of 3: Confirm your information accuracy and accept the platform terms.'
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
                placeholder="e.g. Ramesh Verma"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm text-[#29352F] focus:outline-none focus:border-[#1E824C] focus:ring-1 focus:ring-[#1E824C]"
                required
              />
            </FormField>

            <PhoneEmailVerification
              value={phoneVerified ? { countryCode, phoneNumber } : null}
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
            />

            <FormField label="Create Password" required error={touched.password ? formErrors.password : undefined}>
              <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm text-[#29352F] focus:outline-none focus:border-[#1E824C] focus:ring-1 focus:ring-[#1E824C]" required />
            </FormField>
            <FormField label="Confirm Password" required error={touched.confirmPassword ? formErrors.confirmPassword : undefined}>
              <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm text-[#29352F] focus:outline-none focus:border-[#1E824C] focus:ring-1 focus:ring-[#1E824C]" required />
            </FormField>

            {false && <div className="pt-2 border-t border-[#E6EAE7] space-y-4">
              <FormField label="Identity Proof Type" required>
                <select
                  value={identityDocType}
                  onChange={(e) => setIdentityDocType(e.target.value as IdentityDocumentType)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm text-[#29352F] focus:outline-none focus:border-[#1E824C]"
                >
                  <option value="aadhaar">Aadhaar Card (Government of India)</option>
                  <option value="pan">PAN Card</option>
                  <option value="voter_id">Voter Identity Card</option>
                  <option value="driving_license">Driving Licence</option>
                  <option value="passport">Passport</option>
                  <option value="fssai_registration">FSSAI Food Business Registration</option>
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
      {/* STEP 2: Food Source & Donor Address                      */}
      {/* ======================================================== */}
      {currentStep === 2 && (
        <form onSubmit={handleNextStep2} className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-heading font-bold text-base text-[#29352F]">Identity Proof</h3>
            <IdentityDocumentUploader document={document} docType={identityDocType} onDocTypeChange={setIdentityDocType} onDocumentUploaded={setDocument} onDocumentRemoved={() => setDocument(null)} />
          </div>
          {/* A. Food Source Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-[#29352F]">
              Where Does the Food Come From? <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-[#6B756F]">
              Select the category that best describes your food establishment or household:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {FOOD_SOURCES.map((source) => {
                const isSelected = foodSourceType === source.id
                return (
                  <div
                    key={source.id}
                    onClick={() => {
                      setFoodSourceType(source.id)
                      if (source.id === 'other') {
                        setTempOtherText(customFoodSource)
                        setShowOtherModal(true)
                      }
                    }}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-[#1E824C] bg-[#E8F5E9]/60 shadow-2xs'
                        : 'border-[#E6EAE7] bg-white hover:border-neutral-300'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[#1E824C] text-white'
                          : 'bg-[#FAFAFA] text-[#6B756F] border border-[#E6EAE7]'
                      }`}
                    >
                      {source.icon}
                    </div>
                    <div>
                      <div className="font-heading font-bold text-sm text-[#29352F]">
                        {source.label}
                      </div>
                      <div className="text-[11px] text-[#6B756F] mt-0.5 leading-tight">
                        {source.desc}
                      </div>
                      {source.id === 'other' && customFoodSource && isSelected && (
                        <div className="mt-1 text-[11px] font-bold text-[#1E824C] bg-white px-2 py-0.5 rounded border border-[#C8E6C9] inline-block">
                          Specified: {customFoodSource}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            {formErrors.foodSource && (
              <p className="text-xs text-red-600 mt-1">{formErrors.foodSource}</p>
            )}
          </div>

          {/* B. Donor Address Section */}
          <div className="pt-4 border-t border-[#E6EAE7] space-y-4">
            <div>
              <div>
                <h3 className="font-heading font-bold text-base text-[#29352F]">
                  Donor Address
                </h3>
                <p className="text-xs text-[#6B756F]">
                  Enter your physical location where surplus food will be packaged for collection.
                </p>
              </div>

            </div>

            <div className="space-y-3 pt-1">
              <FormField label="Address Line 1" required error={touched.addressLine1 ? formErrors.addressLine1 : undefined}>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="e.g. 42, 100 Feet Road, Near Sony Signal"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm text-[#29352F] focus:outline-none focus:border-[#1E824C]"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm text-[#29352F] focus:outline-none focus:border-[#1E824C]"
                    required
                  />
                </FormField>

                <FormField label="Landmark (Optional)">
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Opposite Metro Pillar 140"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm text-[#29352F] focus:outline-none focus:border-[#1E824C]"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm text-[#29352F] focus:outline-none focus:border-[#1E824C]"
                    required
                  />
                </FormField>

                <FormField label="State" required error={touched.state ? formErrors.state : undefined}>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Karnataka"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm text-[#29352F] focus:outline-none focus:border-[#1E824C]"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm text-[#29352F] focus:outline-none focus:border-[#1E824C]"
                    required
                  />
                </FormField>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3"><button type="button" onClick={() => { if (validateStep2()) setAddressNotice('Address saved successfully.') }} className="px-4 py-2.5 rounded-xl border border-[#1E824C] text-[#1B5E20] text-sm font-bold cursor-pointer">Save Address</button>{addressNotice && <span className="text-sm text-[#1B5E20]">{addressNotice}</span>}</div>
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
      {/* STEP 3: Donor Terms and Conditions                       */}
      {/* ======================================================== */}
      {currentStep === 3 && (
        <form onSubmit={handleFinalSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-base text-[#29352F]">
              Review & Donor Declarations
            </h3>
            <p className="text-xs text-[#6B756F]">
              Please review your information and check both required declarations below before completing your registration:
            </p>

            {/* Compact review summary */}
            <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E6EAE7] text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#6B756F]">Donor Name:</span>
                <span className="font-bold text-[#29352F]">{fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B756F]">Contact Phone:</span>
                <span className="font-bold text-[#29352F]">{countryCode} {phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B756F]">Food Source:</span>
                <span className="font-bold text-[#1E824C] capitalize">
                  {foodSourceType === 'other' ? `Other (${customFoodSource})` : foodSourceType.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B756F]">Address:</span>
                <span className="font-medium text-[#29352F] text-right max-w-xs truncate">
                  {addressLine1}, {areaLocality}, {city} - {pincode}
                </span>
              </div>
            </div>

            <AccountabilityChecklist title="Donor Terms & Conditions" checked={donorTerms} onChange={updateDonorTerm} items={[
              'I confirm that the information I provide during registration is accurate and belongs to me.',
              'I confirm that I will only donate food that I believe to be suitable for human consumption and that I will not knowingly donate spoiled, contaminated, adulterated or unsafe food.',
              'I agree to provide accurate information about the food, including its type, quantity, preparation time, storage/handling conditions and known allergens whenever requested.',
              'I will not intentionally hide any known food-safety issue or information that could reasonably affect the recipient\'s decision to accept the food.',
              'I understand that the platform facilitates food sharing and does not independently certify every food donation as safe.',
              'I understand that knowingly providing false information or knowingly donating unsafe food may result in my account being restricted or terminated and may be reported where appropriate.',
              'I agree to comply with the platform\'s food-safety, donation and conduct rules.',
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
              disabled={isSubmitting || !donorTerms.every(Boolean)}
              className="px-6 py-3 rounded-xl bg-[#1E824C] hover:bg-[#166B3D] disabled:opacity-50 text-white text-sm font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Submitting Registration...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Complete Donor Registration</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* POPUP MODAL FOR "OTHER" FOOD SOURCE SPECIFICATION */}
      {showOtherModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-2xs flex items-center justify-center p-4"
          onClick={() => setShowOtherModal(false)}
        >
          <div
            className="bg-white rounded-2xl border border-[#E6EAE7] shadow-xl p-6 max-w-sm w-full space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm text-[#29352F]">
                Please specify your food source.
              </h3>
              <button
                type="button"
                onClick={() => setShowOtherModal(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <input
                type="text"
                value={tempOtherText}
                onChange={(e) => setTempOtherText(e.target.value)}
                placeholder="Enter your food source"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] text-sm text-[#29352F] focus:outline-none focus:border-[#1E824C]"
                autoFocus
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowOtherModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#6B756F] hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (tempOtherText.trim()) {
                    setCustomFoodSource(tempOtherText.trim())
                    setShowOtherModal(false)
                    setFormErrors((prev) => ({ ...prev, foodSource: '' }))
                  }
                }}
                disabled={!tempOtherText.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1E824C] hover:bg-[#166B3D] disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </RegistrationLayout>
  )
}
