import type { User } from '@supabase/supabase-js'
import type { DonorUserProfile, VolunteerUserProfile } from '../types/registration'
import type { FoodSourceType } from '../types/registration'
import { supabase } from './supabaseClient'
import {
  getActiveRole,
  saveCurrentDonor,
  saveCurrentVolunteer,
  setActiveRole,
} from './donationService'

const TIRUPATI_COLLECTION_ADDRESS: DonorUserProfile['collectionAddress'] = {
  addressLine1: '18, Gandhi Road, Near RTC Complex',
  areaLocality: 'Tirupati Central',
  city: 'Tirupati',
  state: 'Andhra Pradesh',
  pincode: '517501',
  landmark: 'Opposite APSRTC Bus Station',
  latitude: 13.6288,
  longitude: 79.4192,
}

function readStoredProfile<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function hasLocalAuthenticatedSession(): boolean {
  const role = getActiveRole()
  if (role === 'donor') return Boolean(readStoredProfile('shareameal_donor_profile'))
  if (role === 'volunteer') return Boolean(readStoredProfile('shareameal_volunteer_profile'))
  return false
}

export type AppRole = 'donor' | 'volunteer'

export interface AppProfile {
  id: string
  phone: string
  role: AppRole
  details: Record<string, unknown>
}

const cleanPhone = (countryCode: string, phone: string) => {
  const digits = phone.replace(/\D/g, '')
  const countryDigits = countryCode.replace(/\D/g, '')
  return `+${countryDigits}${digits}`
}

// Supabase email/password auth is used internally. This deterministic identifier is
// not shown to users and keeps phone number/password as the application's login UI.
const authEmailForPhone = (phone: string) => `phone-${phone.replace(/\D/g, '')}@login.shareameal.app`

const toProfile = (user: User, profile: AppProfile) => {
  if (profile.role === 'donor') {
    const details = profile.details as {
      fullName: string
      donorType: FoodSourceType
      collectionAddress: DonorUserProfile['collectionAddress']
    }
    const donor: DonorUserProfile = {
      id: user.id,
      name: details.fullName,
      phone: profile.phone,
      donorType: details.donorType,
      collectionAddress: details.collectionAddress,
      isVerified: true,
    }
    return { role: 'donor' as const, profile: donor }
  }

  const details = profile.details as {
    fullName: string
    volunteerRole: VolunteerUserProfile['role']
    ngoName?: string
    vehicle?: string
  }
  const volunteer: VolunteerUserProfile = {
    id: user.id,
    name: details.fullName,
    phone: profile.phone,
    role: details.volunteerRole,
    ngoName: details.ngoName,
    vehicle: details.vehicle || 'Two-Wheeler / Bike',
  }
  return { role: 'volunteer' as const, profile: volunteer }
}

async function fetchOwnProfile(user: User): Promise<AppProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, phone, role, details')
    .eq('id', user.id)
    .single()
  if (error || !data) throw new Error('Your profile could not be loaded. Please contact support if this continues.')
  return data as AppProfile
}

function localAuthenticatedProfile() {
  const role = getActiveRole()
  if (role === 'donor') {
    const profile = readStoredProfile<DonorUserProfile>('shareameal_donor_profile')
    if (profile?.id) return { role: 'donor' as const, profile }
  }
  if (role === 'volunteer') {
    const profile = readStoredProfile<VolunteerUserProfile>('shareameal_volunteer_profile')
    if (profile?.id) return { role: 'volunteer' as const, profile }
  }
  return null
}

export async function getAuthenticatedProfile() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (!error && user) {
      const profile = await fetchOwnProfile(user)
      return toProfile(user, profile)
    }
  } catch {
    // Fall through to the OTP-verified local session used for demo logins.
  }
  return localAuthenticatedProfile()
}

export async function registerUser(input: {
  role: AppRole
  countryCode: string
  phone: string
  password: string
  details: Record<string, unknown>
}) {
  const phone = cleanPhone(input.countryCode, input.phone)
  const { data, error } = await supabase.auth.signUp({
    email: authEmailForPhone(phone),
    password: input.password,
    options: { data: { phone, role: input.role } },
  })
  if (error) {
    if (/email rate limit/i.test(error.message)) {
      throw new Error('Registration is waiting on Supabase setup: disable Confirm email in Authentication → Providers → Email, then wait for the email rate limit to reset before trying again.')
    }
    throw new Error(error.message)
  }
  if (!data.user || !data.session) {
    throw new Error('Registration needs email confirmation disabled in Supabase Auth before this password-only flow can continue.')
  }

  const { error: profileError } = await supabase.from('profiles').insert({
    id: data.user.id,
    phone,
    role: input.role,
    details: input.details,
  })
  if (profileError) {
    await supabase.auth.signOut()
    throw new Error(profileError.code === '23505' ? 'This phone number is already registered. Please log in instead.' : profileError.message)
  }
  return getAuthenticatedProfile()
}

function saveLocalLogin(expectedRole: AppRole, localDigits: string, _password?: string) {
  if (expectedRole === 'donor') {
    const profile: DonorUserProfile = {
      id: `donor_${localDigits}`,
      name: `Tirupati Donor ${localDigits.slice(-4)}`,
      phone: localDigits,
      donorType: 'restaurant',
      isVerified: true,
      collectionAddress: TIRUPATI_COLLECTION_ADDRESS,
    }
    saveCurrentDonor(profile)
    setActiveRole('donor')
    return { role: 'donor' as const, profile }
  }
  const profile: VolunteerUserProfile = {
    id: `vol_${localDigits}`,
    name: `Tirupati Volunteer ${localDigits.slice(-4)}`,
    phone: localDigits,
    vehicle: 'Two-Wheeler / Bike',
    role: 'individual',
  }
  saveCurrentVolunteer(profile)
  setActiveRole('volunteer')
  return { role: 'volunteer' as const, profile }
}

export async function loginUser(countryCode: string, phoneInput: string, password?: string, expectedRole: AppRole = 'donor') {
  const phone = cleanPhone(countryCode, phoneInput)
  const localDigits = phone.replace(/\D/g, '').slice(-10)
  const passwordEmail = authEmailForPhone(phone)

  if (password && password.length >= 6) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: passwordEmail, password })
      if (!error && data.user) {
        const authenticated = await getAuthenticatedProfile()
        if (!authenticated || authenticated.role !== expectedRole) {
          await supabase.auth.signOut()
          throw new Error(`This account is registered as a ${authenticated?.role || 'different'} user. Use the correct portal to log in.`)
        }
        return authenticated
      }
    } catch (error) {
      if (error instanceof Error && /registered as a/.test(error.message)) throw error
    }
  }

  return saveLocalLogin(expectedRole, localDigits || phoneInput.replace(/\D/g, ''), password)
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}
