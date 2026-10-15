import assert from 'node:assert'
import { donationStore } from '../server/donationStore.ts'

console.log('=== RUNNING SHARE A MEAL FUNCTIONALITY & ARCHITECTURE FIXES TEST SUITE ===\n')

// -------------------------------------------------------------
// Test 1: Donor & Volunteer Profile Viewing and Persistence
// -------------------------------------------------------------
console.log('Test 1: Donor and Volunteer Profile Management')
const initialDonorProfile = donationStore.getDonorProfile('donor_taj_bengaluru')
assert.ok(initialDonorProfile, 'Initial donor profile must exist')
assert.strictEqual(initialDonorProfile.id, 'donor_taj_bengaluru')
assert.strictEqual(initialDonorProfile.name, 'Ramesh Verma')
assert.ok(initialDonorProfile.collectionAddress.latitude, 'Donor profile must contain default GPS latitude')
assert.ok(initialDonorProfile.collectionAddress.longitude, 'Donor profile must contain default GPS longitude')

// Update Donor Profile
const updatedDonor = donationStore.updateDonorProfile({
  ...initialDonorProfile,
  name: 'Ramesh Verma (Executive Chef)',
  phone: '9876500000',
})
assert.strictEqual(updatedDonor.name, 'Ramesh Verma (Executive Chef)')
const retrievedDonor = donationStore.getDonorProfile('donor_taj_bengaluru')
assert.strictEqual(retrievedDonor.name, 'Ramesh Verma (Executive Chef)')
assert.strictEqual(retrievedDonor.phone, '9876500000')

// Volunteer Profile Check
const initialVolunteerProfile = donationStore.getVolunteerProfile('vol_vikram_01')
assert.ok(initialVolunteerProfile, 'Initial volunteer profile must exist')
assert.strictEqual(initialVolunteerProfile.id, 'vol_vikram_01')
assert.strictEqual(initialVolunteerProfile.vehicle, 'Hero Electric Two-Wheeler (KA-05-EV-1234)')

// Update Volunteer Profile
const updatedVolunteer = donationStore.updateVolunteerProfile({
  ...initialVolunteerProfile,
  vehicle: 'Honda Activa 6G (KA-03-HA-9876)',
})
assert.strictEqual(updatedVolunteer.vehicle, 'Honda Activa 6G (KA-03-HA-9876)')
const retrievedVolunteer = donationStore.getVolunteerProfile('vol_vikram_01')
assert.strictEqual(retrievedVolunteer.vehicle, 'Honda Activa 6G (KA-03-HA-9876)')
console.log('  ✔ Complete profile viewing and editing synchronization passed.\n')

// -------------------------------------------------------------
// Test 2: Itemized Food Details & Photos (No "+N items" collapsing)
// -------------------------------------------------------------
console.log('Test 2: Food Items Table Structure & Photo Preservation')
const seedDonation = donationStore.getDonationById('don_seed_001')
assert.ok(seedDonation, 'Seed donation 001 must exist')
assert.ok(Array.isArray(seedDonation.items), 'Donation items must be an array')
assert.strictEqual(seedDonation.items.length, 3, 'Must contain all 3 separate food items')

// Verify every item has individual attributes (name, quantity, unit, safeUntil, photo)
for (const item of seedDonation.items) {
  assert.ok(item.id, 'Item must have id')
  assert.ok(item.name, 'Item must have name')
  assert.ok(item.quantity > 0, 'Item quantity must be positive')
  assert.ok(item.unit, 'Item must have unit')
  assert.ok(item.safeUntil, 'Item must have individual safeUntil freshness timestamp')
  assert.ok(item.photo, 'Item must have individual photo reference')
}
console.log('  ✔ Full itemization and individual food photos verified without truncation.\n')

// -------------------------------------------------------------
// Test 3: Dual Photo Mode in Donate Now (Option A vs Option B)
// -------------------------------------------------------------
console.log('Test 3: Dual Photo Ingestion (Option A Per-Item vs Option B Combined)')

// Mode A: Per-item individual photos
const donationModeA = donationStore.createDonation({
  donorId: 'donor_taj_bengaluru',
  donorName: 'Ramesh Verma',
  donorPhone: '9876543210',
  donorType: 'restaurant',
  items: [
    {
      name: 'South Indian Veg Meals',
      quantity: 25,
      unit: 'portions',
      foodType: 'veg',
      shelfLifeHours: 4,
      safeUntil: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      photo: 'data:image/jpeg;base64,mockItemPhoto1',
    },
    {
      name: 'Curd Rice Containers',
      quantity: 15,
      unit: 'portions',
      foodType: 'veg',
      shelfLifeHours: 5,
      safeUntil: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
      photo: 'data:image/jpeg;base64,mockItemPhoto2',
    },
  ],
  estimatedPeopleServed: 40,
  foodShelfLifeCategory: 'cooked_meals',
  foodPreparationTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  earliestSafeUntil: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
  pickupSchedule: {
    readyType: 'immediate',
    readyTime: new Date().toISOString(),
    deadlineTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  },
  collectionAddress: {
    addressLine1: '12 Commercial Street',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    latitude: 12.9815,
    longitude: 77.6083,
  },
  photos: ['data:image/jpeg;base64,mockItemPhoto1', 'data:image/jpeg;base64,mockItemPhoto2'],
})

assert.strictEqual(donationModeA.items[0].photo, 'data:image/jpeg;base64,mockItemPhoto1')
assert.strictEqual(donationModeA.items[1].photo, 'data:image/jpeg;base64,mockItemPhoto2')
assert.strictEqual(donationModeA.photos.length, 2)
console.log('  ✔ Option A (per-item individual photos) created and preserved.')

// Mode B: Single combined overview photo
const donationModeB = donationStore.createDonation({
  donorId: 'donor_taj_bengaluru',
  donorName: 'Ramesh Verma',
  donorPhone: '9876543210',
  donorType: 'restaurant',
  items: [
    {
      name: 'Mixed Fruit Trays',
      quantity: 10,
      unit: 'boxes',
      foodType: 'veg',
      shelfLifeHours: 6,
      safeUntil: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    },
  ],
  estimatedPeopleServed: 20,
  foodShelfLifeCategory: 'fruits_veg',
  foodPreparationTime: new Date().toISOString(),
  earliestSafeUntil: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
  pickupSchedule: {
    readyType: 'immediate',
    readyTime: new Date().toISOString(),
    deadlineTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
  },
  collectionAddress: {
    addressLine1: '88 MG Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    latitude: 12.9738,
    longitude: 77.6119,
  },
  photos: ['data:image/jpeg;base64,mockCombinedOverviewPhoto'],
})

assert.strictEqual(donationModeB.photos[0], 'data:image/jpeg;base64,mockCombinedOverviewPhoto')
console.log('  ✔ Option B (single combined food photo) created and preserved.\n')

// -------------------------------------------------------------
// Test 4: Separate Deadlines (Freshness Safe-Until vs Collection)
// -------------------------------------------------------------
console.log('Test 4: Expiry (Safe Consumption) vs Collection Deadline Separation')
const testDonation = donationModeA
assert.ok(testDonation.earliestSafeUntil, 'Must have distinct earliestSafeUntil')
assert.ok(testDonation.pickupSchedule.deadlineTime, 'Must have distinct pickupSchedule.deadlineTime')

const safeTime = new Date(testDonation.earliestSafeUntil).getTime()
const deadlineTime = new Date(testDonation.pickupSchedule.deadlineTime).getTime()

// Rule: Collection deadline must always be less than or equal to safe consumption window
assert.ok(deadlineTime <= safeTime, 'Collection deadline must be <= safe-until freshness window')
console.log('  ✔ Freshness and Collection deadlines are distinct and respect validation logic.\n')

// -------------------------------------------------------------
// Test 5: Real Volunteer Live GPS Broadcasting & Persistence
// -------------------------------------------------------------
console.log('Test 5: Live Volunteer GPS Telemetry Broadcast')
// First claim the donation by volunteer
const claimResult = donationStore.claimDonation(donationModeA.id, {
  id: 'vol_vikram_01',
  name: 'Vikram Sharma',
  phone: '9845099887',
  vehicle: 'Honda Activa',
  role: 'individual',
})
assert.strictEqual(claimResult.success, true, 'Volunteer claim must succeed')

// Broadcast real GPS coordinate update
const broadcastCoords = { latitude: 12.9750, longitude: 77.6200 }
const locUpdateResult = donationStore.updateVolunteerLocation(
  donationModeA.id,
  'vol_vikram_01',
  broadcastCoords
)
assert.strictEqual(locUpdateResult.success, true)
assert.strictEqual(locUpdateResult.donation.claim.isBroadcastingGps, true, 'isBroadcastingGps must be set to true')
assert.strictEqual(locUpdateResult.donation.claim.volunteerCoordinates.latitude, 12.9750)
assert.strictEqual(locUpdateResult.donation.claim.volunteerCoordinates.longitude, 77.6200)

// Unauthorized volunteer attempt should fail
const unauthorizedUpdate = donationStore.updateVolunteerLocation(
  donationModeA.id,
  'unauthorized_vol_999',
  broadcastCoords
)
assert.strictEqual(unauthorizedUpdate.success, false)
assert.match(unauthorizedUpdate.error, /Unauthorized/)
console.log('  ✔ Genuine GPS broadcast updates coordinate telemetry securely.\n')

// -------------------------------------------------------------
// Test 6: Persistent Handover OTP & Secure Gate
// -------------------------------------------------------------
console.log('Test 6: Handover OTP Persistence & Verification Gate')
const otp = donationModeA.handoverOtp
assert.ok(otp && otp.length === 6, 'Handover OTP must be a persistent 6-digit code')

// Prohibit marking collected directly
const directCollectedResult = donationStore.updatePickupStatus(
  donationModeA.id,
  'collected',
  'vol_vikram_01'
)
assert.strictEqual(directCollectedResult.success, false)
assert.match(directCollectedResult.error, /Handover OTP must be verified/)

// Advance safely through workflow
donationStore.updatePickupStatus(donationModeA.id, 'en_route_pickup', 'vol_vikram_01')
donationStore.updatePickupStatus(donationModeA.id, 'arrived_pickup', 'vol_vikram_01')

// Try incorrect OTP
const wrongOtpResult = donationStore.verifyHandoverOtp(donationModeA.id, '000000', 'vol_vikram_01')
assert.strictEqual(wrongOtpResult.success, false)

// Verify with correct OTP
const correctOtpResult = donationStore.verifyHandoverOtp(donationModeA.id, otp, 'vol_vikram_01')
assert.strictEqual(correctOtpResult.success, true)
assert.strictEqual(correctOtpResult.donation.status, 'collected')
assert.ok(correctOtpResult.donation.handoverVerifiedAt, 'handoverVerifiedAt timestamp recorded')
console.log('  ✔ Persistent Handover OTP and verification gate verified.\n')

console.log('=== ALL 6 FUNCTIONALITY FIXES TEST SCENARIOS PASSED SUCCESSFULLY ===\n')
