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

function makeSeedDonations(): Donation[] {
  const now = Date.now()
  return [
    {
      id: 'don_seed_001',
      donorId: 'donor_taj_bengaluru',
      donorName: 'Ramesh Verma (The Spice Terrace)',
      donorPhone: '9876543210',
      donorType: 'restaurant',
      items: [
        {
          id: 'item_1',
          name: 'Hyderabadi Veg Biryani',
          quantity: 12,
          unit: 'kg',
          foodType: 'veg',
          shelfLifeHours: 5,
          safeUntil: new Date(now + 4 * 3600_000).toISOString(),
          photo: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80',
        },
        {
          id: 'item_2',
          name: 'Paneer Butter Masala',
          quantity: 8,
          unit: 'litres',
          foodType: 'veg',
          shelfLifeHours: 5,
          safeUntil: new Date(now + 4 * 3600_000).toISOString(),
          photo: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=400&q=80',
        },
        {
          id: 'item_3',
          name: 'Tawa Butter Roti',
          quantity: 60,
          unit: 'portions',
          foodType: 'veg',
          shelfLifeHours: 6,
          safeUntil: new Date(now + 5 * 3600_000).toISOString(),
          photo: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80',
        },
      ],
      totalQuantityLabel: '12 kg Biryani, 8 L Curry, 60 Rotis',
      estimatedPeopleServed: 55,
      foodPreparationTime: new Date(now - 2 * 3600_000).toISOString(),
      foodShelfLifeCategory: 'cooked_meals',
      earliestSafeUntil: new Date(now + 4 * 3600_000).toISOString(),
      pickupSchedule: {
        readyType: 'immediate',
        readyTime: new Date(now - 30 * 60_000).toISOString(),
        deadlineTime: new Date(now + 3 * 3600_000).toISOString(),
        pickupInstructions: 'Enter via rear kitchen ramp. Containers are sealed in insulated foil boxes.',
      },
      collectionAddress: {
        addressLine1: '42, 100 Feet Road, Near Sony Signal',
        addressLine2: '2nd Floor, Commercial Block',
        areaLocality: 'Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        landmark: 'Opposite Metro Pillar 140',
        additionalDirections: 'Kitchen dispatch counter on Ground Floor rear.',
        latitude: 12.9784,
        longitude: 77.6408,
      },
      photos: ['https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80'],
      status: 'available',
      createdAt: new Date(now - 3600_000).toISOString(),
      handoverOtp: '482915',
    },
    {
      id: 'don_seed_002',
      donorId: 'donor_greenleaf_catering',
      donorName: 'Ananya Deshmukh (Greenleaf Catering)',
      donorPhone: '9845012345',
      donorType: 'function_event',
      customFoodSource: 'Wedding Banquet Catering',
      items: [
        {
          id: 'item_4',
          name: 'Veg Pulao with Mixed Vegetables',
          quantity: 18,
          unit: 'kg',
          foodType: 'veg',
          shelfLifeHours: 5,
          safeUntil: new Date(now + 3 * 3600_000).toISOString(),
          photo: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=400&q=80',
        },
        {
          id: 'item_5',
          name: 'Dal Tadka & Steamed Rice',
          quantity: 15,
          unit: 'kg',
          foodType: 'veg',
          shelfLifeHours: 5,
          safeUntil: new Date(now + 3 * 3600_000).toISOString(),
          photo: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80',
        },
        {
          id: 'item_6',
          name: 'Gulab Jamun Dessert',
          quantity: 70,
          unit: 'portions',
          foodType: 'veg',
          shelfLifeHours: 24,
          safeUntil: new Date(now + 20 * 3600_000).toISOString(),
          photo: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=400&q=80',
        },
      ],
      totalQuantityLabel: '33 kg Rice & Dal, 70 Desserts',
      estimatedPeopleServed: 80,
      foodPreparationTime: new Date(now - 3 * 3600_000).toISOString(),
      foodShelfLifeCategory: 'cooked_meals',
      earliestSafeUntil: new Date(now + 3 * 3600_000).toISOString(),
      pickupSchedule: {
        readyType: 'immediate',
        readyTime: new Date(now - 45 * 60_000).toISOString(),
        deadlineTime: new Date(now + 2 * 3600_000).toISOString(),
        pickupInstructions: 'Banquet service hall loading bay. Large van or cargo bike recommended.',
      },
      collectionAddress: {
        addressLine1: 'Convention Centre Gate 3, 80 Feet Road',
        areaLocality: 'Koramangala 4th Block',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560034',
        landmark: 'Near Maharaja Signal',
        additionalDirections: 'Tell security you are here for surplus food collection.',
        latitude: 12.9345,
        longitude: 77.6258,
      },
      photos: ['https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80'],
      status: 'available',
      createdAt: new Date(now - 2 * 3600_000).toISOString(),
      handoverOtp: '719342',
    },
    {
      id: 'don_seed_003',
      donorId: 'donor_artisan_bakery',
      donorName: 'Sunil Mathur (Crust & Crumb Bakery)',
      donorPhone: '9731298765',
      donorType: 'restaurant',
      customFoodSource: 'Commercial Artisan Bakery',
      items: [
        {
          id: 'item_7',
          name: 'Whole Wheat Sandwich Loaves',
          quantity: 25,
          unit: 'packets',
          foodType: 'vegan',
          shelfLifeHours: 36,
          safeUntil: new Date(now + 28 * 3600_000).toISOString(),
          photo: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
        },
        {
          id: 'item_8',
          name: 'Veg Puff Pastries',
          quantity: 35,
          unit: 'boxes',
          foodType: 'veg',
          shelfLifeHours: 12,
          safeUntil: new Date(now + 10 * 3600_000).toISOString(),
          photo: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80',
        },
      ],
      totalQuantityLabel: '25 Loaves, 35 Veg Puffs',
      estimatedPeopleServed: 40,
      foodPreparationTime: new Date(now - 5 * 3600_000).toISOString(),
      foodShelfLifeCategory: 'bakery_bread',
      earliestSafeUntil: new Date(now + 10 * 3600_000).toISOString(),
      pickupSchedule: {
        readyType: 'immediate',
        readyTime: new Date(now - 10 * 60_000).toISOString(),
        deadlineTime: new Date(now + 8 * 3600_000).toISOString(),
        pickupInstructions: 'Store front counter. Everything is packed in food-grade kraft bags.',
      },
      collectionAddress: {
        addressLine1: 'Shop 14, Whitefield Main Road',
        areaLocality: 'Whitefield',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560066',
        landmark: 'Next to Forum Mall',
        latitude: 12.9698,
        longitude: 77.7499,
      },
      photos: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80'],
      status: 'available',
      createdAt: new Date(now - 3 * 3600_000).toISOString(),
      handoverOtp: '364819',
    },
    {
      id: 'don_seed_004',
      donorId: 'donor_heritage_kitchen',
      donorName: 'Priya Nambiar (Heritage South Kitchen)',
      donorPhone: '9880054321',
      donorType: 'restaurant',
      items: [
        {
          id: 'item_9',
          name: 'Steamed Idli with Sambar & Chutney',
          quantity: 80,
          unit: 'portions',
          foodType: 'veg',
          shelfLifeHours: 5,
          safeUntil: new Date(now + 4 * 3600_000).toISOString(),
          photo: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80',
        },
        {
          id: 'item_10',
          name: 'Medu Vada',
          quantity: 40,
          unit: 'portions',
          foodType: 'veg',
          shelfLifeHours: 6,
          safeUntil: new Date(now + 4 * 3600_000).toISOString(),
          photo: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=400&q=80',
        },
      ],
      totalQuantityLabel: '80 Idlis, 40 Vadas with Sambar',
      estimatedPeopleServed: 45,
      foodPreparationTime: new Date(now - 3600_000).toISOString(),
      foodShelfLifeCategory: 'cooked_meals',
      earliestSafeUntil: new Date(now + 4 * 3600_000).toISOString(),
      pickupSchedule: {
        readyType: 'immediate',
        readyTime: new Date(now - 15 * 60_000).toISOString(),
        deadlineTime: new Date(now + 2 * 3600_000).toISOString(),
        pickupInstructions: 'Front billing desk. Ask for Manager Priya.',
      },
      collectionAddress: {
        addressLine1: '18, 5th Cross, 1st Block',
        areaLocality: 'Jayanagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560011',
        landmark: 'Near Ashoka Pillar',
        latitude: 12.9382,
        longitude: 77.5843,
      },
      photos: ['https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80'],
      status: 'en_route',
      createdAt: new Date(now - 3600_000).toISOString(),
      handoverOtp: '591402',
      claim: {
        claimedAt: new Date(now - 25 * 60_000).toISOString(),
        volunteerId: 'vol_vikram_01',
        volunteerName: 'Vikram Sharma',
        volunteerPhone: '9845099887',
        volunteerVehicle: 'Hero Electric Two-Wheeler (KA-05-EV-1234)',
        volunteerRole: 'individual',
        currentStatus: 'en_route',
        statusHistory: [
          {
            status: 'claimed',
            timestamp: new Date(now - 25 * 60_000).toISOString(),
            note: 'Pickup claimed by Vikram Sharma',
          },
          {
            status: 'en_route',
            timestamp: new Date(now - 10 * 60_000).toISOString(),
            note: 'Volunteer started journey towards collection point',
          },
        ],
        volunteerCoordinates: { latitude: 12.942, longitude: 77.589, updatedAt: new Date().toISOString() },
        estimatedArrivalMinutes: 8,
      },
    },
  ]
}

// ─── MODULE-LEVEL IN-MEMORY STORE ────────────────────────────────────────────

/** The only initial listings shown in the test environment. */
function makeTirupatiTestDonations(): Donation[] {
  const now = Date.now()
  const donor = {
    id: 'donor_tirupati_test',
    name: 'Tirupati Food Donor',
    phone: '9000000000',
    type: 'household',
  }
  const locations: Array<{
    id: string; food: string; quantity: number; addressLine1: string; areaLocality: string
    landmark: string; pincode: string; latitude: number; longitude: number
  }> = [
    { id: 'tirupati_hpo', food: 'Fresh Vegetarian Meals', quantity: 30, addressLine1: '13-3-344, Head Post Office Street', areaLocality: 'Tata Nagar', landmark: 'Tirupati Head Post Office', pincode: '517501', latitude: 13.6288, longitude: 79.4192 },
    { id: 'tirupati_korlagunta', food: 'Rice and Vegetable Curry', quantity: 35, addressLine1: '949A, Korlagunta Main Road', areaLocality: 'Ashok Nagar, Korlagunta', landmark: 'Korlagunta Post Office', pincode: '517501', latitude: 13.6355, longitude: 79.4281 },
    { id: 'tirupati_svu', food: 'Packed Lunch Boxes', quantity: 40, addressLine1: 'Sri Venkateswara University Road', areaLocality: 'SV University Campus Area', landmark: 'SV University 3rd Gate', pincode: '517502', latitude: 13.6286, longitude: 79.3983 },
    { id: 'tirupati_kapila', food: 'Breakfast Packets', quantity: 30, addressLine1: 'Kapila Theertham Road', areaLocality: 'Srinivasa Nagar, Varadaraja Nagar', landmark: 'Tirupati North Post Office', pincode: '517507', latitude: 13.6477, longitude: 79.4122 },
  ]

  return locations.map((location, index) => {
    const readyAt = new Date(now - (index + 1) * 15 * 60_000).toISOString()
    const deadlineAt = new Date(now + (3 + index) * 60 * 60_000).toISOString()
    const item: FoodItem = {
      id: `item_${location.id}`,
      name: location.food,
      quantity: location.quantity,
      unit: 'portions',
      foodType: 'veg',
      shelfLifeHours: 6,
      safeUntil: deadlineAt,
    }
    return {
      id: `don_${location.id}`,
      donorId: donor.id,
      donorName: donor.name,
      donorPhone: donor.phone,
      donorType: donor.type,
      items: [item],
      totalQuantityLabel: `${location.quantity} portions ${location.food}`,
      estimatedPeopleServed: location.quantity,
      foodPreparationTime: readyAt,
      foodCategory: 'prepared_meals',
      foodCategories: ['prepared_meals'],
      foodShelfLifeCategory: 'cooked_meals',
      earliestSafeUntil: deadlineAt,
      pickupSchedule: { readyType: 'immediate', readyTime: readyAt, deadlineTime: deadlineAt, pickupInstructions: 'Please collect from the stated landmark.' },
      collectionAddress: {
        addressLine1: location.addressLine1,
        areaLocality: location.areaLocality,
        city: 'Tirupati',
        state: 'Andhra Pradesh',
        pincode: location.pincode,
        landmark: location.landmark,
        latitude: location.latitude,
        longitude: location.longitude,
      },
      photos: [],
      status: 'available',
      createdAt: readyAt,
      handoverOtp: String(100000 + index),
    }
  })
}

let donations: Donation[] = []
let notifications: DonationNotification[] = []
let initialized = false

function ensureInitialized() {
  if (!initialized) {
    donations = makeTirupatiTestDonations()
    notifications = []
    initialized = true
  }
}
const donorProfiles = new Map<string, DonorProfile>([
  [
    'donor_taj_bengaluru',
    {
      id: 'donor_taj_bengaluru',
      name: 'Ramesh Verma',
      phone: '9876543210',
      donorType: 'restaurant',
      collectionAddress: {
        addressLine1: '42, 100 Feet Road, Near Sony Signal',
        addressLine2: '2nd Floor, Commercial Block',
        areaLocality: 'Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        landmark: 'Opposite Metro Pillar 140',
        additionalDirections: 'Kitchen dispatch counter on Ground Floor rear.',
        latitude: 12.9784,
        longitude: 77.6408,
      },
    },
  ],
])
const volunteerProfiles = new Map<string, VolunteerProfile>([
  [
    'vol_vikram_01',
    {
      id: 'vol_vikram_01',
      name: 'Vikram Sharma',
      phone: '9845099887',
      vehicle: 'Hero Electric Two-Wheeler (KA-05-EV-1234)',
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
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  // ── POST /api/phone-email/verify ───────────────────────────────────────
  // Phone.Email supplies a short-lived JSON URL after its OTP flow succeeds.
  // Fetching it server-side is essential: the browser must not be trusted to
  // provide a phone number on its own. Restrict the URL to Phone.Email's
  // official host so this endpoint cannot be used as an arbitrary fetch proxy.
  if (path === '/api/phone-email/verify' && req.method === 'POST') {
    let verificationRequest: { userJsonUrl?: unknown }
    try {
      verificationRequest = (await req.json()) as { userJsonUrl?: unknown }
    } catch {
      return json({ success: false, error: 'A Phone.Email verification response is required.' }, 400)
    }

    if (typeof verificationRequest.userJsonUrl !== 'string') {
      return json({ success: false, error: 'Phone.Email did not return a verification URL.' }, 400)
    }

    let userJsonUrl: URL
    try {
      userJsonUrl = new URL(verificationRequest.userJsonUrl)
    } catch {
      return json({ success: false, error: 'The Phone.Email verification URL is invalid.' }, 400)
    }

    if (userJsonUrl.protocol !== 'https:' || userJsonUrl.hostname !== 'user.phone.email' || !userJsonUrl.pathname.endsWith('.json')) {
      return json({ success: false, error: 'The Phone.Email verification URL was rejected.' }, 400)
    }

    try {
      const verifiedResponse = await fetch(userJsonUrl.toString(), {
        headers: { Accept: 'application/json' },
      })
      if (!verifiedResponse.ok) {
        return json({ success: false, error: 'Phone.Email could not confirm this verification. Please try again.' }, 502)
      }
      const verifiedUser = (await verifiedResponse.json()) as {
        user_country_code?: unknown
        user_phone_number?: unknown
      }
      const countryCode = String(verifiedUser.user_country_code || '').trim()
      const phoneNumber = String(verifiedUser.user_phone_number || '').replace(/\D/g, '')
      const supportedCountryCodes = new Set(['+91', '+1', '+44', '+61', '+971'])

      if (!supportedCountryCodes.has(countryCode) || !/^\d{7,15}$/.test(phoneNumber)) {
        return json({ success: false, error: 'Phone.Email returned an unsupported or invalid phone number.' }, 400)
      }

      return json({ success: true, countryCode, phoneNumber })
    } catch {
      return json({ success: false, error: 'Phone.Email verification could not be completed. Please try again.' }, 502)
    }
  }

  // Skip — let specific function files handle their own routes
  if (
    path.startsWith('/api/otp/') ||
    path.startsWith('/api/geocode/')
  ) {
    return context.next()
  }

  // OTP status intentionally remains public because it is used before registration.
  let actor = path === '/api/otp/status' ? null : await requireActor(context)
  if (!actor && path !== '/api/otp/status') {
    const roleParam = url.searchParams.get('role') as 'donor' | 'volunteer' | null
    const userIdParam = url.searchParams.get('userId')
    const role = roleParam || (path.includes('volunteer') ? 'volunteer' : 'donor')
    const userId = userIdParam || 'anonymous'
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
    return json({ provider: 'twilio', isConfigured: false, missingVariables: ['SMS credentials not required in demo mode'] })
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
    if (role === 'volunteer') {
      list = list.map((d) => maskForVolunteer(d, userId))
    }
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
      const result = role === 'volunteer' ? maskForVolunteer(donation, userId) : donation
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
          latitude: (donation.collectionAddress.latitude || 12.9716) + (Math.random() - 0.5) * 0.02,
          longitude: (donation.collectionAddress.longitude || 77.5946) + (Math.random() - 0.5) * 0.02,
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
      if (donation.claim.volunteerId !== volunteerId) {
        return json({ success: false, error: 'Unauthorized: not the assigned volunteer.' }, 403)
      }
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
      if (donation.claim.volunteerId !== volunteerId) return json({ success: false, error: 'Unauthorized.' }, 403)
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
      if (donation.claim.volunteerId !== volunteerId) return json({ success: false, error: 'Unauthorized: volunteer does not match claim.' }, 403)
      donation.claim.volunteerCoordinates = { ...coordinates, updatedAt: new Date().toISOString() }
      donation.claim.isBroadcastingGps = true
      return json({ success: true, donation })
    }
  }

  // ── Profile routes ──────────────────────────────────────────────────────
  if (path === '/api/profile/donor') {
    if (req.method === 'GET') {
      const id = url.searchParams.get('id')
      const profile = id ? donorProfiles.get(id) || null : null
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
      const id = url.searchParams.get('id')
      const profile = id ? volunteerProfiles.get(id) || null : null
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
