/**
 * Cloudflare Pages Function — catch-all for all /api/* routes NOT handled by
 * the specific functions/api/otp/* and functions/api/geocode/* files.
 *
 * Handles:
 *   GET  /api/donations
 *   POST /api/donations/create
 *   GET  /api/donations/:id
 *   POST /api/donations/:id/claim
 *   POST /api/donations/:id/status
 *   POST /api/donations/:id/verify-handover
 *   POST /api/donations/:id/cancel
 *   POST /api/donations/:id/volunteer-location
 *   GET  /api/profile/donor
 *   POST /api/profile/donor
 *   GET  /api/profile/volunteer
 *   POST /api/profile/volunteer
 *   GET  /api/notifications
 *   POST /api/notifications/:id/read
 *   GET  /api/otp/status
 *
 * Data is held in a module-level singleton (in-memory, per Cloudflare worker
 * instance). Seed data is always available on first load. This is appropriate
 * for a hackathon/demo — all state resets when Cloudflare redeploys or cold-starts.
 */

// ─── TYPE DEFINITIONS ────────────────────────────────────────────────────────

interface FoodItem {
  id: string
  name: string
  quantity: number
  unit: string
  foodType: 'veg' | 'non-veg' | 'vegan'
  shelfLifeHours?: number
  safeUntil?: string
  photo?: string
}

type DonationStatus =
  | 'available'
  | 'claimed'
  | 'en_route_pickup'
  | 'arrived_pickup'
  | 'collected'
  | 'completed'
  | 'cancelled'
  | 'en_route'

interface CollectionAddress {
  addressLine1: string
  addressLine2?: string
  areaLocality: string
  city: string
  state: string
  pincode: string
  landmark?: string
  additionalDirections?: string
  latitude?: number | null
  longitude?: number | null
}

interface PickupSchedule {
  readyType: 'immediate' | 'scheduled'
  readyTime?: string
  deadlineTime: string
  pickupInstructions?: string
}

interface DonationClaim {
  claimedAt: string
  volunteerId: string
  volunteerName: string
  volunteerPhone: string
  volunteerVehicle?: string
  volunteerRole?: 'individual' | 'ngo_member'
  ngoName?: string
  currentStatus: DonationStatus
  statusHistory: Array<{
    status: DonationStatus
    timestamp: string
    note?: string
    updatedBy?: string
  }>
  volunteerCoordinates?: {
    latitude: number
    longitude: number
    updatedAt: string
  }
  estimatedArrivalMinutes?: number
  isBroadcastingGps?: boolean
}

interface Donation {
  id: string
  donorId: string
  donorName: string
  donorPhone: string
  donorType: string
  customFoodSource?: string
  items: FoodItem[]
  totalQuantityLabel: string
  estimatedPeopleServed: number
  foodPreparationTime: string
  foodCategory?: 'prepared_meals' | 'bakery_bread_items' | 'fruits' | 'vegetables' | 'groceries' | 'other'
  foodCategories?: Array<'prepared_meals' | 'bakery_bread_items' | 'fruits' | 'vegetables' | 'groceries' | 'other'>
  customFoodCategory?: string
  foodShelfLifeCategory: string
  earliestSafeUntil: string
  pickupSchedule: PickupSchedule
  collectionAddress: CollectionAddress
  photos: string[]
  status: DonationStatus
  createdAt: string
  handoverOtp: string
  handoverVerifiedAt?: string
  cancellationReason?: string
  claim?: DonationClaim
}

interface DonationNotification {
  id: string
  recipientRole: 'donor' | 'volunteer' | 'all'
  recipientId?: string
  donationId?: string
  title: string
  message: string
  type: string
  createdAt: string
  read: boolean
  handoverOtp?: string
}

interface DonorProfile {
  id: string
  name: string
  phone: string
  donorType: string
  collectionAddress: CollectionAddress
}

interface VolunteerProfile {
  id: string
  name: string
  phone: string
  vehicle?: string
  role?: 'individual' | 'ngo_member'
  ngoName?: string
}

interface AuthenticatedActor {
  id: string
  role: 'donor' | 'volunteer'
}

async function requireActor(context: EventContext<unknown, string, Record<string, unknown>>): Promise<AuthenticatedActor | null> {
  const authorization = context.request.headers.get('Authorization')
  const supabaseUrl = context.env.VITE_SUPABASE_URL as string | undefined
  const publishableKey = context.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
  if (!authorization?.startsWith('Bearer ') || !supabaseUrl || !publishableKey) return null
  const headers = { apikey: publishableKey, Authorization: authorization }
  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, { headers })
  if (!userResponse.ok) return null
  const user = await userResponse.json() as { id?: string }
  if (!user.id) return null
  const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?select=role&id=eq.${encodeURIComponent(user.id)}`, { headers })
  if (!profileResponse.ok) return null
  const profiles = await profileResponse.json() as Array<{ role?: string }>
  const role = profiles[0]?.role
  return role === 'donor' || role === 'volunteer' ? { id: user.id, role } : null
}

// ─── SEED DATA ───────────────────────────────────────────────────────────────

const SEED_DONATION_IDS = new Set(['don_seed_available', 'don_seed_enroute', 'don_seed_completed'])
const TIRUPATI = { lat: 13.6288, lng: 79.4192 }

function makeSeedDonations(): Donation[] {
  const now = Date.now()
  return [
    {
      id: 'don_seed_available',
      donorId: 'donor_tirupati_demo',
      donorName: 'Ramesh Verma (Sri Venkateswara Kitchen)',
      donorPhone: '9876543210',
      donorType: 'restaurant',
      items: [
        {
          id: 'item_1',
          name: 'Tirupati Veg Meals with Sambar',
          quantity: 14,
          unit: 'kg',
          foodType: 'veg',
          shelfLifeHours: 5,
          safeUntil: new Date(now + 4 * 3600_000).toISOString(),
        },
        {
          id: 'item_2',
          name: 'Steamed Idli & Chutney',
          quantity: 50,
          unit: 'portions',
          foodType: 'veg',
          shelfLifeHours: 5,
          safeUntil: new Date(now + 4 * 3600_000).toISOString(),
        },
      ],
      totalQuantityLabel: '14 kg meals, 50 idlis',
      estimatedPeopleServed: 40,
      foodPreparationTime: new Date(now - 2 * 3600_000).toISOString(),
      foodShelfLifeCategory: 'cooked_meals',
      earliestSafeUntil: new Date(now + 4 * 3600_000).toISOString(),
      pickupSchedule: {
        readyType: 'immediate',
        readyTime: new Date(now - 20 * 60_000).toISOString(),
        deadlineTime: new Date(now + 3 * 3600_000).toISOString(),
        pickupInstructions: 'Ask at the billing desk for surplus packed trays.',
      },
      collectionAddress: {
        addressLine1: '18, Gandhi Road, Near RTC Complex',
        areaLocality: 'Tirupati Central',
        city: 'Tirupati',
        state: 'Andhra Pradesh',
        pincode: '517501',
        landmark: 'Opposite APSRTC Bus Station',
        additionalDirections: 'Ground floor kitchen dispatch, Gandhi Road side.',
        latitude: TIRUPATI.lat,
        longitude: TIRUPATI.lng,
      },
      photos: [],
      status: 'available',
      createdAt: new Date(now - 3600_000).toISOString(),
      handoverOtp: '482915',
    },
    {
      id: 'don_seed_enroute',
      donorId: 'donor_tirupati_demo',
      donorName: 'Priya Nambiar (Alipiri Annapoorna)',
      donorPhone: '9880054321',
      donorType: 'restaurant',
      items: [
        {
          id: 'item_3',
          name: 'Pulihora & Curd Rice Packs',
          quantity: 20,
          unit: 'kg',
          foodType: 'veg',
          shelfLifeHours: 5,
          safeUntil: new Date(now + 3 * 3600_000).toISOString(),
        },
      ],
      totalQuantityLabel: '20 kg rice packs',
      estimatedPeopleServed: 45,
      foodPreparationTime: new Date(now - 90 * 60_000).toISOString(),
      foodShelfLifeCategory: 'cooked_meals',
      earliestSafeUntil: new Date(now + 3 * 3600_000).toISOString(),
      pickupSchedule: {
        readyType: 'immediate',
        readyTime: new Date(now - 40 * 60_000).toISOString(),
        deadlineTime: new Date(now + 2 * 3600_000).toISOString(),
        pickupInstructions: 'Alipiri Road loading bay. Tell security you are collecting surplus food.',
      },
      collectionAddress: {
        addressLine1: 'Alipiri Footpath Road, Near Toll Gate',
        areaLocality: 'Alipiri',
        city: 'Tirupati',
        state: 'Andhra Pradesh',
        pincode: '517501',
        landmark: 'Alipiri Metro / Footpath starting point',
        latitude: 13.6532,
        longitude: 79.4198,
      },
      photos: [],
      status: 'en_route',
      createdAt: new Date(now - 2 * 3600_000).toISOString(),
      handoverOtp: '591402',
      claim: {
        claimedAt: new Date(now - 25 * 60_000).toISOString(),
        volunteerId: 'vol_tirupati_demo',
        volunteerName: 'Vikram Sharma',
        volunteerPhone: '9845099887',
        volunteerVehicle: 'Hero Electric Two-Wheeler',
        volunteerRole: 'individual',
        currentStatus: 'en_route',
        statusHistory: [
          {
            status: 'claimed',
            timestamp: new Date(now - 25 * 60_000).toISOString(),
            note: 'Pickup claimed',
          },
          {
            status: 'en_route',
            timestamp: new Date(now - 10 * 60_000).toISOString(),
            note: 'Volunteer started towards Alipiri collection point',
          },
        ],
        volunteerCoordinates: { latitude: 13.6405, longitude: 79.4112, updatedAt: new Date().toISOString() },
        estimatedArrivalMinutes: 8,
      },
    },
    {
      id: 'don_seed_completed',
      donorId: 'donor_tirupati_demo',
      donorName: 'Ananya Deshmukh (SV University Catering)',
      donorPhone: '9845012345',
      donorType: 'function_event',
      customFoodSource: 'Campus function catering',
      items: [
        {
          id: 'item_4',
          name: 'Wedding Veg Biryani Trays',
          quantity: 18,
          unit: 'kg',
          foodType: 'veg',
          shelfLifeHours: 6,
          safeUntil: new Date(now - 2 * 3600_000).toISOString(),
        },
      ],
      totalQuantityLabel: '18 kg biryani',
      estimatedPeopleServed: 50,
      foodPreparationTime: new Date(now - 8 * 3600_000).toISOString(),
      foodShelfLifeCategory: 'cooked_meals',
      earliestSafeUntil: new Date(now - 2 * 3600_000).toISOString(),
      pickupSchedule: {
        readyType: 'immediate',
        readyTime: new Date(now - 6 * 3600_000).toISOString(),
        deadlineTime: new Date(now - 3 * 3600_000).toISOString(),
        pickupInstructions: 'Function hall rear gate.',
      },
      collectionAddress: {
        addressLine1: 'Near SV University Main Gate, Balaji Colony',
        areaLocality: 'SV University',
        city: 'Tirupati',
        state: 'Andhra Pradesh',
        pincode: '517502',
        landmark: 'Opposite University clock tower',
        latitude: 13.6289,
        longitude: 79.3988,
      },
      photos: [],
      status: 'completed',
      createdAt: new Date(now - 10 * 3600_000).toISOString(),
      handoverOtp: '719342',
      handoverVerifiedAt: new Date(now - 4 * 3600_000).toISOString(),
      claim: {
        claimedAt: new Date(now - 6 * 3600_000).toISOString(),
        volunteerId: 'vol_tirupati_demo',
        volunteerName: 'Vikram Sharma',
        volunteerPhone: '9845099887',
        volunteerVehicle: 'Hero Electric Two-Wheeler',
        volunteerRole: 'individual',
        currentStatus: 'completed',
        statusHistory: [
          {
            status: 'claimed',
            timestamp: new Date(now - 6 * 3600_000).toISOString(),
            note: 'Pickup claimed',
          },
          {
            status: 'en_route',
            timestamp: new Date(now - 5.5 * 3600_000).toISOString(),
            note: 'Volunteer en route',
          },
          {
            status: 'collected',
            timestamp: new Date(now - 4 * 3600_000).toISOString(),
            note: 'Handover OTP verified',
          },
          {
            status: 'completed',
            timestamp: new Date(now - 3 * 3600_000).toISOString(),
            note: 'Distributed to beneficiaries in Tirupati',
          },
        ],
        volunteerCoordinates: { latitude: 13.6289, longitude: 79.3988, updatedAt: new Date(now - 3 * 3600_000).toISOString() },
        estimatedArrivalMinutes: 0,
      },
    },
  ]
}

// ─── MODULE-LEVEL IN-MEMORY STORE ────────────────────────────────────────────

let donations: Donation[] = []
let notifications: DonationNotification[] = []
let initialized = false

function ensureInitialized() {
  if (!initialized) {
    donations = makeSeedDonations()
    notifications = [
      {
        id: 'notif_seed_1',
        recipientRole: 'donor',
        recipientId: 'donor_tirupati_demo',
        donationId: 'don_seed_enroute',
        title: 'Volunteer En Route!',
        message: 'A volunteer has claimed your Alipiri surplus listing and is on the way. Handover OTP: 591402',
        type: 'handover_otp',
        createdAt: new Date(Date.now() - 24 * 60_000).toISOString(),
        read: false,
        handoverOtp: '591402',
      },
    ]
    initialized = true
  }
}
const donorProfiles = new Map<string, DonorProfile>([
  [
    'donor_tirupati_demo',
    {
      id: 'donor_tirupati_demo',
      name: 'Ramesh Verma',
      phone: '9876543210',
      donorType: 'restaurant',
      collectionAddress: {
        addressLine1: '18, Gandhi Road, Near RTC Complex',
        areaLocality: 'Tirupati Central',
        city: 'Tirupati',
        state: 'Andhra Pradesh',
        pincode: '517501',
        landmark: 'Opposite APSRTC Bus Station',
        additionalDirections: 'Ground floor kitchen dispatch, Gandhi Road side.',
        latitude: TIRUPATI.lat,
        longitude: TIRUPATI.lng,
      },
    },
  ],
])
const volunteerProfiles = new Map<string, VolunteerProfile>([
  [
    'vol_tirupati_demo',
    {
      id: 'vol_tirupati_demo',
      name: 'Vikram Sharma',
      phone: '9845099887',
      vehicle: 'Hero Electric Two-Wheeler',
      role: 'individual',
    },
  ],
])

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

function attachDemoListings(
  list: Donation[],
  role: string | undefined,
  userId: string | undefined,
  displayName?: string,
  displayPhone?: string
): Donation[] {
  if (!userId) return list
  if (role === 'donor') {
    return list
      .filter((d) => SEED_DONATION_IDS.has(d.id) || d.donorId === userId)
      .map((d) =>
        SEED_DONATION_IDS.has(d.id)
          ? {
              ...d,
              donorId: userId,
              donorName: displayName || d.donorName,
              donorPhone: displayPhone || d.donorPhone,
            }
          : d
      )
  }
  if (role === 'volunteer') {
    return list.map((donation) => {
      const withOwner =
        SEED_DONATION_IDS.has(donation.id) && donation.claim
          ? {
              ...donation,
              claim: {
                ...donation.claim,
                volunteerId: userId,
                volunteerName: displayName || donation.claim.volunteerName,
                volunteerPhone: displayPhone || donation.claim.volunteerPhone,
              },
            }
          : donation
      return maskForVolunteer(withOwner, userId)
    })
  }
  return list
}

function presentDonation(
  donation: Donation,
  role: string | undefined,
  userId: string | undefined,
  displayName?: string,
  displayPhone?: string
): Donation {
  return attachDemoListings([donation], role, userId, displayName, displayPhone)[0] || donation
}

function volunteerOwnsClaim(donation: Donation, volunteerId: string): boolean {
  if (!donation.claim) return false
  if (donation.claim.volunteerId === volunteerId) return true
  return SEED_DONATION_IDS.has(donation.id)
}

function assignSeedClaimToVolunteer(donation: Donation, volunteerId: string, volunteerName?: string, volunteerPhone?: string) {
  if (!donation.claim || !SEED_DONATION_IDS.has(donation.id)) return
  donation.claim.volunteerId = volunteerId
  if (volunteerName) donation.claim.volunteerName = volunteerName
  if (volunteerPhone) donation.claim.volunteerPhone = volunteerPhone
}

function maskForVolunteer(donation: Donation, volunteerId?: string): Donation {
  const isClaimer = donation.claim && volunteerId && donation.claim.volunteerId === volunteerId
  if (isClaimer) return donation
  return {
    ...donation,
    donorPhone: '••••••••••',
    handoverOtp: '••••••',
    collectionAddress: {
      ...donation.collectionAddress,
      addressLine1: 'Exact address revealed upon claim',
      addressLine2: undefined,
      landmark: 'Revealed upon claim',
      additionalDirections: undefined,
      latitude: donation.collectionAddress.latitude
        ? Number(donation.collectionAddress.latitude.toFixed(3))
        : null,
      longitude: donation.collectionAddress.longitude
        ? Number(donation.collectionAddress.longitude.toFixed(3))
        : null,
    },
  }
}

// ─── ROUTER ──────────────────────────────────────────────────────────────────

export const onRequest: PagesFunction = async (context) => {
  ensureInitialized()
  const req = context.request
  const url = new URL(req.url)
  const path = url.pathname // e.g. /api/donations or /api/donations/don_123/claim

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  // ── GET /api/geocode/reverse ───────────────────────────────────────────
  if (path === '/api/geocode/reverse' && req.method === 'GET') {
    const lat = url.searchParams.get('lat')
    const lon = url.searchParams.get('lon')
    if (!lat || !lon) {
      return json({ error: 'lat and lon parameters are required.' }, 400)
    }
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        lat
      )}&lon=${encodeURIComponent(lon)}&addressdetails=1`
      const res = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'ShareAMealApp/1.0 (contact@shareameal.local)',
          'Accept': 'application/json',
          'Accept-Language': 'en',
        },
      })
      if (!res.ok) {
        return json({ error: 'Reverse geocode service returned error.' }, res.status)
      }
      const data = await res.json()
      return json(data)
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : 'Reverse geocode failed.' }, 500)
    }
  }

  // ── In-Memory OTP Store for Edge Verification ──────────────────────────
  if ((globalThis as any).__activeOtpStore === undefined) {
    ;(globalThis as any).__activeOtpStore = new Map<string, { code: string; expiresAt: number; verificationId: string }>()
  }
  const otpStore = (globalThis as any).__activeOtpStore as Map<string, { code: string; expiresAt: number; verificationId: string }>

  // OTP status and verification remain public because they are used before user creation
  const isPublicAuthRoute = path.startsWith('/api/otp/') || path === '/api/phone-email/verify'

  let actor = isPublicAuthRoute ? null : await requireActor(context)
  if (!actor && !isPublicAuthRoute) {
    const roleParam = url.searchParams.get('role') as 'donor' | 'volunteer' | null
    const userIdParam = url.searchParams.get('userId')
    const role = roleParam || (path.includes('volunteer') ? 'volunteer' : 'donor')
    const userId = userIdParam || (role === 'donor' ? 'donor_tirupati_demo' : 'vol_tirupati_demo')
    actor = { id: userId, role }
  }

  let body: Record<string, unknown> = {}
  if (req.method === 'POST') {
    try {
      body = (await req.json()) as Record<string, unknown>
    } catch {
      body = {}
    }
  }

  // ── GET /api/otp/status ─────────────────────────────────────────────────
  if (path === '/api/otp/status' && req.method === 'GET') {
    return json({ provider: 'native_otp', isConfigured: true, missingVariables: [] })
  }

  // ── POST /api/otp/send & /api/otp/resend ────────────────────────────────
  if ((path === '/api/otp/send' || path === '/api/otp/resend') && req.method === 'POST') {
    const countryCode = String(body.countryCode || '+91').trim()
    const phoneNumber = String(body.phoneNumber || '').trim().replace(/\D/g, '')
    if (!phoneNumber || phoneNumber.length < 5) {
      return json({ success: false, error: 'Please enter a valid mobile number.' }, 400)
    }
    const fullPhone = `${countryCode}${phoneNumber}`
    const windowTime = Math.floor(Date.now() / (10 * 60 * 1000))
    let hash = 0
    const str = `${fullPhone}_${windowTime}_sam_otp_salt`
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
    }
    const code = (100000 + (Math.abs(hash) % 900000)).toString()
    const verificationId = `otp_ver_${Date.now()}_${Math.floor(Math.random() * 10000)}`
    otpStore.set(fullPhone, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
      verificationId,
    })
    return json({
      success: true,
      verificationId,
      status: 'pending',
      demoOtp: code,
      message: `Verification code sent to ${countryCode} ${phoneNumber}. Demo code: ${code}`,
    })
  }

  // ── POST /api/otp/verify ────────────────────────────────────────────────
  if (path === '/api/otp/verify' && req.method === 'POST') {
    const countryCode = String(body.countryCode || '+91').trim()
    const phoneNumber = String(body.phoneNumber || '').trim().replace(/\D/g, '')
    const inputCode = String(body.code || '').trim().replace(/\D/g, '')
    const fullPhone = `${countryCode}${phoneNumber}`
    const stored = otpStore.get(fullPhone)

    const windowTime = Math.floor(Date.now() / (10 * 60 * 1000))
    let h0 = 0
    const s0 = `${fullPhone}_${windowTime}_sam_otp_salt`
    for (let i = 0; i < s0.length; i++) h0 = ((h0 << 5) - h0 + s0.charCodeAt(i)) | 0
    const expected0 = (100000 + (Math.abs(h0) % 900000)).toString()

    let h1 = 0
    const s1 = `${fullPhone}_${windowTime - 1}_sam_otp_salt`
    for (let i = 0; i < s1.length; i++) h1 = ((h1 << 5) - h1 + s1.charCodeAt(i)) | 0
    const expectedPrev = (100000 + (Math.abs(h1) % 900000)).toString()

    // Allow universal testing code 123456, exact generated code, or deterministic window codes
    const isApproved =
      inputCode === '123456' ||
      (stored && stored.code === inputCode && stored.expiresAt > Date.now()) ||
      inputCode === expected0 ||
      inputCode === expectedPrev

    if (!isApproved) {
      return json({
        success: false,
        status: 'failed',
        error: 'Invalid or expired OTP code. Please enter the 6-digit code or demo code 123456.',
      }, 400)
    }

    const verificationToken = `tok_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    return json({
      success: true,
      status: 'approved',
      verificationToken,
      countryCode,
      phoneNumber,
      message: 'Mobile number verified successfully.',
    })
  }

  // ── POST /api/phone-email/verify ────────────────────────────────────────
  if (path === '/api/phone-email/verify' && req.method === 'POST') {
    const countryCode = String(body.countryCode || '+91')
    const phoneNumber = String(body.phoneNumber || '9876543210')
    return json({
      success: true,
      countryCode,
      phoneNumber,
      message: 'Mobile number verified successfully.',
    })
  }


  // ── GET /api/donations ──────────────────────────────────────────────────
  if (path === '/api/donations' && req.method === 'GET') {
    const role = url.searchParams.get('role') || undefined
    const userId = url.searchParams.get('userId') || undefined
    const status = url.searchParams.get('status') || undefined
    const locality = url.searchParams.get('locality') || undefined

    let list = [...donations]
    if (status) list = list.filter((d) => d.status === status)
    if (locality) {
      const loc = locality.toLowerCase()
      list = list.filter(
        (d) =>
          (d.collectionAddress.areaLocality || '').toLowerCase().includes(loc) ||
          (d.collectionAddress.city || '').toLowerCase().includes(loc)
      )
    }
    const displayName = url.searchParams.get('displayName') || undefined
    const displayPhone = url.searchParams.get('displayPhone') || undefined
    list = attachDemoListings(list, role, userId, displayName, displayPhone)
    return json({ success: true, donations: list })
  }

  // ── POST /api/donations/create ─────────────────────────────────────────
  if (path === '/api/donations/create' && req.method === 'POST') {
    const payload = body as {
      donorId?: string; donorName?: string; donorPhone?: string; donorType?: string
      customFoodSource?: string; items?: FoodItem[]; estimatedPeopleServed?: number
      foodPreparationTime?: string; foodCategory?: Donation['foodCategory']; foodCategories?: Donation['foodCategories']; customFoodCategory?: string
      foodShelfLifeCategory?: string; earliestSafeUntil?: string
      safeUntilHours?: number; pickupSchedule?: PickupSchedule; collectionAddress?: CollectionAddress
      photos?: string[]
    }
    if (!payload.donorName || !payload.donorPhone || !payload.items?.length) {
      return json({ success: false, error: 'donorName, donorPhone, and at least one item are required.' }, 400)
    }
    if (payload.items.some((item) => !String(item.name || '').trim() || !(Number(item.quantity) > 0))) {
      return json({ success: false, error: 'Every food item requires a name and a quantity greater than zero.' }, 400)
    }
    if (!(Number(payload.estimatedPeopleServed) > 0)) {
      return json({ success: false, error: 'Estimated people served must be greater than zero.' }, 400)
    }
    const preparationTime = new Date(payload.foodPreparationTime || '')
    const pickupTime = new Date(payload.pickupSchedule?.readyTime || '')
    const deadlineTime = new Date(payload.pickupSchedule?.deadlineTime || '')
    if (Number.isNaN(preparationTime.getTime()) || Number.isNaN(pickupTime.getTime()) || Number.isNaN(deadlineTime.getTime())) {
      return json({ success: false, error: 'Preparation time, pickup time, and donation deadline must be valid dates.' }, 400)
    }
    if (deadlineTime < pickupTime) {
      return json({ success: false, error: 'Donation deadline cannot be earlier than the pickup schedule.' }, 400)
    }
    const foodCategories = [...new Set(payload.foodCategories?.length ? payload.foodCategories : [payload.foodCategory || 'prepared_meals'])]
    const foodCategory = foodCategories[0]
    if (foodCategories.includes('other') && !payload.customFoodCategory?.trim()) {
      return json({ success: false, error: 'Specify the food category when Other is selected.' }, 400)
    }
    const handoverOtp = Math.floor(100000 + Math.random() * 900000).toString()
    const donationId = `don_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    // Retain the legacy freshness timestamp for existing consumers without showing a
    // calculated countdown in the donor creation form.
    const safeUntilDate = deadlineTime
    const items: FoodItem[] = (payload.items || []).map((item, idx) => ({
      id: `item_${Date.now()}_${idx}`,
      name: String(item.name || '').trim(),
      quantity: Number(item.quantity),
      unit: item.unit || 'portions',
      foodType: item.foodType || 'veg',
      shelfLifeHours: payload.safeUntilHours,
      safeUntil: item.safeUntil || safeUntilDate.toISOString(),
      photo: item.photo || (payload.photos && payload.photos[0]),
    }))
    const totalQuantityLabel = items
      .slice(0, 3)
      .map((it) => `${it.quantity} ${it.unit} ${it.name}`)
      .join(', ')
    const newDonation: Donation = {
      id: donationId,
      donorId: payload.donorId || `donor_${Date.now()}`,
      donorName: String(payload.donorName).trim(),
      donorPhone: String(payload.donorPhone).trim(),
      donorType: payload.donorType || 'household',
      customFoodSource: payload.customFoodSource?.trim(),
      items,
      totalQuantityLabel,
      estimatedPeopleServed: Number(payload.estimatedPeopleServed) || 20,
      foodPreparationTime: preparationTime.toISOString(),
      foodCategory,
      foodCategories,
      customFoodCategory: payload.customFoodCategory?.trim(),
      foodShelfLifeCategory: payload.foodShelfLifeCategory || 'cooked_meals',
      earliestSafeUntil: payload.earliestSafeUntil || safeUntilDate.toISOString(),
      pickupSchedule: payload.pickupSchedule!,
      collectionAddress: payload.collectionAddress!,
      photos: payload.photos || [],
      status: 'available',
      createdAt: new Date().toISOString(),
      handoverOtp,
    }
    donations.unshift(newDonation)
    notifications.unshift({
      id: `notif_${Date.now()}`,
      recipientRole: 'donor',
      recipientId: newDonation.donorId,
      donationId: newDonation.id,
      title: 'Donation Listed Successfully',
      message: `Your donation "${items[0]?.name || 'Food Donation'}" is now visible to nearby volunteers. Handover OTP: ${handoverOtp}.`,
      type: 'handover_otp',
      createdAt: new Date().toISOString(),
      read: false,
      handoverOtp,
    })
    return json({ success: true, donation: newDonation })
  }

  // ── /api/donations/:id routes ───────────────────────────────────────────
  const donationMatch = path.match(/^\/api\/donations\/([^/]+)(?:\/(.+))?$/)
  if (donationMatch) {
    const donationId = decodeURIComponent(donationMatch[1])
    const action = donationMatch[2] || ''

    // GET /api/donations/:id
    if (!action && req.method === 'GET') {
      const role = url.searchParams.get('role') || undefined
      const userId = url.searchParams.get('userId') || undefined
      const donation = donations.find((d) => d.id === donationId)
      if (!donation) return json({ success: false, error: 'Donation not found.' }, 404)
      const displayName = url.searchParams.get('displayName') || undefined
      const displayPhone = url.searchParams.get('displayPhone') || undefined
      const result = presentDonation(donation, role, userId, displayName, displayPhone)
      return json({ success: true, donation: result })
    }

    // POST /api/donations/:id/claim
    if (action === 'claim' && req.method === 'POST') {
      const donation = donations.find((d) => d.id === donationId)
      if (!donation) return json({ success: false, error: 'Donation not found.' }, 404)
      if (donation.status !== 'available') {
        return json({ success: false, error: 'This listing is no longer available. It was already claimed.' }, 409)
      }
      const { volunteerId, volunteerName, volunteerPhone, volunteerVehicle, volunteerRole, ngoName } = body as Record<string, string>
      if (!volunteerId || !volunteerName || !volunteerPhone) {
        return json({ success: false, error: 'Volunteer id, name, and phone are required.' }, 400)
      }
      const now = new Date().toISOString()
      donation.status = 'claimed'
      donation.claim = {
        claimedAt: now,
        volunteerId,
        volunteerName,
        volunteerPhone,
        volunteerVehicle: volunteerVehicle || 'Two-Wheeler / Bike',
        volunteerRole: (volunteerRole as 'individual' | 'ngo_member') || 'individual',
        ngoName,
        currentStatus: 'claimed',
        statusHistory: [{ status: 'claimed', timestamp: now, note: `Claimed by ${volunteerName}`, updatedBy: volunteerName }],
        volunteerCoordinates: {
          latitude: (donation.collectionAddress.latitude || TIRUPATI.lat) + (Math.random() - 0.5) * 0.02,
          longitude: (donation.collectionAddress.longitude || TIRUPATI.lng) + (Math.random() - 0.5) * 0.02,
          updatedAt: now,
        },
        estimatedArrivalMinutes: 15,
      }
      notifications.unshift({
        id: `notif_${Date.now()}`,
        recipientRole: 'donor',
        recipientId: donation.donorId,
        donationId: donation.id,
        title: 'Volunteer Assigned to Your Donation!',
        message: `${volunteerName} has claimed your surplus food pickup. Handover OTP: ${donation.handoverOtp}.`,
        type: 'claim',
        createdAt: now,
        read: false,
        handoverOtp: donation.handoverOtp,
      })
      return json({ success: true, donation })
    }

    // POST /api/donations/:id/status
    if (action === 'status' && req.method === 'POST') {
      const donation = donations.find((d) => d.id === donationId)
      if (!donation || !donation.claim) return json({ success: false, error: 'Donation or active claim not found.' }, 404)
      const { status, volunteerId, note, coordinates, estimatedArrivalMinutes } = body as {
        status: DonationStatus; volunteerId: string; note?: string
        coordinates?: { latitude: number; longitude: number }; estimatedArrivalMinutes?: number
      }
      if (!status || !volunteerId) return json({ success: false, error: 'status and volunteerId are required.' }, 400)
      if (!volunteerOwnsClaim(donation, volunteerId)) {
        return json({ success: false, error: 'Unauthorized: not the assigned volunteer.' }, 403)
      }
      assignSeedClaimToVolunteer(donation, volunteerId)
      if (status === 'collected' && !donation.handoverVerifiedAt) {
        return json({ success: false, error: 'Handover OTP must be verified before marking food as collected.' }, 400)
      }
      const now = new Date().toISOString()
      donation.status = status
      donation.claim.currentStatus = status
      donation.claim.statusHistory.push({ status, timestamp: now, note: note || `Status: ${status}`, updatedBy: donation.claim.volunteerName })
      if (coordinates) donation.claim.volunteerCoordinates = { ...coordinates, updatedAt: now }
      if (estimatedArrivalMinutes !== undefined) donation.claim.estimatedArrivalMinutes = estimatedArrivalMinutes
      return json({ success: true, donation })
    }

    // POST /api/donations/:id/verify-handover
    if (action === 'verify-handover' && req.method === 'POST') {
      const donation = donations.find((d) => d.id === donationId)
      if (!donation || !donation.claim) return json({ success: false, error: 'Donation or active claim not found.' }, 404)
      const { code, volunteerId } = body as { code: string; volunteerId: string }
      if (!code || !volunteerId) return json({ success: false, error: 'code and volunteerId are required.' }, 400)
      if (!volunteerOwnsClaim(donation, volunteerId)) return json({ success: false, error: 'Unauthorized.' }, 403)
      assignSeedClaimToVolunteer(donation, volunteerId)
      if (code !== donation.handoverOtp) return json({ success: false, error: 'Incorrect Handover OTP. Please check with the donor.' }, 400)
      const now = new Date().toISOString()
      donation.status = 'collected'
      donation.handoverVerifiedAt = now
      donation.claim.currentStatus = 'collected'
      donation.claim.statusHistory.push({ status: 'collected', timestamp: now, note: 'Handover OTP verified. Food collected.', updatedBy: donation.claim.volunteerName })
      notifications.unshift({
        id: `notif_${Date.now()}`,
        recipientRole: 'donor',
        recipientId: donation.donorId,
        donationId: donation.id,
        title: 'Food Handover Verified & Collected! 🍲',
        message: `Handover OTP confirmed by ${donation.claim.volunteerName}. Surplus food is now in transit to beneficiaries.`,
        type: 'completed',
        createdAt: now,
        read: false,
      })
      return json({ success: true, donation })
    }

    // POST /api/donations/:id/cancel
    if (action === 'cancel' && req.method === 'POST') {
      const donation = donations.find((d) => d.id === donationId)
      if (!donation) return json({ success: false, error: 'Donation not found.' }, 404)
      if (donation.status === 'collected' || donation.status === 'completed') {
        return json({ success: false, error: 'Cannot cancel a collected or completed donation.' }, 400)
      }
      donation.status = 'cancelled'
      donation.cancellationReason = String(body.reason || 'Cancelled by donor')
      return json({ success: true, donation })
    }

    // POST /api/donations/:id/volunteer-location
    if (action === 'volunteer-location' && req.method === 'POST') {
      const donation = donations.find((d) => d.id === donationId)
      if (!donation || !donation.claim) return json({ success: false, error: 'Donation or assigned claim not found.' }, 404)
      const { volunteerId, coordinates } = body as { volunteerId: string; coordinates: { latitude: number; longitude: number } }
      if (!volunteerId || !coordinates) return json({ success: false, error: 'volunteerId and coordinates are required.' }, 400)
      if (!volunteerOwnsClaim(donation, volunteerId)) return json({ success: false, error: 'Unauthorized: volunteer does not match claim.' }, 403)
      assignSeedClaimToVolunteer(donation, volunteerId)
      donation.claim.volunteerCoordinates = { ...coordinates, updatedAt: new Date().toISOString() }
      donation.claim.isBroadcastingGps = true
      return json({ success: true, donation })
    }
  }

  // ── Profile routes ──────────────────────────────────────────────────────
  if (path === '/api/profile/donor') {
    if (req.method === 'GET') {
      const id = url.searchParams.get('id') || 'donor_tirupati_demo'
      const profile = donorProfiles.get(id) || null
      return json({ success: true, profile })
    }
    if (req.method === 'POST') {
      const profile = body as DonorProfile
      if (!profile.id) return json({ success: false, error: 'Profile id is required.' }, 400)
      donorProfiles.set(profile.id, profile)
      for (const d of donations) {
        if (d.donorId === profile.id) {
          d.donorName = profile.name
          d.donorPhone = profile.phone
          d.donorType = profile.donorType
        }
      }
      return json({ success: true, profile })
    }
  }

  if (path === '/api/profile/volunteer') {
    if (req.method === 'GET') {
      const id = url.searchParams.get('id') || 'vol_tirupati_demo'
      const profile = volunteerProfiles.get(id) || null
      return json({ success: true, profile })
    }
    if (req.method === 'POST') {
      const profile = body as VolunteerProfile
      if (!profile.id) return json({ success: false, error: 'Profile id is required.' }, 400)
      volunteerProfiles.set(profile.id, profile)
      for (const d of donations) {
        if (d.claim && d.claim.volunteerId === profile.id) {
          d.claim.volunteerName = profile.name
          d.claim.volunteerPhone = profile.phone
          d.claim.volunteerVehicle = profile.vehicle
          d.claim.volunteerRole = profile.role
          d.claim.ngoName = profile.ngoName
        }
      }
      return json({ success: true, profile })
    }
  }

  // ── Notifications ───────────────────────────────────────────────────────
  if (path === '/api/notifications' && req.method === 'GET') {
    const role = url.searchParams.get('role') || undefined
    const userId = url.searchParams.get('userId') || undefined
    let list = [...notifications]
    if (role) {
      list = list.filter(
        (n) =>
          n.recipientRole === 'all' ||
          n.recipientRole === role ||
          (userId && n.recipientId === userId)
      )
    }
    return json({ success: true, notifications: list })
  }

  const notifReadMatch = path.match(/^\/api\/notifications\/([^/]+)\/read$/)
  if (notifReadMatch && req.method === 'POST') {
    const notifId = decodeURIComponent(notifReadMatch[1])
    const notif = notifications.find((n) => n.id === notifId)
    if (notif) notif.read = true
    return json({ success: true })
  }

  // Not matched API route
  if (path.startsWith('/api/')) {
    return json({ success: false, error: 'API route not found' }, 404)
  }

  // Pass through to static assets
  return context.next()
}
