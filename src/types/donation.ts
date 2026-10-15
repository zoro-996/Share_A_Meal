import type { FoodSourceType, DonorCollectionAddress } from './registration.ts'

export type FoodItemUnit = 'kg' | 'packets' | 'boxes' | 'portions' | 'litres' | 'containers'
export type FoodCategoryType = 'veg' | 'non_veg' | 'vegan'

export interface FoodItem {
  id: string
  name: string
  quantity: number
  unit: FoodItemUnit
  foodType: FoodCategoryType
  shelfLifeHours?: number
  safeUntil?: string
  photo?: string
}

export type DonationStatus = 
  | 'available' 
  | 'claimed' 
  | 'en_route' 
  | 'arrived' 
  | 'collected' 
  | 'completed' 
  | 'expired' 
  | 'cancelled'

export interface StatusHistoryEntry {
  status: DonationStatus
  timestamp: string
  note?: string
  updatedBy?: string
}

export interface DonationClaim {
  claimedAt: string
  volunteerId: string
  volunteerName: string
  volunteerPhone: string
  volunteerVehicle?: string
  volunteerRole?: 'individual' | 'ngo_member'
  ngoName?: string
  currentStatus: DonationStatus
  statusHistory: StatusHistoryEntry[]
  volunteerCoordinates?: {
    latitude: number
    longitude: number
    updatedAt: string
  }
  lastLocationUpdate?: string
  isBroadcastingGps?: boolean
  estimatedArrivalMinutes?: number
}

export interface PickupSchedule {
  readyType: 'immediate' | 'scheduled'
  readyTime: string
  deadlineTime: string
  pickupInstructions?: string
}

export interface Donation {
  id: string
  donorId: string
  donorName: string
  donorPhone: string
  donorType: FoodSourceType
  customFoodSource?: string
  items: FoodItem[]
  totalQuantityLabel: string
  estimatedPeopleServed: number
  foodPreparationTime: string
  foodShelfLifeCategory: 'cooked_meals' | 'bakery_bread' | 'fresh_produce' | 'packaged_dry'
  earliestSafeUntil: string
  pickupSchedule: PickupSchedule
  collectionAddress: DonorCollectionAddress
  photos: string[]
  status: DonationStatus
  createdAt: string
  handoverOtp: string // 6-digit code for physical verification upon collection
  handoverVerifiedAt?: string
  claim?: DonationClaim
  cancellationReason?: string
}

export interface DonationNotification {
  id: string
  recipientRole: 'donor' | 'volunteer' | 'all'
  recipientId?: string
  donationId: string
  title: string
  message: string
  type: 'claim' | 'status_update' | 'handover_otp' | 'completed' | 'alert'
  createdAt: string
  read: boolean
  handoverOtp?: string
}

export interface CreateDonationPayload {
  donorId?: string
  donorName: string
  donorPhone: string
  donorType: FoodSourceType
  customFoodSource?: string
  items: Array<{
    name: string
    quantity: number
    unit: FoodItemUnit
    foodType: FoodCategoryType
    photo?: string
    safeUntil?: string
  }>
  estimatedPeopleServed: number
  foodPreparationTime: string
  foodShelfLifeCategory: 'cooked_meals' | 'bakery_bread' | 'fresh_produce' | 'packaged_dry'
  safeUntilHours: number
  pickupSchedule: PickupSchedule
  collectionAddress: DonorCollectionAddress
  photos?: string[]
}
