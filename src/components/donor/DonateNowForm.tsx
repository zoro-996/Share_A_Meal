import React, { useState } from 'react'
import { AlertCircle, ArrowLeft, Calendar, Camera, CheckCircle2, Clock, MapPin, Navigation, Plus, ShieldCheck, Trash2, Users, UtensilsCrossed } from 'lucide-react'
import { CollectionLocationMap } from './CollectionLocationMap'
import { AccountabilityChecklist } from '../common/AccountabilityChecklist'
import { createDonation, getCurrentDonor } from '../../services/donationService'
import { getDeviceCoordinates, reverseGeocodeCoordinates } from '../../services/geocodingService'
import type { DonationFoodCategory, FoodItemUnit } from '../../types/donation'
import type { DonorCollectionAddress } from '../../types/registration'

interface DonateNowFormProps { onBack: () => void; onSuccess: (donationId: string, handoverOtp: string) => void }
interface ItemRow { id: string; name: string; quantity: string; unit: FoodItemUnit }

const toLocalInputValue = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
const FOOD_CATEGORIES: Array<{ value: DonationFoodCategory; label: string }> = [
  { value: 'prepared_meals', label: 'Prepared Meals' },
  { value: 'bakery_bread_items', label: 'Bakery & Bread Items' },
  { value: 'fruits', label: 'Fruits' },
  { value: 'vegetables', label: 'Vegetables' },
  { value: 'groceries', label: 'Groceries' },
  { value: 'other', label: 'Other' },
]

const shelfLifeCategoryFor = (categories: DonationFoodCategory[]) => {
  const category = categories[0] || 'prepared_meals'
  if (category === 'bakery_bread_items') return 'bakery_bread' as const
  if (category === 'fruits' || category === 'vegetables') return 'fresh_produce' as const
  if (category === 'groceries') return 'packaged_dry' as const
  return 'cooked_meals' as const
}

export const DonateNowForm: React.FC<DonateNowFormProps> = ({ onBack, onSuccess }) => {
  const donorProfile = getCurrentDonor()
  const initialTime = new Date()
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([])
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [selectedAddressOption, setSelectedAddressOption] = useState<'saved' | 'new'>('saved')
  const [foodItems, setFoodItems] = useState<ItemRow[]>([{ id: crypto.randomUUID(), name: '', quantity: '', unit: 'kg' }])
  const [peopleServed, setPeopleServed] = useState('')
  const [foodCategories, setFoodCategories] = useState<DonationFoodCategory[]>(['prepared_meals'])
  const [customFoodCategory, setCustomFoodCategory] = useState('')
  const [prepTime, setPrepTime] = useState(() => toLocalInputValue(initialTime))
  const [pickupTime, setPickupTime] = useState(() => toLocalInputValue(initialTime))
  const [pickupDeadline, setPickupDeadline] = useState(() => toLocalInputValue(new Date(initialTime.getTime() + 3 * 60 * 60 * 1000)))
  const [pickupInstructions, setPickupInstructions] = useState('')
  const [addressLine1, setAddressLine1] = useState(donorProfile.collectionAddress.addressLine1)
  const [areaLocality, setAreaLocality] = useState(donorProfile.collectionAddress.areaLocality)
  const [city, setCity] = useState(donorProfile.collectionAddress.city)
  const [state, setState] = useState(donorProfile.collectionAddress.state)
  const [pincode, setPincode] = useState(donorProfile.collectionAddress.pincode)
  const [landmark, setLandmark] = useState(donorProfile.collectionAddress.landmark || '')
  const [latitude, setLatitude] = useState<number | null>(donorProfile.collectionAddress.latitude ?? null)
  const [longitude, setLongitude] = useState<number | null>(donorProfile.collectionAddress.longitude ?? null)
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [locationNotice, setLocationNotice] = useState<string | null>(null)
  const [safetyChecks, setSafetyChecks] = useState<boolean[]>(() => Array(10).fill(false))
  const updateSafetyCheck = (index: number, checked: boolean) => { setSafetyChecks((checks) => checks.map((value, itemIndex) => itemIndex === index ? checked : value)); clearError('safety') }
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const clearError = (field: string) => { if (formErrors[field]) setFormErrors((previous) => ({ ...previous, [field]: '' })) }
  const handleItemChange = (id: string, field: keyof Omit<ItemRow, 'id'>, value: string) => {
    setFoodItems((previous) => previous.map((item) => item.id === id ? { ...item, [field]: value } : item)); clearError('items')
  }
  const addFoodItemRow = () => setFoodItems((previous) => [...previous, { id: crypto.randomUUID(), name: '', quantity: '', unit: 'kg' }])
  const removeFoodItemRow = (id: string) => { if (foodItems.length > 1) setFoodItems((previous) => previous.filter((item) => item.id !== id)) }
  const readFileAsDataUrl = (file: File) => {
    if (!file.type.startsWith('image/')) { setPhotoError('Please select an image file (JPG, PNG, or WEBP).'); return }
    if (file.size > 5 * 1024 * 1024) { setPhotoError('Each image must be 5MB or smaller.'); return }
    const reader = new FileReader()
    reader.onload = () => {
      const imageData = reader.result
      if (typeof imageData === 'string') setUploadedPhotos((previous) => [...previous, imageData])
    }
    reader.onerror = () => setPhotoError('The selected image could not be read. Please try again.')
    reader.readAsDataURL(file)
  }
  const handlePhotosUpload = (event: React.ChangeEvent<HTMLInputElement>) => { setPhotoError(null); Array.from(event.target.files || []).forEach(readFileAsDataUrl); event.target.value = '' }
  const applySavedAddress = () => {
    const address = donorProfile.collectionAddress
    setAddressLine1(address.addressLine1); setAreaLocality(address.areaLocality); setCity(address.city); setState(address.state); setPincode(address.pincode); setLandmark(address.landmark || ''); setLatitude(address.latitude ?? null); setLongitude(address.longitude ?? null)
  }
  const updateAddressFromCoordinates = async (nextLatitude: number, nextLongitude: number) => {
    setLatitude(nextLatitude); setLongitude(nextLongitude)
    const address = await reverseGeocodeCoordinates(nextLatitude, nextLongitude)
    if (address.addressLine1) setAddressLine1(address.addressLine1)
    if (address.areaLocality) setAreaLocality(address.areaLocality)
    if (address.city) setCity(address.city)
    if (address.state) setState(address.state)
    if (address.pincode) setPincode(address.pincode)
    if (address.landmark) setLandmark(address.landmark)
  }
  const handleUseCurrentLocation = async () => {
    setIsDetectingLocation(true); setLocationNotice(null)
    try { const coordinates = await getDeviceCoordinates(); await updateAddressFromCoordinates(coordinates.latitude, coordinates.longitude); setLocationNotice('Location and available address fields were updated from your device.') }
    catch (error) { setLocationNotice(error instanceof Error ? error.message : 'Could not detect your current location.') }
    finally { setIsDetectingLocation(false) }
  }
  const handleMapLocationChange = async (nextLatitude: number, nextLongitude: number) => { try { await updateAddressFromCoordinates(nextLatitude, nextLongitude) } catch { setLatitude(nextLatitude); setLongitude(nextLongitude) } }
  const toggleFoodCategory = (category: DonationFoodCategory) => {
    setFoodCategories((previous) => previous.includes(category) ? previous.filter((value) => value !== category) : [...previous, category])
    clearError('foodCategory')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); if (isSubmitting) return
    const errors: Record<string, string> = {}
    const preparationDate = new Date(prepTime); const pickupDate = new Date(pickupTime); const deadlineDate = new Date(pickupDeadline)
    if (foodItems.some((item) => !item.name.trim() || !(Number(item.quantity) > 0))) errors.items = 'Every food item needs a name and a quantity greater than zero.'
    if (!(Number(peopleServed) > 0)) errors.peopleServed = 'Enter the approximate number of people this donation can feed.'
    if (!foodCategories.length) errors.foodCategory = 'Select at least one food category.'
    if (foodCategories.includes('other') && !customFoodCategory.trim()) errors.foodCategory = 'Specify the additional food category.'
    if (Number.isNaN(preparationDate.getTime())) errors.preparation = 'Select a valid preparation date and time.'
    if (Number.isNaN(pickupDate.getTime())) errors.pickup = 'Select a valid pickup date and time.'
    if (Number.isNaN(deadlineDate.getTime())) errors.deadline = 'Select a valid donation deadline.'
    if (!Number.isNaN(pickupDate.getTime()) && !Number.isNaN(deadlineDate.getTime()) && deadlineDate < pickupDate) errors.deadline = 'Donation Deadline cannot be earlier than Pickup Date & Time.'
    if (!addressLine1.trim() || !areaLocality.trim()) errors.address = 'Address Line 1 and Area / Locality are required.'
    if (!safetyChecks.every(Boolean)) errors.safety = 'Please accept all food safety checklist statements.'
    if (Object.keys(errors).length) { setFormErrors(errors); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    setIsSubmitting(true); setFormErrors({})
    try {
      const collectionAddress: DonorCollectionAddress = { addressLine1: addressLine1.trim(), areaLocality: areaLocality.trim(), city: city.trim(), state: state.trim(), pincode: pincode.trim(), landmark: landmark.trim(), additionalDirections: pickupInstructions.trim(), latitude, longitude }
      const deadlineIso = deadlineDate.toISOString()
      const donation = await createDonation({
        donorId: donorProfile.id, donorName: donorProfile.name, donorPhone: donorProfile.phone, donorType: donorProfile.donorType,
        items: foodItems.map((item) => ({ name: item.name.trim(), quantity: Number(item.quantity), unit: item.unit, foodType: 'veg', safeUntil: deadlineIso })),
        estimatedPeopleServed: Number(peopleServed), foodPreparationTime: preparationDate.toISOString(), foodCategory: foodCategories[0], foodCategories,
        customFoodCategory: foodCategories.includes('other') ? customFoodCategory.trim() : undefined, foodShelfLifeCategory: shelfLifeCategoryFor(foodCategories),
        // Old freshness fields remain populated for existing consumers; the donor sees no calculated countdown.
        safeUntilHours: Math.max(1, Math.ceil((deadlineDate.getTime() - preparationDate.getTime()) / 3_600_000)),
        pickupSchedule: { readyType: 'scheduled', readyTime: pickupDate.toISOString(), deadlineTime: deadlineIso, pickupInstructions: pickupInstructions.trim() },
        collectionAddress, photos: uploadedPhotos,
        foodSafetyChecklistAccepted: safetyChecks,
      })
      onSuccess(donation.id, donation.handoverOtp)
    } catch (error) { setFormErrors({ submit: error instanceof Error ? error.message : 'Failed to publish the food donation. Your entries are still available to edit.' }) }
    finally { setIsSubmitting(false) }
  }

  const fieldClass = 'w-full min-h-11 px-3 py-2.5 text-sm font-normal rounded-xl border border-[#E6EAE7] bg-white text-[#29352F] placeholder:text-[#6B756F]/70 focus:outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#E8F5E9]'
  const labelClass = 'block mb-1.5 text-sm font-medium text-[#29352F]'
  const sectionClass = 'bg-white p-4 sm:p-5 rounded-2xl border border-[#E6EAE7] shadow-2xs space-y-4'
  const sectionTitleClass = 'text-base font-bold text-[#29352F] flex items-center gap-2'
  const helperClass = 'mt-1 text-sm leading-5 text-[#6B756F]'

  return <div className="min-h-screen bg-[#FAFAFA] text-[#29352F] antialiased pb-12">
    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-[#E6EAE7]"><div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6B756F] hover:text-[#29352F] px-3 py-2 rounded-lg border border-[#E6EAE7] hover:bg-neutral-50 transition-colors cursor-pointer"><ArrowLeft className="w-4 h-4" />Cancel & Back</button>
      <div className="text-right sm:text-center"><h1 className="font-heading font-bold text-base sm:text-lg">Donate Surplus Food</h1><p className="hidden sm:block text-sm text-[#6B756F]">Create a listing for volunteer collection</p></div>
    </div></div>
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-5">
      {formErrors.submit && <div role="alert" className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2.5"><AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><div><strong className="font-semibold block">Couldn’t publish donation</strong>{formErrors.submit}</div></div>}
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <section className={sectionClass}><div><h2 className={sectionTitleClass}><Camera className="w-5 h-5 text-[#1B5E20]" />1. Food Photos</h2><p className={helperClass}>Upload one combined photo or several real photos of the food. Photos are optional but help volunteers prepare for collection.</p></div>
          {photoError && <p role="alert" className="text-sm text-red-600 font-medium">{photoError}</p>}
          {uploadedPhotos.length > 0 && <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{uploadedPhotos.map((photo, index) => <div key={`${photo.slice(0, 40)}-${index}`} className="relative h-28 rounded-xl overflow-hidden border border-[#E6EAE7] bg-neutral-100"><img src={photo} alt={`Uploaded food photo ${index + 1}`} className="w-full h-full object-cover" /><button type="button" onClick={() => setUploadedPhotos((previous) => previous.filter((_, itemIndex) => itemIndex !== index))} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/65 text-white hover:bg-red-600 cursor-pointer" title="Remove photo" aria-label={`Remove photo ${index + 1}`}><Trash2 className="w-4 h-4" /></button></div>)}</div>}
          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[#2E7D32]/55 hover:border-[#1B5E20] bg-white text-sm font-medium text-[#29352F] cursor-pointer"><Camera className="w-4 h-4 text-[#1B5E20]" />{uploadedPhotos.length ? 'Add or replace photos' : 'Upload Food Photos'}<input type="file" accept="image/*" multiple onChange={handlePhotosUpload} className="sr-only" /></label><span className="ml-2 text-sm text-[#6B756F]">JPG, PNG, or WEBP; up to 5MB each</span>
        </section>
        <section className={sectionClass}><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className={sectionTitleClass}><UtensilsCrossed className="w-5 h-5 text-[#1B5E20]" />2. Food Items & Quantities <span className="text-red-500">*</span></h2><p className={helperClass}>List each food item, its quantity, and the unit used.</p></div><button type="button" onClick={addFoodItemRow} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E8F5E9] hover:bg-[#d8eedb] text-[#1B5E20] text-sm font-medium border border-[#C8E6C9] cursor-pointer"><Plus className="w-4 h-4" />Add Item</button></div>
          {formErrors.items && <p role="alert" className="text-sm text-red-600 font-medium">{formErrors.items}</p>}
          <div className="hidden sm:grid sm:grid-cols-[minmax(0,1fr)_8rem_9rem_2.5rem] gap-2 items-center px-1 text-xs font-semibold uppercase tracking-wide text-[#6B756F]"><span>Food item name</span><span>Quantity</span><span>Unit</span><span className="sr-only">Remove</span></div>
          <div className="space-y-2">{foodItems.map((item, index) => <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_8rem_9rem_2.5rem] gap-2 items-end rounded-xl border border-[#E6EAE7] bg-[#FAFAFA] p-3 sm:p-2.5"><div><label className="sm:sr-only" htmlFor={`food-name-${item.id}`}>Food item name</label><input id={`food-name-${item.id}`} value={item.name} onChange={(event) => handleItemChange(item.id, 'name', event.target.value)} placeholder={index === 0 ? 'e.g. Vegetable biryani' : 'Food item name'} className={fieldClass} /></div><div><label className="sm:sr-only" htmlFor={`food-quantity-${item.id}`}>Quantity</label><input id={`food-quantity-${item.id}`} type="number" min="0.01" step="any" inputMode="decimal" value={item.quantity} onChange={(event) => handleItemChange(item.id, 'quantity', event.target.value)} placeholder="0" className={fieldClass} /></div><div><label className="sm:sr-only" htmlFor={`food-unit-${item.id}`}>Unit</label><select id={`food-unit-${item.id}`} value={item.unit} onChange={(event) => handleItemChange(item.id, 'unit', event.target.value as FoodItemUnit)} className={`${fieldClass} cursor-pointer`}><option value="kg">kg</option><option value="litres">litres</option><option value="portions">portions</option><option value="packets">packets</option><option value="boxes">boxes</option><option value="containers">containers</option></select></div><button type="button" disabled={foodItems.length === 1} onClick={() => removeFoodItemRow(item.id)} className="min-h-11 inline-flex items-center justify-center rounded-xl border border-transparent text-[#6B756F] hover:bg-white hover:border-[#E6EAE7] hover:text-red-600 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer" title="Remove item" aria-label={`Remove ${item.name || `food item ${index + 1}`}`}><Trash2 className="w-5 h-5" /></button></div>)}</div>
        </section>
        <section className={sectionClass}><div><h2 className={sectionTitleClass}><Users className="w-5 h-5 text-[#1B5E20]" />3. Estimated People Served <span className="text-red-500">*</span></h2><p className={helperClass}>Enter the approximate number of people this donation can feed.</p></div><div className="max-w-sm"><label htmlFor="people-served" className={labelClass}>Estimated people served</label><div className="relative"><input id="people-served" type="number" min="1" step="1" inputMode="numeric" value={peopleServed} onChange={(event) => { setPeopleServed(event.target.value); clearError('peopleServed') }} placeholder="e.g. 50" className={`${fieldClass} pr-20`} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#6B756F]">people</span></div>{formErrors.peopleServed && <p role="alert" className="mt-1.5 text-sm text-red-600">{formErrors.peopleServed}</p>}</div></section>
        <section className={sectionClass}><div><h2 className={sectionTitleClass}><Clock className="w-5 h-5 text-[#1B5E20]" />4. Food Category & Preparation Time <span className="text-red-500">*</span></h2><p className={helperClass}>Select every category that applies, then tell volunteers when the food was prepared.</p></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><span className={labelClass}>Food Categories</span><div className="grid grid-cols-1 gap-2" role="group" aria-label="Food categories">{FOOD_CATEGORIES.map((category) => { const selected = foodCategories.includes(category.value); return <label key={category.value} className={`min-h-11 flex items-center gap-2.5 px-3 rounded-xl border text-sm cursor-pointer transition-colors ${selected ? 'border-[#72AE86] bg-[#EEF8F0] text-[#155F34]' : 'border-[#E6EAE7] bg-white text-[#29352F] hover:border-[#BFDCC7]'}`}><input type="checkbox" checked={selected} onChange={() => toggleFoodCategory(category.value)} className="w-4 h-4 rounded text-[#1B5E20] border-[#B7C3BA] focus:ring-[#1B5E20]" /><span className="font-medium">{category.label}</span></label> })}</div><div className="mt-2 flex flex-wrap gap-1.5" aria-live="polite">{foodCategories.map((value) => <span key={value} className="inline-flex rounded-full bg-[#E8F5E9] border border-[#C8E6C9] px-2.5 py-1 text-xs font-medium text-[#1B5E20]">{FOOD_CATEGORIES.find((category) => category.value === value)?.label}</span>)}</div>{formErrors.foodCategory && <p role="alert" className="mt-1.5 text-sm text-red-600">{formErrors.foodCategory}</p>}</div><div><label htmlFor="preparation-time" className={labelClass}>Food Preparation Date & Time</label><input id="preparation-time" type="datetime-local" value={prepTime} onChange={(event) => { setPrepTime(event.target.value); clearError('preparation') }} className={fieldClass} />{formErrors.preparation && <p role="alert" className="mt-1.5 text-sm text-red-600">{formErrors.preparation}</p>}{foodCategories.includes('other') && <div className="mt-4"><label htmlFor="custom-food-category" className={labelClass}>Specify Food Category <span className="text-red-500">*</span></label><input id="custom-food-category" value={customFoodCategory} onChange={(event) => { setCustomFoodCategory(event.target.value); clearError('foodCategory') }} placeholder="Describe the additional food category" className={fieldClass} /></div>}</div></div></section>
        <section className={sectionClass}><div><h2 className={sectionTitleClass}><Calendar className="w-5 h-5 text-[#1B5E20]" />5. Pickup Schedule & Volunteer Instructions <span className="text-red-500">*</span></h2><p className={helperClass}>Set the expected pickup and the final collection deadline separately.</p></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label htmlFor="pickup-time" className={labelClass}>Pickup Date & Time</label><input id="pickup-time" type="datetime-local" value={pickupTime} onChange={(event) => { setPickupTime(event.target.value); clearError('pickup'); clearError('deadline') }} className={fieldClass} />{formErrors.pickup && <p role="alert" className="mt-1.5 text-sm text-red-600">{formErrors.pickup}</p>}</div><div><label htmlFor="pickup-deadline" className={labelClass}>Donation Deadline</label><input id="pickup-deadline" type="datetime-local" value={pickupDeadline} onChange={(event) => { setPickupDeadline(event.target.value); clearError('deadline') }} className={fieldClass} />{formErrors.deadline && <p role="alert" className="mt-1.5 text-sm text-red-600">{formErrors.deadline}</p>}</div></div><div><label htmlFor="pickup-notes" className={labelClass}>Pickup Notes & Directions for Volunteer <span className="font-normal text-[#6B756F]">(optional)</span></label><textarea id="pickup-notes" rows={3} value={pickupInstructions} onChange={(event) => setPickupInstructions(event.target.value)} placeholder="e.g. Please enter via the rear kitchen service gate and call at reception." className={`${fieldClass} resize-y`} /></div></section>
        <section className={sectionClass}><div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3"><div><h2 className={sectionTitleClass}><MapPin className="w-5 h-5 text-[#1B5E20]" />6. Pickup Address & Map Pin <span className="text-red-500">*</span></h2><p className={helperClass}>Use your registered address or enter another pickup location for this donation.</p></div><button type="button" disabled={isDetectingLocation} onClick={handleUseCurrentLocation} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E8F5E9] hover:bg-[#d8eedb] text-[#1B5E20] border border-[#C8E6C9] text-sm font-medium disabled:opacity-60 cursor-pointer"><Navigation className={`w-4 h-4 ${isDetectingLocation ? 'animate-spin' : ''}`} />{isDetectingLocation ? 'Detecting location…' : 'Use My Current Location'}</button></div><div><label htmlFor="address-source" className={labelClass}>Pickup address</label><select id="address-source" value={selectedAddressOption} onChange={(event) => { const option = event.target.value as 'saved' | 'new'; setSelectedAddressOption(option); if (option === 'saved') applySavedAddress() }} className={`${fieldClass} cursor-pointer`}><option value="saved">Saved address: {donorProfile.collectionAddress.addressLine1}, {donorProfile.collectionAddress.areaLocality}</option><option value="new">Add New Address / Alternate Location</option></select></div>{locationNotice && <div className="p-3 rounded-xl bg-[#E8F5E9] border border-[#C8E6C9] text-sm text-[#1B5E20] flex items-center gap-2"><CheckCircle2 className="w-5 h-5 shrink-0" />{locationNotice}</div>}{formErrors.address && <p role="alert" className="text-sm text-red-600 font-medium">{formErrors.address}</p>}<div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div className="sm:col-span-2"><label htmlFor="address-line-1" className={labelClass}>Address Line 1 <span className="text-red-500">*</span></label><input id="address-line-1" value={addressLine1} onChange={(event) => { setAddressLine1(event.target.value); clearError('address') }} placeholder="Street, building, or door number" className={fieldClass} /></div><div><label htmlFor="area" className={labelClass}>Area / Locality <span className="text-red-500">*</span></label><input id="area" value={areaLocality} onChange={(event) => { setAreaLocality(event.target.value); clearError('address') }} placeholder="Area or neighbourhood" className={fieldClass} /></div><div><label htmlFor="landmark" className={labelClass}>Landmark <span className="font-normal text-[#6B756F]">(optional)</span></label><input id="landmark" value={landmark} onChange={(event) => setLandmark(event.target.value)} placeholder="Nearby landmark" className={fieldClass} /></div><div><label htmlFor="city" className={labelClass}>City</label><input id="city" value={city} onChange={(event) => setCity(event.target.value)} className={fieldClass} /></div><div className="grid grid-cols-[minmax(0,1fr)_8rem] gap-2"><div><label htmlFor="state" className={labelClass}>State</label><input id="state" value={state} onChange={(event) => setState(event.target.value)} className={fieldClass} /></div><div><label htmlFor="pincode" className={labelClass}>PIN Code</label><input id="pincode" value={pincode} onChange={(event) => setPincode(event.target.value)} className={fieldClass} /></div></div></div><div><p className="mb-2 text-sm font-medium text-[#29352F]">Pinpoint the collection location</p><CollectionLocationMap latitude={latitude} longitude={longitude} onLocationChange={handleMapLocationChange} /></div></section>
        <AccountabilityChecklist title="Food Safety Checklist" checked={safetyChecks} onChange={updateSafetyCheck} items={[
          'The food is not visibly spoiled.', 'The food does not have an unusual/off smell.', 'The food does not show visible mould or obvious contamination.', 'I am not knowingly donating food that is unsafe for human consumption.', 'The food has been handled and stored appropriately to the best of my knowledge.', 'I have provided accurate information about when the food was prepared and how it was stored/handled.', 'I have disclosed known ingredients/allergens that may be relevant to recipients.', 'The quantity and description of the food I entered are accurate.', 'I understand that the platform does not independently certify the food as safe and that I am responsible for the accuracy of the information I provide.', 'I confirm that the above information is truthful and accurate to the best of my knowledge.',
        ]} />
        {formErrors.safety && <p role="alert" className="text-sm font-medium text-red-600">{formErrors.safety}</p>}
        <button type="submit" disabled={isSubmitting || !safetyChecks.every(Boolean)} className="w-full min-h-13 py-3 px-6 rounded-xl text-base font-semibold text-white bg-[#29352F] hover:bg-[#1B231F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs">{isSubmitting ? <><Clock className="w-5 h-5 animate-spin" />Publishing Food Donation…</> : <><ShieldCheck className="w-5 h-5" />Publish Surplus Food Donation</>}</button>
      </form>
    </main>
  </div>
}
