export type CountryCode = '+91' | '+1' | '+44' | '+61' | '+971'

export type VolunteerRoleType = 'individual' | 'ngo_member'

export type IdentityDocumentType = 'aadhaar' | 'pan' | 'other_gov_id'

export type FoodSourceType = 'restaurant' | 'hotel' | 'home' | 'catering' | 'function_event' | 'other'

export interface UploadedDocument {
  file: File
  name: string
  size: number
  type: string
  uploadedAt: string
  uploadProgress: number
  status: 'uploading' | 'completed' | 'error'
  privateReferenceId: string
  error?: string
}

export interface VolunteerFormData {
  fullName: string
  countryCode: CountryCode
  phoneNumber: string
  roleType?: VolunteerRoleType
  ngoName?: string
  identityDocType?: IdentityDocumentType
  document?: UploadedDocument | null
  consentGiven?: boolean
}

export interface DonorCollectionAddress {
  addressLine1: string
  addressLine2?: string
  areaLocality: string
  city: string
  state: string
  pincode: string
  landmark?: string
  additionalDirections?: string
  latitude: number | null
  longitude: number | null
}

export interface ReverseGeocodeResult {
  addressLine1?: string
  areaLocality?: string
  city?: string
  state?: string
  pincode?: string
  landmark?: string
  latitude: number
  longitude: number
  rawDisplayName?: string
  unresolvedFields?: string[]
}

export interface OTPVerificationSession {
  verificationId: string
  phoneNumber: string
  countryCode: CountryCode
  status: 'pending' | 'approved' | 'failed'
  expiresAt: number
}

export interface OTPVerificationProof {
  verificationId: string
  phoneNumber: string
  verifiedAt: string
  verificationToken: string
}

export interface DonorFormData {
  fullName: string
  countryCode: CountryCode
  phoneNumber: string
  foodSourceType: FoodSourceType
  customFoodSource?: string
  address: DonorCollectionAddress
  identityDocType: IdentityDocumentType
  document: UploadedDocument | null
  consentGiven: boolean
}

export interface RegistrationRecord {
  id: string
  role: 'volunteer' | 'donor'
  fullName: string
  phoneNumber: string
  countryCode: CountryCode
  phoneVerified: boolean
  verificationProof?: OTPVerificationProof
  documentType?: IdentityDocumentType
  documentReference?: string
  documentStatus?: 'pending_review' | 'approved' | 'rejected'
  overallStatus: 'pending_verification' | 'active' | 'restricted'
  createdAt: string
  /** Flag indicating registration completed under temporary hackathon demo mode */
  demoMode?: boolean
  details: {
    volunteerRole?: VolunteerRoleType
    ngoName?: string
    ngoRegistrationNumber?: string
    foodSourceType?: FoodSourceType
    customFoodSource?: string
    collectionAddress?: DonorCollectionAddress
  }
}

export interface DonorUserProfile {
  id: string
  name: string
  phone: string
  donorType: FoodSourceType
  isVerified?: boolean
  collectionAddress: DonorCollectionAddress
}

export interface VolunteerUserProfile {
  id: string
  name: string
  phone: string
  vehicle: string
  role: VolunteerRoleType
  ngoName?: string
}
