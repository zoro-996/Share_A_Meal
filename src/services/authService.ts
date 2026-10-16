import type { User } from '@supabase/supabase-js'
import type { DonorUserProfile, VolunteerUserProfile } from '../types/registration'
import type { FoodSourceType } from '../types/registration'
import { supabase } from './supabaseClient'

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

export async function getAuthenticatedProfile() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  const profile = await fetchOwnProfile(user)
  return toProfile(user, profile)
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

export async function loginUser(countryCode: string, phoneInput: string, password: string) {
  const phone = cleanPhone(countryCode, phoneInput)
  const passwordEmail = authEmailForPhone(phone)
  if (!password) throw new Error('Password is required.')
  const { data, error } = await supabase.auth.signInWithPassword({ email: passwordEmail, password })
  if (error || !data.user) throw new Error('Invalid phone number or password.')
  try {
    const authenticated = await getAuthenticatedProfile()
    if (!authenticated) throw new Error('Could not load your profile.')
    // A valid password is sufficient. Send the person to the portal stored in
    // their profile instead of rejecting them when they chose the other login
    // button on the landing page.
    return authenticated
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('Could not load your profile.')
  }
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}
