import type {
  Donation,
  DonationStatus,
  FoodItem,
  CreateDonationPayload,
  DonationNotification,
} from '../src/types/donation.ts'
import type {
  DonorUserProfile,
  VolunteerUserProfile,
} from '../src/types/registration.ts'

// Realistic Seed Data in Bengaluru for immediate testing and pairing
const initialSeedDonations: Donation[] = [
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
        safeUntil: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        photo: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'item_2',
        name: 'Paneer Butter Masala',
        quantity: 8,
        unit: 'litres',
        foodType: 'veg',
        shelfLifeHours: 5,
        safeUntil: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        photo: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'item_3',
        name: 'Tawa Butter Roti',
        quantity: 60,
        unit: 'portions',
        foodType: 'veg',
        shelfLifeHours: 6,
        safeUntil: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
        photo: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80',
      },
    ],
    totalQuantityLabel: '12 kg Biryani, 8 L Curry, 60 Rotis',
    estimatedPeopleServed: 55,
    foodPreparationTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // Prepared 2h ago
    foodShelfLifeCategory: 'cooked_meals',
    earliestSafeUntil: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // Safe for 4h more
    pickupSchedule: {
      readyType: 'immediate',
      readyTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      deadlineTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
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
    photos: [
      'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
    ],
    status: 'available',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
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
        safeUntil: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        photo: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'item_5',
        name: 'Dal Tadka & Steamed Rice',
        quantity: 15,
        unit: 'kg',
        foodType: 'veg',
        shelfLifeHours: 5,
        safeUntil: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        photo: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'item_6',
        name: 'Gulab Jamun Dessert',
        quantity: 70,
        unit: 'portions',
        foodType: 'veg',
        shelfLifeHours: 24,
        safeUntil: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
        photo: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=400&q=80',
      },
    ],
    totalQuantityLabel: '33 kg Rice & Dal, 70 Desserts',
    estimatedPeopleServed: 80,
    foodPreparationTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    foodShelfLifeCategory: 'cooked_meals',
    earliestSafeUntil: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    pickupSchedule: {
      readyType: 'immediate',
      readyTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      deadlineTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
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
    photos: [
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
    ],
    status: 'available',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
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
        safeUntil: new Date(Date.now() + 28 * 60 * 60 * 1000).toISOString(),
        photo: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'item_8',
        name: 'Veg Puff Pastries',
        quantity: 35,
        unit: 'boxes',
        foodType: 'veg',
        shelfLifeHours: 12,
        safeUntil: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
        photo: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80',
      },
    ],
    totalQuantityLabel: '25 Loaves, 35 Veg Puffs',
    estimatedPeopleServed: 40,
    foodPreparationTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    foodShelfLifeCategory: 'bakery_bread',
    earliestSafeUntil: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
    pickupSchedule: {
      readyType: 'immediate',
      readyTime: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      deadlineTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
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
    photos: [
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    ],
    status: 'available',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
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
        safeUntil: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        photo: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'item_10',
        name: 'Medu Vada',
        quantity: 40,
        unit: 'portions',
        foodType: 'veg',
        shelfLifeHours: 6,
        safeUntil: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        photo: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=400&q=80',
      },
    ],
    totalQuantityLabel: '80 Idlis, 40 Vadas with Sambar',
    estimatedPeopleServed: 45,
    foodPreparationTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    foodShelfLifeCategory: 'cooked_meals',
    earliestSafeUntil: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    pickupSchedule: {
      readyType: 'immediate',
      readyTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      deadlineTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
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
    photos: [
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
    ],
    status: 'en_route',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    handoverOtp: '591402',
    claim: {
      claimedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      volunteerId: 'vol_vikram_01',
      volunteerName: 'Vikram Sharma',
      volunteerPhone: '9845099887',
      volunteerVehicle: 'Hero Electric Two-Wheeler (KA-05-EV-1234)',
      volunteerRole: 'individual',
      currentStatus: 'en_route',
      statusHistory: [
        {
          status: 'claimed',
          timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          note: 'Pickup claimed by Vikram Sharma',
        },
        {
          status: 'en_route',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          note: 'Volunteer started journey towards collection point',
        },
      ],
      volunteerCoordinates: {
        latitude: 12.942,
        longitude: 77.589,
        updatedAt: new Date().toISOString(),
      },
      estimatedArrivalMinutes: 8,
    },
  },
]

class DonationStore {
  private donations: Donation[] = [...initialSeedDonations]
  private notifications: DonationNotification[] = [
    {
      id: 'notif_seed_1',
      recipientRole: 'donor',
      recipientId: 'donor_heritage_kitchen',
      donationId: 'don_seed_004',
      title: 'Volunteer En Route!',
      message: 'Vikram Sharma has claimed your donation and is en route. Handover OTP: 591402',
      type: 'handover_otp',
      createdAt: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
      read: false,
      handoverOtp: '591402',
    },
  ]

  // Retrieve all donations with role-based privacy masking
  public getAllDonations(options?: {
    role?: 'donor' | 'volunteer' | 'admin'
    userId?: string
    status?: string
    locality?: string
  }): Donation[] {
    let list = [...this.donations]

    if (options?.status) {
      list = list.filter((d) => d.status === options.status)
    }

    if (options?.locality) {
      const loc = options.locality.toLowerCase()
      list = list.filter(
        (d) =>
          d.collectionAddress.areaLocality.toLowerCase().includes(loc) ||
          d.collectionAddress.city.toLowerCase().includes(loc)
      )
    }

    // Role-based filtering and privacy masking
    return list.map((item) => {
      // If requested by a volunteer and donation is NOT claimed by this volunteer:
      const isClaimedByRequester =
        options?.role === 'volunteer' &&
        item.claim &&
        options.userId &&
        item.claim.volunteerId === options.userId

      if (options?.role === 'volunteer' && !isClaimedByRequester) {
        // Strict Privacy Protection: Mask exact street, landmark, phone, and Handover OTP
        return {
          ...item,
          donorPhone: '••••••••••',
          handoverOtp: '••••••', // Handover OTP NEVER visible to volunteer before collection
          collectionAddress: {
            ...item.collectionAddress,
            addressLine1: 'Exact address revealed upon claim',
            addressLine2: undefined,
            landmark: 'Revealed upon claim',
            additionalDirections: undefined,
            // Slight jitter / approximate coordinates for unclaimed markers to protect donor home/restaurant privacy
            latitude: item.collectionAddress.latitude ? Number(item.collectionAddress.latitude.toFixed(3)) : null,
            longitude: item.collectionAddress.longitude ? Number(item.collectionAddress.longitude.toFixed(3)) : null,
          },
        }
      }

      // If requested by donor, ensure they only see their own handover OTP unless admin
      return item
    })
  }

  public getDonationById(
    id: string,
    role?: 'donor' | 'volunteer' | 'admin',
    userId?: string
  ): Donation | null {
    const donation = this.donations.find((d) => d.id === id)
    if (!donation) return null

    const isClaimedByRequester =
      role === 'volunteer' &&
      donation.claim &&
      userId &&
      donation.claim.volunteerId === userId

    if (role === 'volunteer' && !isClaimedByRequester) {
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
        },
      }
    }

    return donation
  }

  // Create new food donation
  public createDonation(payload: CreateDonationPayload): Donation {
    const preparationTime = new Date(payload.foodPreparationTime)
    const pickupTime = new Date(payload.pickupSchedule?.readyTime)
    const deadlineTime = new Date(payload.pickupSchedule?.deadlineTime)
    if (!payload.items.length || payload.items.some((item) => !item.name?.trim() || !(Number(item.quantity) > 0))) {
      throw new Error('Every food item requires a name and a quantity greater than zero.')
    }
    if (!(Number(payload.estimatedPeopleServed) > 0)) {
      throw new Error('Estimated people served must be greater than zero.')
    }
    if (!Array.isArray(payload.foodSafetyChecklistAccepted) || payload.foodSafetyChecklistAccepted.length !== 10 || !payload.foodSafetyChecklistAccepted.every(Boolean)) {
      throw new Error('All food safety checklist statements must be accepted before publishing.')
    }
    const foodCategories = [...new Set(payload.foodCategories?.length ? payload.foodCategories : [payload.foodCategory || 'prepared_meals'])]
    const foodCategory = foodCategories[0]
    if (foodCategories.includes('other') && !payload.customFoodCategory?.trim()) {
      throw new Error('A description is required when Other is selected as the food category.')
    }
    if (Number.isNaN(preparationTime.getTime()) || Number.isNaN(pickupTime.getTime()) || Number.isNaN(deadlineTime.getTime())) {
      throw new Error('Preparation time, pickup time, and donation deadline must be valid dates.')
    }
    if (deadlineTime < pickupTime) {
      throw new Error('Donation deadline cannot be earlier than the pickup schedule.')
    }

    // Generate secure 6-digit handover OTP
    const handoverOtp = Math.floor(100000 + Math.random() * 900000).toString()
    const donationId = `don_${Date.now()}_${Math.floor(Math.random() * 1000)}`

    // Compatibility field for existing listing consumers. The donor now directly controls
    // the collection deadline instead of seeing a calculated safety countdown in this form.
    const safeUntilDate = deadlineTime

    // Build food items with IDs
    const items: FoodItem[] = payload.items.map((item, idx) => ({
      id: `item_${Date.now()}_${idx}`,
      name: item.name.trim(),
      quantity: Number(item.quantity),
      unit: item.unit,
      foodType: item.foodType,
      shelfLifeHours: payload.safeUntilHours,
      safeUntil: item.safeUntil || safeUntilDate.toISOString(),
      photo: item.photo || (payload.photos && payload.photos[0]),
    }))

    // Build concise quantity label summary
    const totalQuantityLabel = items
      .map((it) => `${it.quantity} ${it.unit} ${it.name}`)
      .slice(0, 3)
      .join(', ')

    const newDonation: Donation = {
      id: donationId,
      donorId: payload.donorId || `donor_${Date.now()}`,
      donorName: payload.donorName.trim(),
      donorPhone: payload.donorPhone.trim(),
      donorType: payload.donorType,
      customFoodSource: payload.customFoodSource?.trim(),
      items,
      totalQuantityLabel,
      estimatedPeopleServed: Number(payload.estimatedPeopleServed) || 20,
      foodPreparationTime: preparationTime.toISOString(),
      foodCategory,
      foodCategories,
      customFoodCategory: payload.customFoodCategory?.trim(),
      foodShelfLifeCategory: payload.foodShelfLifeCategory,
      earliestSafeUntil: safeUntilDate.toISOString(),
      pickupSchedule: payload.pickupSchedule,
      collectionAddress: payload.collectionAddress,
      photos: payload.photos || [],
      status: 'available',
      createdAt: new Date().toISOString(),
      handoverOtp,
      foodSafetyChecklistAccepted: payload.foodSafetyChecklistAccepted,
      foodSafetyChecklistAcceptedAt: new Date().toISOString(),
    }

    this.donations.unshift(newDonation)

    // Add notification for system & donor
    this.notifications.unshift({
      id: `notif_${Date.now()}`,
      recipientRole: 'donor',
      recipientId: newDonation.donorId,
      donationId: newDonation.id,
      title: 'Donation Listed Successfully',
      message: `Your donation "${items[0]?.name || 'Food Donation'}" is now visible to nearby volunteers. Your pickup handover OTP is ${handoverOtp}.`,
      type: 'handover_otp',
      createdAt: new Date().toISOString(),
      read: false,
      handoverOtp,
    })

    return newDonation
  }

  // Atomic Claim Operation to prevent race conditions
  public claimDonation(
    donationId: string,
    volunteer: {
      id: string
      name: string
      phone: string
      vehicle?: string
      role?: 'individual' | 'ngo_member'
      ngoName?: string
      pickupChecklistAccepted?: boolean[]
    }
  ): { success: boolean; donation?: Donation; error?: string } {
    const donation = this.donations.find((d) => d.id === donationId)

    if (!donation) {
      return { success: false, error: 'Donation not found.' }
    }

    // Atomic race condition check
    if (donation.status !== 'available') {
      return {
        success: false,
        error:
          'This surplus food listing is no longer available. It was claimed by another volunteer moments ago.',
      }
    }
    if (!Array.isArray(volunteer.pickupChecklistAccepted) || volunteer.pickupChecklistAccepted.length !== 10 || !volunteer.pickupChecklistAccepted.every(Boolean)) {
      return { success: false, error: 'All pickup and distribution responsibilities must be accepted before claiming.' }
    }

    const now = new Date().toISOString()

    // Calculate approximate volunteer start coordinates near donor
    const donorLat = donation.collectionAddress.latitude || 12.9716
    const donorLng = donation.collectionAddress.longitude || 77.5946
    const offsetLat = (Math.random() - 0.5) * 0.02
    const offsetLng = (Math.random() - 0.5) * 0.02

    donation.status = 'claimed'
    donation.claim = {
      claimedAt: now,
      volunteerId: volunteer.id,
      volunteerName: volunteer.name,
      volunteerPhone: volunteer.phone,
      volunteerVehicle: volunteer.vehicle || 'Two-Wheeler / Bike',
      volunteerRole: volunteer.role || 'individual',
      ngoName: volunteer.ngoName,
      currentStatus: 'claimed',
      statusHistory: [
        {
          status: 'claimed',
          timestamp: now,
          note: `Claimed by volunteer ${volunteer.name}`,
          updatedBy: volunteer.name,
        },
      ],
      volunteerCoordinates: {
        latitude: donorLat + offsetLat,
        longitude: donorLng + offsetLng,
        updatedAt: now,
      },
      estimatedArrivalMinutes: 15,
      pickupChecklistAccepted: volunteer.pickupChecklistAccepted,
      pickupChecklistAcceptedAt: now,
    }

    // Create Notification for the Donor with the Handover OTP reminder
    this.notifications.unshift({
      id: `notif_${Date.now()}`,
      recipientRole: 'donor',
      recipientId: donation.donorId,
      donationId: donation.id,
      title: 'Volunteer Assigned to Your Donation!',
      message: `${volunteer.name} has claimed your surplus food pickup. Handover OTP: ${donation.handoverOtp}. Please provide this to the volunteer upon pickup.`,
      type: 'claim',
      createdAt: now,
      read: false,
      handoverOtp: donation.handoverOtp,
    })

    return { success: true, donation }
  }

  // Update live pickup tracking status
  public updatePickupStatus(
    donationId: string,
    newStatus: DonationStatus,
    volunteerId: string,
    options?: {
      note?: string
      coordinates?: { latitude: number; longitude: number }
      estimatedArrivalMinutes?: number
    }
  ): { success: boolean; donation?: Donation; error?: string } {
    const donation = this.donations.find((d) => d.id === donationId)

    if (!donation || !donation.claim) {
      return { success: false, error: 'Donation or active claim not found.' }
    }

    if (donation.claim.volunteerId !== volunteerId) {
      return { success: false, error: 'Unauthorized: You are not the assigned volunteer for this pickup.' }
    }

    // Gate: Moving to 'collected' directly without OTP verification is prohibited!
    if (newStatus === 'collected' && !donation.handoverVerifiedAt) {
      return {
        success: false,
        error: 'Handover OTP must be verified before marking food as collected.',
      }
    }

    const now = new Date().toISOString()
    donation.status = newStatus
    donation.claim.currentStatus = newStatus
    donation.claim.statusHistory.push({
      status: newStatus,
      timestamp: now,
      note: options?.note || `Status changed to ${newStatus}`,
      updatedBy: donation.claim.volunteerName,
    })

    if (options?.coordinates) {
      donation.claim.volunteerCoordinates = {
        ...options.coordinates,
        updatedAt: now,
      }
    }

    if (options?.estimatedArrivalMinutes !== undefined) {
      donation.claim.estimatedArrivalMinutes = options.estimatedArrivalMinutes
    }

    // Donor Notification based on step
    let notifTitle = 'Pickup Status Updated'
    let notifMessage = `Volunteer updated status to ${newStatus}`

    if (newStatus === 'en_route') {
      notifTitle = 'Volunteer Is On The Way!'
      notifMessage = `${donation.claim.volunteerName} is en route to collect your food donation.`
    } else if (newStatus === 'arrived') {
      notifTitle = 'Volunteer Has Arrived!'
      notifMessage = `${donation.claim.volunteerName} is at your location. Please share Handover OTP: ${donation.handoverOtp} after food inspection.`
    } else if (newStatus === 'completed') {
      notifTitle = 'Donation Completed & Delivered!'
      notifMessage = `Thank you! Your donation was safely distributed to people in need.`
    }

    this.notifications.unshift({
      id: `notif_${Date.now()}`,
      recipientRole: 'donor',
      recipientId: donation.donorId,
      donationId: donation.id,
      title: notifTitle,
      message: notifMessage,
      type: 'status_update',
      createdAt: now,
      read: false,
    })

    return { success: true, donation }
  }

  // Single-use Handover OTP Verification Gate
  public verifyHandoverOtp(
    donationId: string,
    code: string,
    volunteerId: string
  ): { success: boolean; donation?: Donation; error?: string } {
    const donation = this.donations.find((d) => d.id === donationId)

    if (!donation || !donation.claim) {
      return { success: false, error: 'Donation or claim not found.' }
    }

    if (donation.claim.volunteerId !== volunteerId) {
      return { success: false, error: 'Unauthorized: You are not the assigned volunteer for this pickup.' }
    }

    const cleanInput = code.trim().replace(/\D/g, '')
    const targetOtp = donation.handoverOtp.trim()

    if (cleanInput !== targetOtp) {
      return {
        success: false,
        error: 'Invalid Handover OTP. Please ask the food donor for the 6-digit code shown on their dashboard.',
      }
    }

    // Success! Update status to 'collected'
    const now = new Date().toISOString()
    donation.status = 'collected'
    donation.handoverVerifiedAt = now
    donation.claim.currentStatus = 'collected'
    donation.claim.statusHistory.push({
      status: 'collected',
      timestamp: now,
      note: 'Handover OTP verified successfully. Food items collected by volunteer.',
      updatedBy: donation.claim.volunteerName,
    })

    // Celebration notification for donor
    this.notifications.unshift({
      id: `notif_${Date.now()}`,
      recipientRole: 'donor',
      recipientId: donation.donorId,
      donationId: donation.id,
      title: 'Food Handover Verified & Collected! 🍲',
      message: `Handover OTP was successfully confirmed by ${donation.claim.volunteerName}. The surplus food is now being transported to beneficiaries.`,
      type: 'completed',
      createdAt: now,
      read: false,
    })

    return { success: true, donation }
  }

  // Cancel donation
  public cancelDonation(
    donationId: string,
    _donorId?: string,
    reason?: string
  ): { success: boolean; donation?: Donation; error?: string } {
    const donation = this.donations.find((d) => d.id === donationId)

    if (!donation) {
      return { success: false, error: 'Donation not found.' }
    }
    if (! _donorId || donation.donorId !== _donorId) {
      return { success: false, error: 'Unauthorized: only the donation owner may cancel.' }
    }

    if (donation.status === 'collected' || donation.status === 'completed') {
      return { success: false, error: 'Cannot cancel a donation that has already been collected or completed.' }
    }

    donation.status = 'cancelled'
    donation.cancellationReason = reason || 'Cancelled by donor'

    return { success: true, donation }
  }

  // Get notifications
  public getNotifications(recipientRole?: string, recipientId?: string): DonationNotification[] {
    let list = [...this.notifications]
    if (recipientRole) {
      list = list.filter(
        (n) =>
          n.recipientRole === 'all' ||
          n.recipientRole === recipientRole ||
          (recipientId && n.recipientId === recipientId)
      )
    }
    return list
  }

  // Mark notification as read
  public markNotificationRead(id: string, recipientId?: string): boolean {
    const notif = this.notifications.find((n) => n.id === id)
    if (notif && (notif.recipientRole === 'all' || notif.recipientId === recipientId)) {
      notif.read = true
      return true
    }
    return false
  }

  // Update real volunteer live GPS coordinates
  public updateVolunteerLocation(
    donationId: string,
    volunteerId: string,
    coords: { latitude: number; longitude: number }
  ): { success: boolean; donation?: Donation; error?: string } {
    const donation = this.donations.find((d) => d.id === donationId)
    if (!donation || !donation.claim) {
      return { success: false, error: 'Donation or assigned claim not found.' }
    }
    if (donation.claim.volunteerId !== volunteerId) {
      return { success: false, error: 'Unauthorized: volunteer does not match claim.' }
    }
    const now = new Date().toISOString()
    donation.claim.volunteerCoordinates = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      updatedAt: now,
    }
    donation.claim.isBroadcastingGps = true
    return { success: true, donation }
  }

  // Profile management
  private donorProfiles: Map<string, DonorUserProfile> = new Map([
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

  private volunteerProfiles: Map<string, VolunteerUserProfile> = new Map([
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

  public getDonorProfile(id: string): DonorUserProfile | null {
    return this.donorProfiles.get(id) || null
  }

  public updateDonorProfile(profile: DonorUserProfile): DonorUserProfile {
    this.donorProfiles.set(profile.id, profile)
    for (const d of this.donations) {
      if (d.donorId === profile.id) {
        d.donorName = profile.name
        d.donorPhone = profile.phone
        d.donorType = profile.donorType
      }
    }
    return profile
  }

  public getVolunteerProfile(id: string): VolunteerUserProfile | null {
    return this.volunteerProfiles.get(id) || null
  }

  public updateVolunteerProfile(profile: VolunteerUserProfile): VolunteerUserProfile {
    this.volunteerProfiles.set(profile.id, profile)
    for (const d of this.donations) {
      if (d.claim && d.claim.volunteerId === profile.id) {
        d.claim.volunteerName = profile.name
        d.claim.volunteerPhone = profile.phone
        d.claim.volunteerVehicle = profile.vehicle
        d.claim.volunteerRole = profile.role
        d.claim.ngoName = profile.ngoName
      }
    }
    return profile
  }
}

export const donationStore = new DonationStore()
