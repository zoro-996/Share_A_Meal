import React, { useState } from 'react'
import { RegistrationLayout } from '../common/RegistrationLayout'
import { FormField } from '../common/FormField'
import { PhoneNumberInput } from '../common/PhoneNumberInput'
import { IdentityDocumentUploader } from '../common/IdentityDocumentUploader'
import { CollectionLocationMap } from './CollectionLocationMap'
import { OTPVerification } from '../common/OTPVerification'
import { RegistrationStatus } from '../common/RegistrationStatus'
import type { 
  CountryCode, 
  FoodSourceType, 
  IdentityDocumentType, 
  UploadedDocument, 
  RegistrationRecord,
  DonorCollectionAddress,
  OTPVerificationProof
} from '../../types/registration'
import { getDeviceCoordinates, reverseGeocodeCoordinates } from '../../services/geocodingService'
import { requestOTPSend, DEMO_SKIP_OTP } from '../../services/otpService'
import { saveCurrentDonor, setActiveRole } from '../../services/donationService'
import { 
  ArrowRight, 
  Utensils, 
  Home, 
  Calendar, 
  PlusCircle, 
  MapPin, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react'

export const DonorRegistration: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)

  // Form State: Basic details
  const [fullName, setFullName] = useState('')
  const [countryCode, setCountryCode] = useState<CountryCode>('+91')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [foodSourceType, setFoodSourceType] = useState<FoodSourceType>('restaurant')
  const [customFoodSource, setCustomFoodSource] = useState('')

  // Form State: Collection Address
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [areaLocality, setAreaLocality] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [pincode, setPincode] = useState('')
  const [landmark, setLandmark] = useState('')
  const [additionalDirections, setAdditionalDirections] = useState('')

  // Form State: Map Pin Coordinates
  const [latitude, setLatitude] = useState<number | null>(28.6139)
  const [longitude, setLongitude] = useState<number | null>(77.2090)

  // Form State: Identity Document & Consent
  const [identityDocType, setIdentityDocType] = useState<IdentityDocumentType>('aadhaar')
  const [document, setDocument] = useState<UploadedDocument | null>(null)
  const [consentGiven, setConsentGiven] = useState(false)

  // Location Autofill State
  const [isAutofillingLocation, setIsAutofillingLocation] = useState(false)
  const [locationNotice, setLocationNotice] = useState<{
    type: 'success' | 'warning' | 'error'
    message: string
  } | null>(null)

  // Submission & SMS State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [verificationId, setVerificationId] = useState<string | undefined>()

  // Validation States
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Completed Record
  const [completedRecord, setCompletedRecord] = useState<RegistrationRecord | null>(null)

  // Current-location action for Address Line 1
  const handleAutofillCurrentLocation = async () => {
    setIsAutofillingLocation(true)
    setLocationNotice(null)

    try {
      const coords = await getDeviceCoordinates()
      setLatitude(coords.latitude)
      setLongitude(coords.longitude)

      const result = await reverseGeocodeCoordinates(coords.latitude, coords.longitude)

      // Autofill fields without overwriting user data with empty strings
      if (result.addressLine1) {
        setAddressLine1(result.addressLine1)
        setFormErrors((prev) => ({ ...prev, addressLine1: '' }))
      }
      if (result.areaLocality) {
        setAreaLocality(result.areaLocality)
        setFormErrors((prev) => ({ ...prev, areaLocality: '' }))
      }
      if (result.city) {
        setCity(result.city)
        setFormErrors((prev) => ({ ...prev, city: '' }))
      }
      if (result.state) {
        setState(result.state)
        setFormErrors((prev) => ({ ...prev, state: '' }))
      }
      if (result.pincode) {
        setPincode(result.pincode)
        setFormErrors((prev) => ({ ...prev, pincode: '' }))
      }
      if (result.landmark) {
        setLandmark(result.landmark)
        setFormErrors((prev) => ({ ...prev, landmark: '' }))
      }

      // Clear coordinate error if any
      setFormErrors((prev) => ({ ...prev, coordinates: '' }))

      if (result.unresolvedFields && result.unresolvedFields.length > 0) {
        setLocationNotice({
          type: 'warning',
          message: `Address components autofilled from GPS. Please manually enter the missing required fields: ${result.unresolvedFields.join(
            ', '
          )}. (Address Line 2 is optional).`,
        })
      } else {
        setLocationNotice({
          type: 'success',
          message: 'Address autofilled from your current location. Please verify details before continuing.',
        })
      }
    } catch (err) {
      setLocationNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to determine current location. Please enter manually.',
      })
    } finally {
      setIsAutofillingLocation(false)
    }
  }

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
      errors.phoneNumber = 'Please enter a valid 10-digit Indian mobile number.'
    } else if (phoneNumber.length < 8) {
      errors.phoneNumber = 'Please enter a valid mobile number.'
    }

    if (foodSourceType === 'other' && !customFoodSource.trim()) {
      errors.customFoodSource = 'Please specify your food source description.'
    }

    // Address Validations
    if (!addressLine1.trim()) {
      errors.addressLine1 = 'Address Line 1 is required.'
    }
    if (!areaLocality.trim()) {
      errors.areaLocality = 'Area / Locality is required.'
    }
    if (!city.trim()) {
      errors.city = 'City is required.'
    }
    if (!state.trim()) {
      errors.state = 'State is required.'
    }
    if (!pincode.trim()) {
      errors.pincode = 'PIN Code is required.'
    } else if (!/^\d{6}$/.test(pincode.trim())) {
      errors.pincode = 'Please enter a valid 6-digit Indian PIN Code.'
    }
    if (!landmark.trim()) {
      errors.landmark = 'A prominent landmark is required for volunteer pickup guidance.'
    }

    if (latitude === null || longitude === null) {
      errors.coordinates = 'Please select a location pin on the map.'
    }

    if (!document || document.status !== 'completed') {
      errors.document = 'Please upload an accepted identity document to verify food donor ownership.'
    }

    if (!consentGiven) {
      errors.consent = 'You must review and agree to the privacy and food donation safety consent.'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const buildCollectionAddress = (): DonorCollectionAddress => ({
    addressLine1: addressLine1.trim(),
    addressLine2: addressLine2.trim() || undefined,
    areaLocality: areaLocality.trim(),
    city: city.trim(),
    state: state.trim(),
    pincode: pincode.trim(),
    landmark: landmark.trim(),
    additionalDirections: additionalDirections.trim() || undefined,
    latitude,
    longitude,
  })

  // Request real SMS verification before advancing to Step 2
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({
      fullName: true,
      phoneNumber: true,
      customFoodSource: true,
      addressLine1: true,
      areaLocality: true,
      city: true,
      state: true,
      pincode: true,
      landmark: true,
      document: true,
      consent: true,
    })

    if (!validate()) {
      return
    }

    // TEMPORARY HACKATHON DEMO MODE: Bypass phone OTP screen and proceed directly to Status step
    if (DEMO_SKIP_OTP) {
      const address = buildCollectionAddress()
      const record: RegistrationRecord = {
        id: `donor_${Date.now()}`,
        role: 'donor',
        fullName: fullName.trim(),
        phoneNumber,
        countryCode,
        phoneVerified: false, // Explicitly unverified in demo mode
        verificationProof: undefined, // No fake proof generated
        documentType: identityDocType,
        documentReference: document?.privateReferenceId || 'ref_pending',
        documentStatus: 'pending_review',
        overallStatus: 'pending_verification',
        demoMode: true,
        createdAt: new Date().toISOString(),
        details: {
          foodSourceType,
          customFoodSource: foodSourceType === 'other' ? customFoodSource.trim() : undefined,
          collectionAddress: address,
        },
      }

      setCompletedRecord(record)
      const donorData = {
        id: record.id,
        name: fullName.trim(),
        phone: phoneNumber,
        donorType: foodSourceType,
        collectionAddress: address,
      }
      saveCurrentDonor(donorData)
      setActiveRole('donor')
      setCurrentStep(3)
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await requestOTPSend(countryCode, phoneNumber)
      if (response.success) {
        setVerificationId(response.verificationId)
        setCurrentStep(2)
      } else {
        setSubmitError(
          response.error || 'Failed to initiate SMS verification. Please check the phone number or provider configuration.'
        )
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Network error requesting verification code.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOtpVerified = (proof: OTPVerificationProof) => {
    const address = buildCollectionAddress()

    const record: RegistrationRecord = {
      id: `donor_${Date.now()}`,
      role: 'donor',
      fullName: fullName.trim(),
      phoneNumber,
      countryCode,
      phoneVerified: true,
      verificationProof: proof,
      documentType: identityDocType,
      documentReference: document?.privateReferenceId || 'ref_pending',
      documentStatus: 'pending_review',
      overallStatus: 'pending_verification',
      createdAt: new Date().toISOString(),
      details: {
        foodSourceType,
        customFoodSource: foodSourceType === 'other' ? customFoodSource.trim() : undefined,
        collectionAddress: address,
      },
    }

    setCompletedRecord(record)
    const donorData = {
      id: record.id,
      name: fullName.trim(),
      phone: phoneNumber,
      donorType: foodSourceType,
      collectionAddress: address,
    }
    saveCurrentDonor(donorData)
    setActiveRole('donor')
    setCurrentStep(3)
  }

  return (
    <RegistrationLayout
      role="donor"
      title={
        currentStep === 1
          ? 'Register as a Food Donor'
          : currentStep === 2
          ? 'Verify Your Phone Number'
          : 'Food Donor Registration Received'
      }
      subtitle={
        currentStep === 1
          ? 'Tell us about your food source and where volunteers can collect surplus food.'
          : currentStep === 2
          ? 'Enter the one-time password sent to your phone to complete phone verification.'
          : completedRecord?.phoneVerified
          ? 'Your phone number has been verified and your collection hub is saved.'
          : 'Your food donor details and collection hub have been received for review (Demo Mode).'
      }
      currentStep={currentStep}
      onBack={currentStep === 2 ? () => setCurrentStep(1) : undefined}
    >
      {/* STEP 1: Registration Form */}
      {currentStep === 1 && (
        <form onSubmit={handleSubmit} noValidate className="space-y-7">
          {/* Hackathon Demo Notice */}
          {DEMO_SKIP_OTP && (
            <div className="p-3.5 rounded-xl bg-[#FFF0DB]/80 border border-[#FFE0B2] text-xs text-[#9A3412] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold px-1.5 py-0.5 rounded-md bg-[#FFE0B2] text-[10px] uppercase tracking-wide shrink-0">Demo Mode</span>
                <span>Phone OTP verification is bypassed for demonstration. Fill required details and ID to continue directly to Status.</span>
              </div>
            </div>
          )}
          {/* Section A: Donor Contact Information */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#6B756F]">
              1. Contact Information
            </h2>

            {/* Field 1: Full Name */}
            <FormField
              id="donor-name"
              label="Full Name"
              required
              error={touched.fullName ? formErrors.fullName : undefined}
            >
              <input
                id="donor-name"
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
                placeholder="e.g. Ramesh Verma"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm font-medium text-[#29352F] placeholder-[#6B756F]/60 focus:outline-none focus:border-[#29352F] focus:ring-2 focus:ring-[#29352F]/10"
              />
            </FormField>

            {/* Field 2: Phone Number */}
            <FormField
              id="donor-phone"
              label="Mobile Phone Number"
              required
              error={touched.phoneNumber ? formErrors.phoneNumber : undefined}
            >
              <PhoneNumberInput
                id="donor-phone"
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
          </div>

          {/* Section B: Food Source Type */}
          <div className="space-y-4 pt-4 border-t border-[#E6EAE7]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#6B756F]">
              2. Food Source
            </h2>

            <FormField
              id="food-source-type"
              label="Where Does the Food Come From?"
              required
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'restaurant', label: 'Restaurant', icon: Utensils },
                  { id: 'home', label: 'Home', icon: Home },
                  { id: 'function_event', label: 'Function / Event', icon: Calendar },
                  { id: 'other', label: 'Other', icon: PlusCircle },
                ].map((item) => {
                  const Icon = item.icon
                  const isSelected = foodSourceType === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFoodSourceType(item.id as FoodSourceType)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#29352F] bg-[#FAFAFA] ring-1 ring-[#29352F] font-bold text-[#29352F]'
                          : 'border-[#E6EAE7] bg-white hover:bg-neutral-50 text-[#6B756F]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-[#1B5E20]' : 'text-[#6B756F]'}`} />
                      <span className="text-xs">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </FormField>

            {/* Conditional Field: Other Food Source Description */}
            {foodSourceType === 'other' && (
              <div className="p-4 rounded-xl bg-[#FFF0DB]/40 border border-[#FFE0B2]">
                <FormField
                  id="custom-food-source"
                  label="Specify Your Food Source"
                  required
                  error={touched.customFoodSource ? formErrors.customFoodSource : undefined}
                >
                  <input
                    id="custom-food-source"
                    type="text"
                    value={customFoodSource}
                    onChange={(e) => {
                      setCustomFoodSource(e.target.value)
                      if (touched.customFoodSource) setFormErrors((prev) => ({ ...prev, customFoodSource: '' }))
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, customFoodSource: true }))
                      if (!customFoodSource.trim()) {
                        setFormErrors((prev) => ({ ...prev, customFoodSource: 'Please specify your food source description.' }))
                      }
                    }}
                    placeholder="Enter type of food facility"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm font-medium text-[#29352F] placeholder-[#6B756F]/60 focus:outline-none focus:border-[#29352F] focus:ring-2 focus:ring-[#29352F]/10"
                  />
                </FormField>
              </div>
            )}
          </div>

          {/* Section C: Food Collection Location */}
          <div className="space-y-4 pt-4 border-t border-[#E6EAE7]">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#6B756F]">
                3. Food Collection Location
              </h2>
            </div>

            {/* Location Autofill Banner Notice */}
            {locationNotice && (
              <div
                role="status"
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                  locationNotice.type === 'success'
                    ? 'bg-[#E8F5E9] border-[#C8E6C9] text-[#1B5E20]'
                    : locationNotice.type === 'warning'
                    ? 'bg-[#FFF0DB] border-[#FFE0B2] text-[#9A3412]'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                {locationNotice.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                {locationNotice.type === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
                {locationNotice.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <span className="leading-relaxed">{locationNotice.message}</span>
              </div>
            )}

            {/* Address Line 1 with "Use My Current Location" button */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="addr-line1" className="text-sm font-semibold text-[#29352F]">
                  Address Line 1 <span className="text-red-500">*</span>
                </label>
                {/* Clearly visible location-pin action button */}
                <button
                  type="button"
                  onClick={handleAutofillCurrentLocation}
                  disabled={isAutofillingLocation}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B5E20] hover:text-[#2E7D32] bg-[#E8F5E9] hover:bg-[#D8ECD9] px-2.5 py-1.5 rounded-lg border border-[#C8E6C9] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                  aria-label="Use My Current Location to autofill address"
                >
                  <MapPin className={`w-3.5 h-3.5 text-[#1B5E20] ${isAutofillingLocation ? 'animate-bounce' : ''}`} />
                  <span>{isAutofillingLocation ? 'Detecting Location...' : 'Use My Current Location'}</span>
                </button>
              </div>

              <input
                id="addr-line1"
                type="text"
                autoComplete="address-line1"
                value={addressLine1}
                onChange={(e) => {
                  setAddressLine1(e.target.value)
                  if (touched.addressLine1) setFormErrors((prev) => ({ ...prev, addressLine1: '' }))
                }}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, addressLine1: true }))
                  if (!addressLine1.trim()) setFormErrors((prev) => ({ ...prev, addressLine1: 'Address Line 1 is required.' }))
                }}
                placeholder="e.g. Flat 402, Greenfield Apartments or Shop 12, Main Market"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm font-medium text-[#29352F] placeholder-[#6B756F]/60 focus:outline-none focus:border-[#29352F] focus:ring-2 focus:ring-[#29352F]/10"
              />

              {touched.addressLine1 && formErrors.addressLine1 && (
                <div role="alert" className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{formErrors.addressLine1}</span>
                </div>
              )}
            </div>

            {/* Address Line 2 (Strictly Optional) */}
            <FormField
              id="addr-line2"
              label="Address Line 2 (Optional)"
            >
              <input
                id="addr-line2"
                type="text"
                autoComplete="address-line2"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder="e.g. Tower B, 4th Floor"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm font-medium text-[#29352F] placeholder-[#6B756F]/60 focus:outline-none focus:border-[#29352F] focus:ring-2 focus:ring-[#29352F]/10"
              />
            </FormField>

            {/* Area / Locality */}
            <FormField
              id="addr-area"
              label="Area / Locality"
              required
              error={touched.areaLocality ? formErrors.areaLocality : undefined}
            >
              <input
                id="addr-area"
                type="text"
                value={areaLocality}
                onChange={(e) => {
                  setAreaLocality(e.target.value)
                  if (touched.areaLocality) setFormErrors((prev) => ({ ...prev, areaLocality: '' }))
                }}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, areaLocality: true }))
                  if (!areaLocality.trim()) setFormErrors((prev) => ({ ...prev, areaLocality: 'Area / Locality is required.' }))
                }}
                placeholder="e.g. Indiranagar, Koramangala, Connaught Place"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm font-medium text-[#29352F] placeholder-[#6B756F]/60 focus:outline-none focus:border-[#29352F] focus:ring-2 focus:ring-[#29352F]/10"
              />
            </FormField>

            {/* City, State, PIN Code 3-column row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField
                id="addr-city"
                label="City"
                required
                error={touched.city ? formErrors.city : undefined}
              >
                <input
                  id="addr-city"
                  type="text"
                  autoComplete="address-level2"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value)
                    if (touched.city) setFormErrors((prev) => ({ ...prev, city: '' }))
                  }}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, city: true }))
                    if (!city.trim()) setFormErrors((prev) => ({ ...prev, city: 'City is required.' }))
                  }}
                  placeholder="e.g. Bengaluru"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm font-medium text-[#29352F] placeholder-[#6B756F]/60 focus:outline-none focus:border-[#29352F]"
                />
              </FormField>

              <FormField
                id="addr-state"
                label="State"
                required
                error={touched.state ? formErrors.state : undefined}
              >
                <input
                  id="addr-state"
                  type="text"
                  autoComplete="address-level1"
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value)
                    if (touched.state) setFormErrors((prev) => ({ ...prev, state: '' }))
                  }}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, state: true }))
                    if (!state.trim()) setFormErrors((prev) => ({ ...prev, state: 'State is required.' }))
                  }}
                  placeholder="e.g. Karnataka"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm font-medium text-[#29352F] placeholder-[#6B756F]/60 focus:outline-none focus:border-[#29352F]"
                />
              </FormField>

              <FormField
                id="addr-pincode"
                label="PIN Code"
                required
                error={touched.pincode ? formErrors.pincode : undefined}
              >
                <input
                  id="addr-pincode"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="postal-code"
                  value={pincode}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setPincode(cleaned)
                    if (touched.pincode) setFormErrors((prev) => ({ ...prev, pincode: '' }))
                  }}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, pincode: true }))
                    if (!/^\d{6}$/.test(pincode)) {
                      setFormErrors((prev) => ({ ...prev, pincode: 'Valid 6-digit PIN Code required.' }))
                    }
                  }}
                  placeholder="e.g. 560038"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm font-medium text-[#29352F] placeholder-[#6B756F]/60 focus:outline-none focus:border-[#29352F]"
                />
              </FormField>
            </div>

            {/* Landmark */}
            <FormField
              id="addr-landmark"
              label="Landmark"
              required
              error={touched.landmark ? formErrors.landmark : undefined}
            >
              <input
                id="addr-landmark"
                type="text"
                value={landmark}
                onChange={(e) => {
                  setLandmark(e.target.value)
                  if (touched.landmark) setFormErrors((prev) => ({ ...prev, landmark: '' }))
                }}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, landmark: true }))
                  if (!landmark.trim()) setFormErrors((prev) => ({ ...prev, landmark: 'Landmark is required.' }))
                }}
                placeholder="e.g. Opposite State Bank, Near Metro Pillar 140"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm font-medium text-[#29352F] placeholder-[#6B756F]/60 focus:outline-none focus:border-[#29352F] focus:ring-2 focus:ring-[#29352F]/10"
              />
            </FormField>

            {/* Additional Directions */}
            <FormField
              id="addr-directions"
              label="Additional Pickup Instructions"
            >
              <textarea
                id="addr-directions"
                rows={2}
                value={additionalDirections}
                onChange={(e) => setAdditionalDirections(e.target.value)}
                placeholder="Instructions for the collecting volunteer"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAE7] bg-white text-sm font-medium text-[#29352F] placeholder-[#6B756F]/60 focus:outline-none focus:border-[#29352F] focus:ring-2 focus:ring-[#29352F]/10"
              />
            </FormField>

            {/* Interactive Leaflet Map for Exact Location Pin */}
            <div className="pt-2">
              <CollectionLocationMap
                latitude={latitude}
                longitude={longitude}
                onLocationChange={(lat, lng) => {
                  setLatitude(lat)
                  setLongitude(lng)
                  if (formErrors.coordinates) setFormErrors((prev) => ({ ...prev, coordinates: '' }))
                }}
                onAutofillRequest={handleAutofillCurrentLocation}
                city={city}
                state={state}
              />
              {formErrors.coordinates && (
                <p role="alert" className="text-xs text-red-600 mt-1 font-medium">
                  {formErrors.coordinates}
                </p>
              )}
            </div>
          </div>

          {/* Section D: Identity Proof Document */}
          <div className="pt-4 border-t border-[#E6EAE7]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#6B756F] mb-3">
              4. Identity Verification
            </h2>

            <IdentityDocumentUploader
              id="donor-identity-upload"
              docType={identityDocType}
              onDocTypeChange={setIdentityDocType}
              document={document}
              onDocumentChange={(doc) => {
                setDocument(doc)
                if (touched.document) setFormErrors((prev) => ({ ...prev, document: '' }))
              }}
              error={touched.document ? formErrors.document : undefined}
            />
          </div>

          {/* Consent Checkbox */}
          <div className="pt-2 border-t border-[#E6EAE7]">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => {
                  setConsentGiven(e.target.checked)
                  if (touched.consent) setFormErrors((prev) => ({ ...prev, consent: '' }))
                }}
                className="mt-1 w-4 h-4 rounded text-[#2E7D32] border-[#E6EAE7] focus:ring-[#2E7D32] cursor-pointer"
              />
              <span className="text-xs text-[#6B756F] leading-relaxed select-none">
                I certify that the surplus food donated meets basic food safety and hygiene guidelines, and I consent to sharing the physical collection address with authorized volunteers to coordinate surplus food pickups.
              </span>
            </label>
            {touched.consent && formErrors.consent && (
              <p role="alert" className="text-xs text-red-600 mt-1 font-medium">
                {formErrors.consent}
              </p>
            )}
          </div>

          {/* Error Banner if SMS Send Failed */}
          {submitError && (
            <div role="alert" className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="block font-semibold">Verification Request Error:</strong>
                <span>{submitError}</span>
              </div>
            </div>
          )}

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#29352F] hover:bg-[#1B231F] disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs group"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Requesting SMS Verification Code...</span>
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

      {/* STEP 3: Completed / Status Summary */}
      {currentStep === 3 && completedRecord && (
        <RegistrationStatus record={completedRecord} />
      )}
    </RegistrationLayout>
  )
}
