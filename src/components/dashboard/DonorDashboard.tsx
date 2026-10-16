import React, { useState, useEffect } from 'react'
import {
  Plus,
  UtensilsCrossed,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  Users,
  KeyRound,
  Bike,
  User,
} from 'lucide-react'
import { AppHeader } from '../common/AppHeader'
import { FoodItemsTable } from '../common/FoodItemsTable'
import { DashboardMetric, DashboardWelcome } from '../common/DashboardUI'
import {
  fetchDonations,
  cancelDonation,
  getCurrentDonor,
} from '../../services/donationService'
import type { Donation, DonationStatus } from '../../types/donation'

interface DonorDashboardProps {
  onOpenDonateForm: () => void
  onOpenTracker: (donationId: string) => void
  justCreatedDonationId?: string
  justCreatedOtp?: string
  onDismissSuccessModal?: () => void
}

export const DonorDashboard: React.FC<DonorDashboardProps> = ({
  onOpenDonateForm,
  onOpenTracker,
  justCreatedDonationId,
  justCreatedOtp,
  onDismissSuccessModal,
}) => {
  const [donor, setDonor] = useState(getCurrentDonor())
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')

  // Modals & Notices
  const [cancelModalDonation, setCancelModalDonation] = useState<Donation | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)
  const [showCreatedModal, setShowCreatedModal] = useState<boolean>(!!justCreatedDonationId)

  const loadDonations = React.useCallback(async () => {
    try {
      const currentProfile = getCurrentDonor()
      setDonor(currentProfile)
      const list = await fetchDonations({ role: 'donor', userId: currentProfile.id })
      setDonations(list)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDonations()
    const timer = setInterval(loadDonations, 6000)
    return () => clearInterval(timer)
  }, [loadDonations])

  const activeDonations = donations.filter(
    (d) =>
      d.status === 'available' ||
      d.status === 'claimed' ||
      d.status === 'en_route' ||
      d.status === 'arrived' ||
      d.status === 'collected'
  )

  const historyDonations = donations.filter(
    (d) => d.status === 'completed' || d.status === 'cancelled' || d.status === 'expired'
  )

  // Real backend calculations without mock offsets
  const totalPeopleServed = donations
    .filter((d) => d.status === 'completed' || d.status === 'collected')
    .reduce((acc, d) => acc + (d.estimatedPeopleServed || 0), 0)

  const handleConfirmCancel = async () => {
    if (!cancelModalDonation) return
    setIsCancelling(true)
    try {
      await cancelDonation(cancelModalDonation.id, donor.id, cancelReason)
      setCancelModalDonation(null)
      setCancelReason('')
      await loadDonations()
    } catch {
      // ignore
    } finally {
      setIsCancelling(false)
    }
  }

  const formatSafeUntil = (iso?: string) => {
    if (!iso) return 'Not specified'
    try {
      const d = new Date(iso)
      if (isNaN(d.getTime())) return 'Not specified'
      return `${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, ${d.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
      })}`
    } catch {
      return 'Not specified'
    }
  }

  const getStatusBadge = (status: DonationStatus) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1B5E20] animate-pulse" />
            Available for Pickup
          </span>
        )
      case 'claimed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF0DB] text-[#9A3412] border border-[#FFE0B2]">
            <Clock className="w-3 h-3" />
            Volunteer Claimed
          </span>
        )
      case 'en_route':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EAF3FF] text-[#1E40AF] border border-[#BFDBFE]">
            <Bike className="w-3 h-3 animate-bounce" />
            Volunteer En Route
          </span>
        )
      case 'arrived':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F3E8FF] text-[#6B21A8] border border-[#E9D5FF] animate-pulse">
            <MapPin className="w-3 h-3" />
            Volunteer Arrived at Door
          </span>
        )
      case 'collected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9]">
            <CheckCircle2 className="w-3 h-3" />
            Food Collected
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
            <CheckCircle2 className="w-3 h-3 text-[#1B5E20]" />
            Completed & Distributed
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-500 border border-neutral-200">
            Cancelled
          </span>
        )
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            Expired
          </span>
        )
    }
  }

  // Helper to filter genuine uploaded photos and omit dummy / external sample links
  const getActualPhotos = (d: Donation): string[] => {
    return (d.photos || []).filter(
      (p) => Boolean(p) && !p.includes('placeholder-empty') && !p.includes('images.unsplash.com')
    )
  }

  return (
    <div className="min-h-screen bg-white text-[#29352F] antialiased flex flex-col">
      {/* 1. Top Header */}
      <AppHeader
        currentPortal="donor"
        onNavigateTracking={onOpenTracker}
        onProfileUpdated={loadDonations}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6">
        {/* 2. Welcome Greeting */}
        <DashboardWelcome title={<>Welcome back, {donor.name}</>} description="Publish surplus food so verified local volunteers can collect and redistribute it quickly." actionLabel="Donate Surplus Food" actionIcon={<Plus className="w-4 h-4" />} onAction={onOpenDonateForm} />

        {/* 4. Metric Stats Cards (Calculated strictly from actual records) */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4"><DashboardMetric label="Active Listings" value={activeDonations.length} icon={<UtensilsCrossed className="w-5 h-5" />} tone="green" /><DashboardMetric label="People Fed / Impact" value={<>~{totalPeopleServed}<span className="ml-1 text-xs font-medium text-[#6B756F]">people</span></>} icon={<Users className="w-5 h-5" />} tone="orange" /><DashboardMetric label="Total Donations" value={donations.length} icon={<CheckCircle2 className="w-5 h-5" />} tone="blue" /></div>

        {/* 5. Tab Navigation: Active Pickups vs History */}
        <div className="flex items-center gap-2 border-b border-[#E6EAE7] pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'active'
                ? 'border-[#29352F] text-[#29352F]'
                : 'border-transparent text-[#6B756F] hover:text-[#29352F]'
            }`}
          >
            <span>Active Donations</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'active'
                  ? 'bg-[#29352F] text-white'
                  : 'bg-neutral-100 text-[#6B756F]'
              }`}
            >
              {activeDonations.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-[#29352F] text-[#29352F]'
                : 'border-transparent text-[#6B756F] hover:text-[#29352F]'
            }`}
          >
            <span>Donation History</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'history'
                  ? 'bg-[#29352F] text-white'
                  : 'bg-neutral-100 text-[#6B756F]'
              }`}
            >
              {historyDonations.length}
            </span>
          </button>
        </div>

        {/* 6. Active Donations Tab Content */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            {loading ? (
              <div className="py-12 text-center text-xs text-[#6B756F]">
                <Clock className="w-5 h-5 animate-spin mx-auto mb-2 text-[#29352F]" />
                Loading surplus food listings...
              </div>
            ) : activeDonations.length === 0 ? (
              <div className="py-16 text-center rounded-2xl border border-dashed border-[#E6EAE7] bg-[#FAFAFA] p-8">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F5E9] text-[#1B5E20] flex items-center justify-center mx-auto mb-3">
                  <UtensilsCrossed className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-base font-bold text-[#29352F]">
                  No Active Surplus Food Listings
                </h3>
                <p className="text-xs text-[#6B756F] mt-1 max-w-sm mx-auto">
                  Have surplus meals, catering trays, or bakery goods? Publish a listing so volunteers can collect and deliver them.
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={onOpenDonateForm}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1B5E20] hover:bg-[#144718] transition-all cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Your First Donation</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {activeDonations.map((donation) => {
                  const isClaimed =
                    donation.status === 'claimed' ||
                    donation.status === 'en_route' ||
                    donation.status === 'arrived' ||
                    donation.status === 'collected'
                  const actualPhotos = getActualPhotos(donation)

                  return (
                    <div
                      key={donation.id}
                      className="rounded-2xl border border-[#E6EAE7] bg-white p-4 sm:p-5 shadow-2xs hover:border-[#29352F]/30 transition-all flex flex-col space-y-3.5"
                    >
                      {/* 1. Food Photos & Gallery (actual photos only, no dummy/sample images) */}
                      {actualPhotos.length > 0 && (
                        <div className="space-y-2 pb-2 border-b border-[#E6EAE7]">
                          {actualPhotos.length === 1 ? (
                            <div className="w-full sm:w-64 h-40 rounded-xl overflow-hidden bg-neutral-100 border border-[#E6EAE7]">
                              <img
                                src={actualPhotos[0]}
                                alt={donation.totalQuantityLabel}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2.5">
                              {actualPhotos.map((photoUrl, pIdx) => (
                                <div
                                  key={pIdx}
                                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-[#E6EAE7] bg-neutral-50 shrink-0"
                                >
                                  <img
                                    src={photoUrl}
                                    alt={`Food photo ${pIdx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 2. Status Badge & Unique Donation ID (#ID) */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(donation.status)}
                          <span className="font-mono text-xs font-bold text-[#29352F] bg-neutral-100 px-2 py-0.5 rounded-md">
                            #{donation.id.slice(0, 10)}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#6B756F]">
                          Listed {new Date(donation.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                          {new Date(donation.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      {/* 3. Separate Time Labels: Food Safety Time vs Donation Deadline */}
                      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[1fr_1fr_0.8fr]">
                        <div className="flex items-start gap-2.5 rounded-xl border border-[#C8E6C9] bg-[#E8F5E9]/65 p-3.5 text-sm">
                          <div className="w-7 h-7 rounded-lg bg-[#E8F5E9] text-[#1B5E20] flex items-center justify-center shrink-0 mt-0.5">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-[#6B756F] block">
                              Food Safety Time
                            </span>
                            <span className="font-bold text-[#29352F] text-sm">
                              Safe until: {formatSafeUntil(donation.earliestSafeUntil)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5 rounded-xl border border-[#FFE0B2] bg-[#FFF0DB]/70 p-3.5 text-sm">
                          <div className="w-7 h-7 rounded-lg bg-[#FFF0DB] text-[#9A3412] flex items-center justify-center shrink-0 mt-0.5">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-[#6B756F] block">
                              Donation Deadline
                            </span>
                            <span className="font-bold text-[#29352F] text-sm">
                              Available until: {formatSafeUntil(donation.pickupSchedule?.deadlineTime)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl border border-[#D7E7FF] bg-[#EAF3FF] px-4 py-3.5 text-sm">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#F05A19] shadow-2xs"><Users className="h-5 w-5" /></div>
                          <div><span className="block text-xs text-[#536058]">Suitable for approximately</span><strong className="text-lg text-[#29352F]">{donation.estimatedPeopleServed} people</strong></div>
                        </div>
                      </div>

                      {/* 4. Complete FoodItemsTable with columns: Photo, Food Item, Quantity, Unit, Food Safety Time (no VEG/NON-VEG labels) */}
                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(240px,0.8fr)]">
                        <div>
                          <span className="text-[11px] font-bold text-[#6B756F] uppercase tracking-wider block mb-1.5">
                            Donated Food Items ({donation.items.length})
                          </span>
                          <FoodItemsTable
                            items={donation.items}
                            fallbackPhoto={actualPhotos[0]}
                            defaultSafeUntil={donation.earliestSafeUntil}
                            hideDietaryLabels={true}
                          />
                        </div>
                        <div className="flex items-start gap-3 rounded-xl border border-[#FFE0B2] bg-[#FFF0DB]/65 px-4 py-3.5 text-sm text-[#536058]">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C25E00]" />
                          <span className="min-w-0 leading-6"><strong className="block text-[#29352F]">Pickup Address</strong>
                            {donation.collectionAddress.addressLine1}
                            {donation.collectionAddress.addressLine2 ? `, ${donation.collectionAddress.addressLine2}` : ''}
                            , {donation.collectionAddress.areaLocality}, {donation.collectionAddress.city} -{' '}
                            {donation.collectionAddress.pincode}
                            {donation.collectionAddress.landmark ? ` (Landmark: ${donation.collectionAddress.landmark})` : ''}
                          </span>
                        </div>
                      </div>

                      {/* 6. Handover OTP block (only when claimed/in-progress; shared only upon physical handover) */}
                      {isClaimed && donation.handoverOtp && (
                        <div className="p-4 rounded-xl bg-[#E8F5E9]/60 border border-[#C8E6C9] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-white border border-[#C8E6C9] text-[#1B5E20] flex items-center justify-center shrink-0 shadow-2xs">
                              <KeyRound className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B5E20] block">
                                Pickup Handover OTP
                              </span>
                              <div className="text-xs text-[#29352F]">
                                Share with volunteer only upon physical handover:
                              </div>
                            </div>
                          </div>

                          <div className="bg-white px-4 py-2 rounded-xl border-2 border-[#1B5E20] font-mono text-xl font-black text-[#1B5E20] tracking-widest shadow-2xs self-start sm:self-auto">
                            {donation.handoverOtp}
                          </div>
                        </div>
                      )}

                      {/* 7. Assigned Volunteer card (only when claimed; volunteer name, vehicle, phone/call action, pickup status; no volunteer details or tracker on unclaimed donations) */}
                      {isClaimed && donation.claim && (
                        <div className="p-3.5 rounded-xl bg-[#FAFAFA] border border-[#E6EAE7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#EAF3FF] border border-[#BFDBFE] text-[#1E40AF] font-bold flex items-center justify-center text-xs shrink-0">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-[#6B756F] block">
                                Assigned Volunteer •{' '}
                                {donation.claim.currentStatus
                                  ? donation.claim.currentStatus.replace('_', ' ').toUpperCase()
                                  : 'CLAIMED'}
                              </span>
                              <div className="font-bold text-[#29352F] text-sm">
                                {donation.claim.volunteerName}
                              </div>
                              <div className="text-[11px] text-[#6B756F]">
                                Vehicle: {donation.claim.volunteerVehicle || 'Two-Wheeler Pickup'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <a
                              href={`tel:${donation.claim.volunteerPhone}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E6EAE7] text-[#29352F] hover:bg-neutral-50 text-xs font-semibold cursor-pointer shadow-2xs"
                            >
                              <Phone className="w-3.5 h-3.5 text-[#1B5E20]" />
                              <span>Call ({donation.claim.volunteerPhone})</span>
                            </a>
                          </div>
                        </div>
                      )}

                      {/* 8. Bottom Actions: Cancel button for unclaimed; single Track Volunteer button for claimed (NO "View Details" button) */}
                      <div className="flex items-center justify-between pt-3 border-t border-[#E6EAE7]">
                        {isClaimed ? (
                          <div className="w-full flex items-center justify-between">
                            <span className="text-xs text-[#6B756F]">
                              Volunteer assigned & actively coordinating pickup
                            </span>
                            <button
                              type="button"
                              onClick={() => onOpenTracker(donation.id)}
                              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#29352F] hover:bg-[#1B231F] transition-all cursor-pointer shadow-xs"
                            >
                              <Bike className="w-3.5 h-3.5" />
                              <span>Track Volunteer</span>
                            </button>
                          </div>
                        ) : (
                          <div className="w-full flex items-center justify-between">
                            <span className="text-xs text-[#6B756F]">
                              Listed • Waiting for volunteer pickup
                            </span>
                            {donation.status === 'available' && (
                              <button
                                type="button"
                                onClick={() => setCancelModalDonation(donation)}
                                className="text-xs font-semibold text-red-600 hover:text-red-800 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                Cancel Donation
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* 7. History Tab Content (Unified cards with direct details, NO "View Details" or "Breakdown" modal) */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {historyDonations.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#6B756F] rounded-2xl border border-dashed border-[#E6EAE7] bg-[#FAFAFA]">
                No completed past donations yet.
              </div>
            ) : (
              historyDonations.map((donation) => {
                const actualPhotos = getActualPhotos(donation)

                return (
                  <div
                    key={donation.id}
                    className="p-5 sm:p-6 rounded-2xl border border-[#E6EAE7] bg-[#FAFAFA] space-y-4 text-xs"
                  >
                    {/* 1. Food Photos */}
                    {actualPhotos.length > 0 && (
                      <div className="flex flex-wrap gap-2 pb-2 border-b border-[#E6EAE7]">
                        {actualPhotos.map((photoUrl, pIdx) => (
                          <div
                            key={pIdx}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-[#E6EAE7] bg-white shrink-0"
                          >
                            <img
                              src={photoUrl}
                              alt={`Food photo ${pIdx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 2. Status Badge & Unique Donation ID */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(donation.status)}
                        <span className="font-mono text-xs font-bold text-[#29352F] bg-white px-2 py-0.5 rounded-md border border-[#E6EAE7]">
                          #{donation.id.slice(0, 10)}
                        </span>
                      </div>

                      <span className="text-[#6B756F]">
                        Created:{' '}
                        {new Date(donation.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* 3. Separate Time Labels */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-white border border-[#E6EAE7] text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#6B756F] block">
                          Food Safety Time
                        </span>
                        <span className="font-semibold text-[#29352F]">
                          Safe until: {formatSafeUntil(donation.earliestSafeUntil)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#6B756F] block">
                          Donation Deadline
                        </span>
                        <span className="font-semibold text-[#29352F]">
                          Available until: {formatSafeUntil(donation.pickupSchedule?.deadlineTime)}
                        </span>
                      </div>
                    </div>

                    {/* 4. Complete Food Items Table */}
                    <div>
                      <span className="text-[11px] font-bold text-[#6B756F] uppercase tracking-wider block mb-1">
                        Donated Food Items ({donation.items.length})
                      </span>
                      <FoodItemsTable
                        items={donation.items}
                        fallbackPhoto={actualPhotos[0]}
                        defaultSafeUntil={donation.earliestSafeUntil}
                        hideDietaryLabels={true}
                      />
                    </div>

                    <div className="flex items-start gap-2.5 rounded-xl border border-[#E6EAE7] bg-white px-3 py-2.5 text-sm text-[#536058]">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C25E00]" />
                      <div className="leading-6"><strong className="mr-1 text-[#29352F]">Pickup Address:</strong>
                        {donation.collectionAddress.addressLine1},{' '}
                        {donation.collectionAddress.areaLocality},{' '}
                        {donation.collectionAddress.city} - {donation.collectionAddress.pincode}
                        {donation.collectionAddress.landmark ? ` (Landmark: ${donation.collectionAddress.landmark})` : ''}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </main>

      {/* Cancel Donation Confirmation Modal */}
      {cancelModalDonation && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-neutral-900/30 backdrop-blur-2xs flex items-center justify-center p-4"
          onClick={() => setCancelModalDonation(null)}
        >
          <div
            className="bg-white rounded-2xl border border-[#E6EAE7] shadow-xl p-6 max-w-sm w-full relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Cancel Food Donation?</span>
            </div>
            <p className="text-xs text-[#6B756F] leading-relaxed">
              Are you sure you want to cancel this listing? Nearby volunteers will no longer be able to claim it.
            </p>
            <div>
              <label className="block text-[11px] font-semibold text-[#29352F] mb-1">
                Reason for cancellation (optional):
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Food already consumed / emergency"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6EAE7] focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalDonation(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#6B756F] hover:bg-neutral-100 cursor-pointer"
              >
                Keep Listing
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 cursor-pointer"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal when newly created */}
      {showCreatedModal && justCreatedOtp && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-2xs flex items-center justify-center p-4"
          onClick={() => {
            setShowCreatedModal(false)
            onDismissSuccessModal?.()
          }}
        >
          <div
            className="bg-white rounded-2xl border border-[#C8E6C9] shadow-2xl p-6 max-w-md w-full relative space-y-4 text-center animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-[#E8F5E9] border-2 border-[#C8E6C9] text-[#1B5E20] flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-heading font-extrabold text-lg text-[#29352F]">
                Food Donation Completed
              </h3>
              <p className="text-xs text-[#6B756F] mt-1">
                Your donation is now visible to verified nearby volunteers for collection.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FFF0DB]/70 border border-[#FFE0B2] text-left">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#9A3412] mb-1">
                <KeyRound className="w-4 h-4 text-[#9A3412]" />
                <span>Your Single-Use Handover OTP:</span>
              </div>
              <div className="text-center py-2 bg-white rounded-xl border border-[#FFE0B2] font-mono text-2xl font-black text-[#9A3412] tracking-widest shadow-2xs">
                {justCreatedOtp}
              </div>
              <p className="text-[11px] text-[#6B756F] mt-2 leading-snug">
                Keep this code handy. When the volunteer arrives at your door, they must enter this 6-digit code to verify the food handover.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowCreatedModal(false)
                onDismissSuccessModal?.()
                loadDonations()
              }}
              className="w-full py-3 rounded-xl text-xs font-bold text-white bg-[#1B5E20] hover:bg-[#144718] transition-all cursor-pointer shadow-xs"
            >
              Go to Active Donations
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
