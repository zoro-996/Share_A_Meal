import React, { useState, useEffect } from 'react'
import {
  ArrowLeft,
  UtensilsCrossed,
  Plus,
  Trash2,
  Clock,
  MapPin,
  Camera,
  CheckCircle2,
  AlertCircle,
  Users,
  ShieldCheck,
  Calendar,
  Sparkles,
  Info,
  Navigation,
} from 'lucide-react'
import { CollectionLocationMap } from './CollectionLocationMap'
import { createDonation, getCurrentDonor } from '../../services/donationService'
import { getDeviceCoordinates, reverseGeocodeCoordinates } from '../../services/geocodingService'
import type { FoodItemUnit, FoodCategoryType } from '../../types/donation'
import type { DonorCollectionAddress } from '../../types/registration'

interface DonateNowFormProps {
  onBack: () => void
  onSuccess: (donationId: string, handoverOtp: string) => void
}

interface ItemRow {
  id: string
  name: string
  quantity: string
  unit: FoodItemUnit
  foodType: FoodCategoryType
  photo?: string
}

const SAMPLE_PHOTO_PRESETS = [
  {
    label: 'Veg Biryani & Curry',
    url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Dal, Rice & Rotis',
    url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Bakery Loaves & Pastries',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
  },
]

export const DonateNowForm: React.FC<DonateNowFormProps> = ({ onBack, onSuccess }) => {
  const donorProfile = getCurrentDonor()

  // 1. Food Photos State
  const [photoUploadMode, setPhotoUploadMode] = useState<'combined' | 'per_item'>('combined')
  const [photoUrl, setPhotoUrl] = useState<string>(SAMPLE_PHOTO_PRESETS[0].url)
  const [customPhotoSelected, setCustomPhotoSelected] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)

  // 2. Dynamic Food Items (Pre-rendered 3 initial rows as required)
  const [foodItems, setFoodItems] = useState<ItemRow[]>([
    { id: '1', name: '', quantity: '', unit: 'kg', foodType: 'veg' },
    { id: '2', name: '', quantity: '', unit: 'portions', foodType: 'veg' },
    { id: '3', name: '', quantity: '', unit: 'boxes', foodType: 'veg' },
  ])

  // 3. Estimated People Served
  const [peopleServed, setPeopleServed] = useState<number>(30)

  // 4. Food Preparation Time & Freshness Calculation
  const [shelfCategory, setShelfCategory] = useState<
    'cooked_meals' | 'bakery_bread' | 'fresh_produce' | 'packaged_dry'
  >('cooked_meals')

  const [currentTime, setCurrentTime] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 15000)
    return () => clearInterval(timer)
  }, [])

  const [prepTime, setPrepTime] = useState<string>(() =>
    new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString().slice(0, 16)
  )

  // 5. Pickup Scheduling & Instructions
  const [readyType, setReadyType] = useState<'immediate' | 'scheduled'>('immediate')
  const [pickupDeadline, setPickupDeadline] = useState<string>(() =>
    new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 16)
  )
  const [pickupInstructions, setPickupInstructions] = useState<string>(
    'Please bring clean insulated containers or carry crates. Call upon reaching the gate.'
  )

  // 6. Collection Address & Draggable Map Pin
  const [addressLine1, setAddressLine1] = useState(donorProfile.collectionAddress.addressLine1)
  const [areaLocality, setAreaLocality] = useState(donorProfile.collectionAddress.areaLocality)
  const [city, setCity] = useState(donorProfile.collectionAddress.city)
  const [state, setState] = useState(donorProfile.collectionAddress.state)
  const [pincode, setPincode] = useState(donorProfile.collectionAddress.pincode)
  const [landmark, setLandmark] = useState(donorProfile.collectionAddress.landmark || '')
  const [latitude, setLatitude] = useState<number | null>(
    donorProfile.collectionAddress.latitude || 12.9784
  )
  const [longitude, setLongitude] = useState<number | null>(
    donorProfile.collectionAddress.longitude || 77.6408
  )
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [locationNotice, setLocationNotice] = useState<string | null>(null)

  // 7. Safety Declaration & Submission
  const [safetyCertified, setSafetyCertified] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Category Shelf Life Hours mapping
  const categoryHours: Record<string, number> = {
    cooked_meals: 5,
    bakery_bread: 24,
    fresh_produce: 48,
    packaged_dry: 168,
  }

  const shelfLifeHours = categoryHours[shelfCategory]
  const prepDate = new Date(prepTime)
  const safeUntilDate = new Date(prepDate.getTime() + shelfLifeHours * 60 * 60 * 1000)
  const remainingMinutes = Math.max(
    0,
    Math.round((safeUntilDate.getTime() - currentTime) / (1000 * 60))
  )
  const remainingHours = Math.floor(remainingMinutes / 60)
  const remainingMins = remainingMinutes % 60

  // Quick fill helper for testing
  const handleQuickFillSample = () => {
    setFoodItems([
      {
        id: '1',
        name: 'Dum Veg Biryani with Raita',
        quantity: '15',
        unit: 'kg',
        foodType: 'veg',
        photo: SAMPLE_PHOTO_PRESETS[0].url,
      },
      {
        id: '2',
        name: 'Paneer Butter Masala',
        quantity: '8',
        unit: 'litres',
        foodType: 'veg',
        photo: SAMPLE_PHOTO_PRESETS[1].url,
      },
      {
        id: '3',
        name: 'Fresh Rumali Roti',
        quantity: '50',
        unit: 'portions',
        foodType: 'veg',
        photo: SAMPLE_PHOTO_PRESETS[2].url,
      },
    ])
    setPeopleServed(45)
    setSafetyCertified(true)
  }

  // Dynamic Item Row Management
  const handleItemChange = (id: string, field: keyof ItemRow, value: string) => {
    setFoodItems((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    )
    if (formErrors.items) {
      setFormErrors((prev) => ({ ...prev, items: '' }))
    }
  }

  const addFoodItemRow = () => {
    setFoodItems((prev) => [
      ...prev,
      {
        id: String(Date.now() + Math.random()),
        name: '',
        quantity: '',
        unit: 'kg',
        foodType: 'veg',
      },
    ])
  }

  const removeFoodItemRow = (id: string) => {
    if (foodItems.length <= 1) return
    setFoodItems((prev) => prev.filter((row) => row.id !== id))
  }

  // File validation helper
  const readFileAsDataUrl = (
    file: File,
    onSuccessCb: (dataUrl: string) => void,
    onErrorCb: (msg: string) => void
  ) => {
    if (!file.type.startsWith('image/')) {
      onErrorCb('Invalid file type. Please select an image (JPG, PNG, WEBP).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      onErrorCb('Image size exceeds 5MB limit. Please choose a smaller image.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onSuccessCb(reader.result)
      }
    }
    reader.onerror = () => onErrorCb('Failed to read selected image.')
    reader.readAsDataURL(file)
  }

  // Combined photo upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setPhotoError(null)
    if (file) {
      readFileAsDataUrl(
        file,
        (dataUrl) => {
          setCustomPhotoSelected(dataUrl)
          setPhotoUrl(dataUrl)
        },
        (err) => setPhotoError(err)
      )
    }
  }

  // Item-specific photo upload handler
  const handleItemPhotoUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      readFileAsDataUrl(
        file,
        (dataUrl) => {
          setFoodItems((prev) =>
            prev.map((row) => (row.id === id ? { ...row, photo: dataUrl } : row))
          )
        },
        (err) => alert(err)
      )
    }
  }

  // GPS Current Location Autofill
  const handleUseCurrentLocation = async () => {
    setIsDetectingLocation(true)
    setLocationNotice(null)
    try {
      const coords = await getDeviceCoordinates()
      setLatitude(coords.latitude)
      setLongitude(coords.longitude)
      const res = await reverseGeocodeCoordinates(coords.latitude, coords.longitude)
      if (res.addressLine1) setAddressLine1(res.addressLine1)
      if (res.areaLocality) setAreaLocality(res.areaLocality)
      if (res.city) setCity(res.city)
      if (res.state) setState(res.state)
      if (res.pincode) setPincode(res.pincode)
      if (res.landmark) setLandmark(res.landmark)
      setLocationNotice('Address updated from your device GPS!')
    } catch (err) {
      setLocationNotice(err instanceof Error ? err.message : 'Could not detect device GPS.')
    } finally {
      setIsDetectingLocation(false)
    }
  }

  // Map pin drag end handler
  const handleMapLocationChange = async (lat: number, lng: number) => {
    setLatitude(lat)
    setLongitude(lng)
    try {
      const res = await reverseGeocodeCoordinates(lat, lng)
      if (res.addressLine1) setAddressLine1(res.addressLine1)
      if (res.areaLocality) setAreaLocality(res.areaLocality)
      if (res.city) setCity(res.city)
      if (res.state) setState(res.state)
      if (res.pincode) setPincode(res.pincode)
      if (res.landmark) setLandmark(res.landmark)
    } catch {
      // ignore
    }
  }

  // Submission Validation & API Call
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    const errors: Record<string, string> = {}

    // Check items: At least one item with valid name and quantity > 0
    const validItems = foodItems.filter(
      (item) => item.name.trim() !== '' && Number(item.quantity) > 0
    )

    if (validItems.length === 0) {
      errors.items = 'Please specify at least one food item with a name and quantity.'
    }

    if (!peopleServed || peopleServed < 1) {
      errors.peopleServed = 'Please specify estimated number of people served.'
    }

    // Check collection deadline does not exceed food safe-until time
    const deadlineDate = new Date(pickupDeadline)
    if (deadlineDate.getTime() > safeUntilDate.getTime()) {
      errors.deadline =
        'Collection deadline cannot be later than the safe consumption expiry date (' +
        safeUntilDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
        ').'
    }

    if (!addressLine1.trim() || !areaLocality.trim()) {
      errors.address = 'Collection address line 1 and area are required.'
    }

    if (!safetyCertified) {
      errors.safety = 'Please certify that the surplus food meets safety and hygiene guidelines.'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setIsSubmitting(true)
    try {
      const collectionAddress: DonorCollectionAddress = {
        addressLine1: addressLine1.trim(),
        areaLocality: areaLocality.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        landmark: landmark.trim(),
        additionalDirections: pickupInstructions.trim(),
        latitude,
        longitude,
      }

      const submissionTimeIso = new Date().toISOString()
      const itemPhotos = validItems.map((it) => it.photo).filter(Boolean) as string[]
      const activePhotos =
        photoUploadMode === 'per_item' && itemPhotos.length > 0
          ? itemPhotos
          : [photoUrl]

      const newDonation = await createDonation({
        donorId: donorProfile.id,
        donorName: donorProfile.name,
        donorPhone: donorProfile.phone,
        donorType: donorProfile.donorType,
        items: validItems.map((it) => ({
          name: it.name.trim(),
          quantity: Number(it.quantity),
          unit: it.unit,
          foodType: it.foodType,
          photo: it.photo || photoUrl,
          safeUntil: safeUntilDate.toISOString(),
        })),
        estimatedPeopleServed: peopleServed,
        foodPreparationTime: new Date(prepTime).toISOString(),
        foodShelfLifeCategory: shelfCategory,
        safeUntilHours: shelfLifeHours,
        pickupSchedule: {
          readyType,
          readyTime: readyType === 'immediate' ? submissionTimeIso : prepDate.toISOString(),
          deadlineTime: new Date(pickupDeadline).toISOString(),
          pickupInstructions: pickupInstructions.trim(),
        },
        collectionAddress,
        photos: activePhotos,
      })

      onSuccess(newDonation.id, newDonation.handoverOtp)
    } catch (err) {
      setFormErrors({
        submit: err instanceof Error ? err.message : 'Failed to publish food donation.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#29352F] antialiased pb-20">
      {/* Top Sticky Form Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-[#E6EAE7]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B756F] hover:text-[#29352F] px-3 py-1.5 rounded-lg border border-[#E6EAE7] hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel & Back</span>
          </button>

          <div className="text-center">
            <h1 className="font-heading font-extrabold text-sm sm:text-base text-[#29352F]">
              Donate Surplus Food
            </h1>
            <p className="text-[11px] text-[#6B756F] hidden sm:block">
              Listing surplus meals for nearby volunteer collection
            </p>
          </div>

          {/* Quick Demo Pre-Fill Button */}
          <button
            type="button"
            onClick={handleQuickFillSample}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1B5E20] bg-[#E8F5E9] hover:bg-[#d8eedb] border border-[#C8E6C9] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            title="Auto-fill with sample food items for quick testing"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#2E7D32]" />
            <span className="hidden sm:inline">1-Click</span> Sample Fill
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
        {/* Error notification banner if any */}
        {formErrors.submit && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block">Submission Error:</strong>
              <span>{formErrors.submit}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          {/* ======================================================== */}
          {/* SECTION 1: FOOD PHOTOS (Option A vs Option B) */}
          {/* ======================================================== */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E6EAE7] shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#6B756F] flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-[#1B5E20]" />
                  1. Food Photos
                </h2>
                <p className="text-xs text-[#6B756F] mt-0.5">
                  Choose how you want to upload photos: one combined photo or per-item photos.
                </p>
              </div>

              {/* Mode Toggle: Option B (Combined) vs Option A (Per Item) */}
              <div className="flex items-center gap-1 bg-[#FAFAFA] p-1 rounded-xl border border-[#E6EAE7] self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setPhotoUploadMode('combined')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    photoUploadMode === 'combined'
                      ? 'bg-[#29352F] text-white shadow-2xs'
                      : 'text-[#6B756F] hover:text-[#29352F]'
                  }`}
                >
                  One Combined Photo
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoUploadMode('per_item')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    photoUploadMode === 'per_item'
                      ? 'bg-[#29352F] text-white shadow-2xs'
                      : 'text-[#6B756F] hover:text-[#29352F]'
                  }`}
                >
                  Photos Per Item
                </button>
              </div>
            </div>

            {photoError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{photoError}</span>
              </div>
            )}

            {photoUploadMode === 'combined' ? (
              /* Option B: Active photo preview */
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                <div className="w-full sm:w-44 h-36 rounded-xl overflow-hidden border border-[#E6EAE7] bg-neutral-100 relative group shrink-0 shadow-2xs">
                  <img
                    src={photoUrl}
                    alt="Food listing preview"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded font-medium backdrop-blur-2xs">
                    Combined Photo
                  </span>
                </div>

                <div className="w-full space-y-2.5">
                  <span className="text-xs font-semibold text-[#29352F] block">
                    Select a sample photo or upload your own (max 5MB):
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {SAMPLE_PHOTO_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setPhotoUrl(preset.url)
                          setCustomPhotoSelected(null)
                        }}
                        className={`p-2 rounded-xl border text-center text-xs font-medium transition-all cursor-pointer ${
                          photoUrl === preset.url
                            ? 'border-[#29352F] bg-[#FAFAFA] text-[#29352F] ring-1 ring-[#29352F]'
                            : 'border-[#E6EAE7] bg-white text-[#6B756F] hover:bg-neutral-50'
                        }`}
                      >
                        <span className="block truncate text-[11px]">{preset.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-1">
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-dashed border-[#29352F]/40 hover:border-[#29352F] bg-white text-xs font-semibold text-[#29352F] cursor-pointer transition-colors">
                      <Camera className="w-3.5 h-3.5 text-[#1B5E20]" />
                      <span>Upload Combined Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    {customPhotoSelected && (
                      <span className="text-[11px] text-[#1B5E20] font-medium ml-2">
                        ✓ Photo attached
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Option A: Notice */
              <div className="p-3.5 rounded-xl bg-[#EAF3FF] border border-[#BFDBFE] text-xs text-[#1E40AF] flex items-center gap-2.5">
                <Info className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Individual Photos Mode:</strong> You can upload a specific photo for each food item below in Section 2.
                </span>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* SECTION 2: DYNAMIC FOOD ITEMS (Initial 3 Rows) */}
          {/* ======================================================== */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E6EAE7] shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#6B756F] flex items-center gap-1.5">
                  <UtensilsCrossed className="w-4 h-4 text-[#1B5E20]" />
                  2. Food Items & Quantities <span className="text-red-500">*</span>
                </h2>
                <p className="text-xs text-[#6B756F] mt-0.5">
                  Itemize what you are donating. Every item will be clearly displayed to volunteers.
                </p>
              </div>

              <button
                type="button"
                onClick={addFoodItemRow}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#E8F5E9] hover:bg-[#d8eedb] text-[#1B5E20] text-xs font-bold border border-[#C8E6C9] transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            {formErrors.items && (
              <p role="alert" className="text-xs text-red-600 font-medium">
                {formErrors.items}
              </p>
            )}

            <div className="space-y-3">
              {foodItems.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-[#E6EAE7] bg-[#FAFAFA] flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 transition-all"
                >
                  <span className="text-xs font-bold text-[#6B756F] w-6 shrink-0 text-center hidden sm:block">
                    #{index + 1}
                  </span>

                  {/* Per-Item Photo Uploader if in Option A */}
                  {photoUploadMode === 'per_item' && (
                    <div className="w-12 h-10 rounded-lg overflow-hidden bg-neutral-200 border border-[#E6EAE7] relative shrink-0 flex items-center justify-center">
                      {item.photo ? (
                        <img
                          src={item.photo}
                          alt={item.name || 'Item'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <label className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-neutral-300 transition-colors">
                          <Camera className="w-4 h-4 text-[#6B756F]" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleItemPhotoUpload(item.id, e)}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  )}

                  {/* Food item name */}
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                      placeholder={
                        index === 0
                          ? 'e.g. Veg Biryani'
                          : index === 1
                          ? 'e.g. Dal Tadka / Curry'
                          : 'e.g. Roti / Bread'
                      }
                      className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-[#E6EAE7] bg-white text-[#29352F] placeholder-[#6B756F]/60 focus:outline-none focus:border-[#29352F]"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="w-full sm:w-24">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                      placeholder="Qty"
                      className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-[#E6EAE7] bg-white text-[#29352F] placeholder-[#6B756F]/60 focus:outline-none focus:border-[#29352F]"
                    />
                  </div>

                  {/* Unit */}
                  <div className="w-full sm:w-28">
                    <select
                      value={item.unit}
                      onChange={(e) =>
                        handleItemChange(item.id, 'unit', e.target.value as FoodItemUnit)
                      }
                      className="w-full px-2.5 py-2 text-xs font-medium rounded-lg border border-[#E6EAE7] bg-white text-[#29352F] focus:outline-none focus:border-[#29352F] cursor-pointer"
                    >
                      <option value="kg">kg</option>
                      <option value="portions">portions</option>
                      <option value="litres">litres</option>
                      <option value="boxes">boxes</option>
                      <option value="packets">packets</option>
                      <option value="containers">containers</option>
                    </select>
                  </div>

                  {/* Food Type */}
                  <div className="w-full sm:w-28">
                    <select
                      value={item.foodType}
                      onChange={(e) =>
                        handleItemChange(item.id, 'foodType', e.target.value as FoodCategoryType)
                      }
                      className="w-full px-2.5 py-2 text-xs font-medium rounded-lg border border-[#E6EAE7] bg-white text-[#29352F] focus:outline-none focus:border-[#29352F] cursor-pointer"
                    >
                      <option value="veg">Pure Veg</option>
                      <option value="vegan">Vegan</option>
                      <option value="non_veg">Non-Veg</option>
                    </select>
                  </div>

                  {/* Delete button (only if > 1 item) */}
                  {foodItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFoodItemRow(item.id)}
                      className="p-2 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-white transition-colors cursor-pointer self-end sm:self-center"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 3: ESTIMATED PEOPLE SERVED */}
          {/* ======================================================== */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E6EAE7] shadow-2xs space-y-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#6B756F] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#1B5E20]" />
                3. Estimated People Served <span className="text-red-500">*</span>
              </h2>
              <p className="text-xs text-[#6B756F] mt-0.5">
                Approximate number of beneficiaries or meals this donation can provide.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[10, 20, 35, 50, 80, 120].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setPeopleServed(count)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    peopleServed === count
                      ? 'bg-[#29352F] text-white border-[#29352F] shadow-2xs'
                      : 'bg-white text-[#29352F] border-[#E6EAE7] hover:bg-neutral-50'
                  }`}
                >
                  ~{count} people
                </button>
              ))}

              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-xs text-[#6B756F]">Custom:</span>
                <input
                  type="number"
                  min="1"
                  value={peopleServed}
                  onChange={(e) => setPeopleServed(Number(e.target.value))}
                  className="w-20 px-2.5 py-1.5 text-xs font-bold text-center rounded-lg border border-[#E6EAE7] bg-white text-[#29352F] focus:outline-none focus:border-[#29352F]"
                />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 4: FOOD PREPARATION & FRESHNESS CALCULATION */}
          {/* ======================================================== */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E6EAE7] shadow-2xs space-y-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#6B756F] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#1B5E20]" />
                4. Preparation Time & Food Safety Freshness <span className="text-red-500">*</span>
              </h2>
              <p className="text-xs text-[#6B756F] mt-0.5">
                Safe consumption deadlines are dynamically calculated based on standard hygiene standards.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-[#29352F] mb-1">
                  Food Category (Safe Shelf Life)
                </label>
                <select
                  value={shelfCategory}
                  onChange={(e) => setShelfCategory(e.target.value as any)}
                  className="w-full px-3 py-2.5 text-xs font-medium rounded-xl border border-[#E6EAE7] bg-white text-[#29352F] focus:outline-none focus:border-[#29352F] cursor-pointer"
                >
                  <option value="cooked_meals">Cooked Hot Meals (Safe for 5 hours)</option>
                  <option value="bakery_bread">Bakery & Breads (Safe for 24 hours)</option>
                  <option value="fresh_produce">Fresh Fruits & Raw Produce (Safe for 48 hours)</option>
                  <option value="packaged_dry">Packaged Dry Goods (Safe for 7 days)</option>
                </select>
              </div>

              {/* Preparation Time */}
              <div>
                <label className="block text-xs font-semibold text-[#29352F] mb-1">
                  Food Preparation Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-medium rounded-xl border border-[#E6EAE7] bg-white text-[#29352F] focus:outline-none focus:border-[#29352F]"
                />
              </div>
            </div>

            {/* Dynamic Freshness Banner */}
            <div className="p-4 rounded-xl bg-[#E8F5E9]/60 border border-[#C8E6C9] flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#1B5E20] shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-[#1B5E20] flex items-center gap-2">
                  <span>Safe for consumption until:</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-[#C8E6C9]">
                    {safeUntilDate.toLocaleDateString([], { month: 'short', day: 'numeric' })},{' '}
                    {safeUntilDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-[#29352F] mt-1">
                  Approximately <strong>{remainingHours}h {remainingMins}m</strong> safe consumption window remaining. Volunteers must collect and distribute the food before this deadline.
                </p>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 5: PICKUP SCHEDULING & INSTRUCTIONS */}
          {/* ======================================================== */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E6EAE7] shadow-2xs space-y-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#6B756F] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#1B5E20]" />
                5. Pickup Schedule & Volunteer Instructions <span className="text-red-500">*</span>
              </h2>
              <p className="text-xs text-[#6B756F] mt-0.5">
                Set when food is ready and specify the absolute collection deadline.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#29352F] mb-1">
                  Ready for Pickup
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReadyType('immediate')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      readyType === 'immediate'
                        ? 'bg-[#29352F] text-white border-[#29352F]'
                        : 'bg-white text-[#6B756F] border-[#E6EAE7]'
                    }`}
                  >
                    Immediately
                  </button>
                  <button
                    type="button"
                    onClick={() => setReadyType('scheduled')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      readyType === 'scheduled'
                        ? 'bg-[#29352F] text-white border-[#29352F]'
                        : 'bg-white text-[#6B756F] border-[#E6EAE7]'
                    }`}
                  >
                    Prepared At Time
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#29352F] mb-1">
                  Collection Deadline
                </label>
                <input
                  type="datetime-local"
                  value={pickupDeadline}
                  onChange={(e) => setPickupDeadline(e.target.value)}
                  className={`w-full px-3 py-2.5 text-xs font-medium rounded-xl border bg-white text-[#29352F] focus:outline-none ${
                    formErrors.deadline ? 'border-red-500 ring-1 ring-red-500' : 'border-[#E6EAE7] focus:border-[#29352F]'
                  }`}
                />
                {formErrors.deadline && (
                  <p role="alert" className="text-xs text-red-600 mt-1 font-medium">
                    {formErrors.deadline}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#29352F] mb-1">
                Pickup Notes & Directions for Volunteer
              </label>
              <textarea
                rows={2}
                value={pickupInstructions}
                onChange={(e) => setPickupInstructions(e.target.value)}
                placeholder="e.g. Please enter via the rear kitchen service gate. Bring insulated bags."
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-[#E6EAE7] bg-white text-[#29352F] placeholder-[#6B756F]/60 focus:outline-none focus:border-[#29352F]"
              />
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 6: COLLECTION ADDRESS & DRAGGABLE MAP */}
          {/* ======================================================== */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E6EAE7] shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#6B756F] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#1B5E20]" />
                  6. Food Collection Address & Map Pin <span className="text-red-500">*</span>
                </h2>
                <p className="text-xs text-[#6B756F] mt-0.5">
                  Pre-filled from your registered donor profile. Directly editable or auto-fillable with device GPS.
                </p>
              </div>

              {/* Use Current Device GPS button */}
              <button
                type="button"
                disabled={isDetectingLocation}
                onClick={handleUseCurrentLocation}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E8F5E9] hover:bg-[#d8eedb] text-[#1B5E20] border border-[#C8E6C9] text-xs font-bold transition-all cursor-pointer shadow-2xs self-start sm:self-auto"
                title="Detect device GPS coordinates and autofill address"
              >
                <Navigation className={`w-3.5 h-3.5 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                <span>{isDetectingLocation ? 'Detecting GPS...' : 'Use My Current Location'}</span>
              </button>
            </div>

            {locationNotice && (
              <div className="p-3 rounded-xl bg-[#E8F5E9] border border-[#C8E6C9] text-xs text-[#1B5E20] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{locationNotice}</span>
              </div>
            )}

            {formErrors.address && (
              <p role="alert" className="text-xs text-red-600 font-medium">
                {formErrors.address}
              </p>
            )}

            {/* Address fields: Directly editable, no lock */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#29352F] mb-1">
                  Address Line 1 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="Street / Building / Door No."
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-[#E6EAE7] bg-white text-[#29352F] focus:outline-none focus:border-[#29352F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#29352F] mb-1">
                  Area / Locality <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={areaLocality}
                  onChange={(e) => setAreaLocality(e.target.value)}
                  placeholder="Area / Neighborhood"
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-[#E6EAE7] bg-white text-[#29352F] focus:outline-none focus:border-[#29352F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#29352F] mb-1">
                  Landmark
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="Nearby Landmark"
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-[#E6EAE7] bg-white text-[#29352F] focus:outline-none focus:border-[#29352F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#29352F] mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-[#E6EAE7] bg-white text-[#29352F] focus:outline-none focus:border-[#29352F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#29352F] mb-1">
                  State / PIN
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-medium rounded-xl border border-[#E6EAE7] bg-white text-[#29352F] focus:outline-none focus:border-[#29352F]"
                  />
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="PIN Code"
                    className="w-24 px-3 py-2 text-xs font-medium rounded-xl border border-[#E6EAE7] bg-white text-[#29352F] focus:outline-none focus:border-[#29352F]"
                  />
                </div>
              </div>
            </div>

            {/* Embedded Draggable Leaflet Map */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-[#6B756F] block mb-1">
                Pinpoint exact collection door (drag pin to reposition):
              </span>
              <CollectionLocationMap
                latitude={latitude}
                longitude={longitude}
                onLocationChange={handleMapLocationChange}
              />
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 7: DONOR RESPONSIBILITY & SAFETY DECLARATION */}
          {/* ======================================================== */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E6EAE7] shadow-2xs space-y-4">
            <div className="flex items-start gap-3">
              <input
                id="safety-consent"
                type="checkbox"
                checked={safetyCertified}
                onChange={(e) => {
                  setSafetyCertified(e.target.checked)
                  if (formErrors.safety) setFormErrors((prev) => ({ ...prev, safety: '' }))
                }}
                className="mt-1 w-4 h-4 rounded text-[#1B5E20] border-[#E6EAE7] focus:ring-[#1B5E20] cursor-pointer"
              />
              <label
                htmlFor="safety-consent"
                className="text-xs text-[#29352F] leading-relaxed cursor-pointer select-none"
              >
                <strong className="block font-bold mb-0.5">
                  Food Safety & Verification Commitment:
                </strong>
                I certify that this surplus food was cooked or handled under hygienic conditions, is fit for consumption, and has been stored at safe temperatures. I agree to share the 6-digit Handover OTP with the volunteer in person only after they arrive and verify the items.
              </label>
            </div>
            {formErrors.safety && (
              <p role="alert" className="text-xs text-red-600 font-medium">
                {formErrors.safety}
              </p>
            )}

            <div className="p-3 rounded-xl bg-[#FFF0DB]/60 border border-[#FFE0B2] text-xs text-[#9A3412] flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Handover OTP Protocol:</strong> Upon publishing, you will receive a secure 6-digit Handover OTP. The volunteer must enter this code upon collection to confirm handover.
              </span>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-xl text-sm font-bold text-white bg-[#29352F] hover:bg-[#1B231F] disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Publishing Food Donation...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Publish Surplus Food Donation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
