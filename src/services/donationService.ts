import type {
  Donation,
  CreateDonationPayload,
  DonationStatus,
  DonationNotification,
} from '../types/donation.ts'
import type {
  DonorUserProfile,
  VolunteerUserProfile,
} from '../types/registration.ts'
import { supabase } from './supabaseClient'

export type { DonorUserProfile, VolunteerUserProfile }

async function apiHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }
    : { 'Content-Type': 'application/json' }
}

const DEFAULT_DONOR_PROFILE: DonorUserProfile = {
  id: 'donor_tirupati_demo',
  name: 'Ramesh Verma',
  phone: '9876543210',
  donorType: 'restaurant',
  isVerified: true,
  collectionAddress: {
    addressLine1: '18, Gandhi Road, Near RTC Complex',
    areaLocality: 'Tirupati Central',
    city: 'Tirupati',
    state: 'Andhra Pradesh',
    pincode: '517501',
    landmark: 'Opposite APSRTC Bus Station',
    additionalDirections: 'Ground floor kitchen dispatch, Gandhi Road side.',
    latitude: 13.6288,
    longitude: 79.4192,
  },
}

const DEFAULT_VOLUNTEER_PROFILE: VolunteerUserProfile = {
  id: 'vol_tirupati_demo',
  name: 'Vikram Sharma',
  phone: '9845099887',
  vehicle: 'Hero Electric Two-Wheeler',
  role: 'individual',
}

// Active role session management
export function getActiveRole(): 'donor' | 'volunteer' | null {
  try {
    const role = localStorage.getItem('shareameal_active_role')
    if (role === 'donor' || role === 'volunteer') return role
  } catch {
    // ignore
  }
  return null
}

export function setActiveRole(role: 'donor' | 'volunteer' | null): void {
  try {
    if (role) {
      localStorage.setItem('shareameal_active_role', role)
    } else {
      localStorage.removeItem('shareameal_active_role')
    }
  } catch {
    // ignore
  }
}

export function clearCurrentSession(): void {
  setActiveRole(null)
  try {
    localStorage.removeItem('shareameal_donor_profile')
    localStorage.removeItem('shareameal_volunteer_profile')
  } catch {
    // ignore
  }
}

// Local Storage Session Helpers
export function getCurrentDonor(): DonorUserProfile {
  try {
    const raw = localStorage.getItem('shareameal_donor_profile')
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return DEFAULT_DONOR_PROFILE
}

export function saveCurrentDonor(profile: DonorUserProfile) {
  try {
    localStorage.setItem('shareameal_donor_profile', JSON.stringify(profile))
  } catch {
    // ignore
  }
}

export function getCurrentVolunteer(): VolunteerUserProfile {
  try {
    const raw = localStorage.getItem('shareameal_volunteer_profile')
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return DEFAULT_VOLUNTEER_PROFILE
}

export function saveCurrentVolunteer(profile: VolunteerUserProfile) {
  try {
    localStorage.setItem('shareameal_volunteer_profile', JSON.stringify(profile))
  } catch {
    // ignore
  }
}

// Profile API Methods with local cache sync
export async function fetchDonorProfile(id?: string): Promise<DonorUserProfile> {
  try {
    const res = await fetch(`/api/profile/donor?id=${encodeURIComponent(id || getCurrentDonor().id)}`, { headers: await apiHeaders() })
    if (res.ok) {
      const data = await res.json()
      if (data.profile) {
        saveCurrentDonor(data.profile)
        return data.profile
      }
    }
  } catch {
    // fallback to local
  }
  return getCurrentDonor()
}

export async function updateDonorProfile(profile: DonorUserProfile): Promise<DonorUserProfile> {
  saveCurrentDonor(profile)
  try {
    const res = await fetch('/api/profile/donor', {
      method: 'POST',
      headers: await apiHeaders(),
      body: JSON.stringify(profile),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.profile) {
        saveCurrentDonor(data.profile)
        return data.profile
      }
    }
  } catch {
    // ignore
  }
  return profile
}

export async function fetchVolunteerProfile(id?: string): Promise<VolunteerUserProfile> {
  try {
    const res = await fetch(`/api/profile/volunteer?id=${encodeURIComponent(id || getCurrentVolunteer().id)}`, { headers: await apiHeaders() })
    if (res.ok) {
      const data = await res.json()
      if (data.profile) {
        saveCurrentVolunteer(data.profile)
        return data.profile
      }
    }
  } catch {
    // fallback to local
  }
  return getCurrentVolunteer()
}

export async function updateVolunteerProfile(profile: VolunteerUserProfile): Promise<VolunteerUserProfile> {
  saveCurrentVolunteer(profile)
  try {
    const res = await fetch('/api/profile/volunteer', {
      method: 'POST',
      headers: await apiHeaders(),
      body: JSON.stringify(profile),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.profile) {
        saveCurrentVolunteer(data.profile)
        return data.profile
      }
    }
  } catch {
    // ignore
  }
  return profile
}

export async function sendVolunteerLocation(
  donationId: string,
  coordsOrVolunteerId: string | { latitude: number; longitude: number },
  optionalCoords?: { latitude: number; longitude: number }
): Promise<void> {
  let volunteerId: string
  let coords: { latitude: number; longitude: number }
  if (typeof coordsOrVolunteerId === 'string') {
    volunteerId = coordsOrVolunteerId
    coords = optionalCoords!
  } else {
    volunteerId = getCurrentVolunteer().id
    coords = coordsOrVolunteerId
  }
  const res = await fetch(`/api/donations/${encodeURIComponent(donationId)}/volunteer-location`, {
    method: 'POST',
    headers: await apiHeaders(),
    body: JSON.stringify({ volunteerId, coordinates: coords }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to transmit volunteer location.')
  }
}

// REST API calls
export async function fetchDonations(params?: {
  role?: 'donor' | 'volunteer' | 'admin'
  userId?: string
  status?: string
  locality?: string
}): Promise<Donation[]> {
  const query = new URLSearchParams()
  if (params?.role) query.set('role', params.role)
  if (params?.userId) query.set('userId', params.userId)
  if (params?.status) query.set('status', params.status)
  if (params?.locality) query.set('locality', params.locality)
  if (params?.role === 'donor') {
    const donor = getCurrentDonor()
    query.set('displayName', donor.name)
    query.set('displayPhone', donor.phone)
  } else if (params?.role === 'volunteer') {
    const volunteer = getCurrentVolunteer()
    query.set('displayName', volunteer.name)
    query.set('displayPhone', volunteer.phone)
  }

  const res = await fetch(`/api/donations?${query.toString()}`, { headers: await apiHeaders() })
  if (!res.ok) {
    throw new Error('Failed to fetch donations.')
  }
  const data = await res.json()
  return data.donations || []
}

export async function fetchDonationById(
  id: string,
  role?: 'donor' | 'volunteer' | 'admin',
  userId?: string
): Promise<Donation> {
  const query = new URLSearchParams()
  if (role) query.set('role', role)
  if (userId) query.set('userId', userId)
  if (role === 'donor') {
    const donor = getCurrentDonor()
    query.set('displayName', donor.name)
    query.set('displayPhone', donor.phone)
  } else if (role === 'volunteer') {
    const volunteer = getCurrentVolunteer()
    query.set('displayName', volunteer.name)
    query.set('displayPhone', volunteer.phone)
  }

  const res = await fetch(`/api/donations/${encodeURIComponent(id)}?${query.toString()}`, { headers: await apiHeaders() })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to fetch donation details.')
  }
  const data = await res.json()
  return data.donation
}

export async function createDonation(payload: CreateDonationPayload): Promise<Donation> {
  const res = await fetch('/api/donations/create', {
    method: 'POST',
    headers: await apiHeaders(),
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to create food donation.')
  }

  const data = await res.json()
  return data.donation
}

export async function claimDonation(
  donationId: string,
  volunteer: VolunteerUserProfile,
  pickupChecklistAccepted?: boolean[]
): Promise<Donation> {
  const res = await fetch(`/api/donations/${encodeURIComponent(donationId)}/claim`, {
    method: 'POST',
    headers: await apiHeaders(),
    body: JSON.stringify({
      volunteerId: volunteer.id,
      volunteerName: volunteer.name,
      volunteerPhone: volunteer.phone,
      volunteerVehicle: volunteer.vehicle,
      volunteerRole: volunteer.role,
      ngoName: volunteer.ngoName,
      pickupChecklistAccepted,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to claim donation.')
  }

  const data = await res.json()
  return data.donation
}

export async function updatePickupStatus(
  donationId: string,
  status: DonationStatus,
  volunteerId: string,
  options?: {
    note?: string
    coordinates?: { latitude: number; longitude: number }
    estimatedArrivalMinutes?: number
  }
): Promise<Donation> {
  const res = await fetch(`/api/donations/${encodeURIComponent(donationId)}/status`, {
    method: 'POST',
    headers: await apiHeaders(),
    body: JSON.stringify({
      status,
      volunteerId,
      ...options,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to update pickup status.')
  }

  const data = await res.json()
  return data.donation
}

export async function verifyHandoverOtp(
  donationId: string,
  code: string,
  volunteerId: string
): Promise<{ success: boolean; donation: Donation }> {
  const res = await fetch(`/api/donations/${encodeURIComponent(donationId)}/verify-handover`, {
    method: 'POST',
    headers: await apiHeaders(),
    body: JSON.stringify({
      code,
      volunteerId,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Invalid Handover OTP code.')
  }

  const data = await res.json()
  return data
}

export async function cancelDonation(
  donationId: string,
  donorId: string,
  reason?: string
): Promise<Donation> {
  const res = await fetch(`/api/donations/${encodeURIComponent(donationId)}/cancel`, {
    method: 'POST',
    headers: await apiHeaders(),
    body: JSON.stringify({ donorId, reason }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to cancel donation.')
  }

  const data = await res.json()
  return data.donation
}

export async function fetchNotifications(
  role?: 'donor' | 'volunteer',
  userId?: string
): Promise<DonationNotification[]> {
  const query = new URLSearchParams()
  if (role) query.set('role', role)
  if (userId) query.set('userId', userId)

  const res = await fetch(`/api/notifications?${query.toString()}`, { headers: await apiHeaders() })
  if (!res.ok) return []
  const data = await res.json()
  return data.notifications || []
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  const res = await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
    method: 'POST',
    headers: await apiHeaders(),
  })
  return res.ok
}
