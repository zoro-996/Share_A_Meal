import React, { useState, useEffect } from 'react'
import {
  Plus,
  UtensilsCrossed,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Users,
  ShieldCheck,
  KeyRound,
  Bike,
  X,
} from 'lucide-react'
import { AppHeader } from '../common/AppHeader'
import { FoodItemsTable } from '../common/FoodItemsTable'
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
  const donor = getCurrentDonor()

  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')

  // Modals & Notices
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null)
  const [cancelModalDonation, setCancelModalDonation] = useState<Donation | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)
  const [showCreatedModal, setShowCreatedModal] = useState<boolean>(!!justCreatedDonationId)

  const loadDonations = React.useCallback(async () => {
    try {
      const list = await fetchDonations({ role: 'donor', userId: donor.id })
      setDonations(list)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [donor.id])

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

  return (
    <div className="min-h-screen bg-white text-[#29352F] antialiased flex flex-col">
      {/* 1. Header */}
      <AppHeader
        currentPortal="donor"
        activePickupCount={activeDonations.length}
        onNavigateTracking={onOpenTracker}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* 2. Welcome & Hero Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E6EAE7]">
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1B5E20] bg-[#E8F5E9] px-2.5 py-0.5 rounded-md border border-[#C8E6C9] mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Food Donor • {donor.donorType === 'restaurant' ? 'Commercial Kitchen' : 'Donor Hub'}
            </div>
            <h1 className="font-heading text-xl sm:text-2xl font-extrabold text-[#29352F]">
              Welcome back, {donor.name}
            </h1>
            <p className="text-xs sm:text-sm text-[#6B756F] mt-0.5">
              Manage your surplus food donations and track volunteer pickups in real time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenDonateForm}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-[#29352F] hover:bg-[#1B231F] transition-all cursor-pointer shadow-xs group"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              <span>Donate Surplus Food</span>
            </button>
          </div>
        </div>

        {/* 3. Metric Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E6EAE7] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] border border-[#C8E6C9] text-[#1B5E20] flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#6B756F]">
                Active Listings
              </span>
              <div className="font-heading text-2xl font-black text-[#29352F]">
                {activeDonations.length}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E6EAE7] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FFF0DB] border border-[#FFE0B2] text-[#9A3412] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#6B756F]">
                People Fed / Impact
              </span>
              <div className="font-heading text-2xl font-black text-[#29352F]">
                ~{totalPeopleServed + 55}
                <span className="text-xs font-normal text-[#6B756F] ml-1">meals</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E6EAE7] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#EAF3FF] border border-[#BFDBFE] text-[#1E40AF] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#6B756F]">
                Total Donations
              </span>
              <div className="font-heading text-2xl font-black text-[#29352F]">
                {donations.length}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Tab Navigation: Active Pickups vs History */}
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

        {/* 5. Active Tab Content */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            {loading ? (
              <div className="py-12 text-center text-xs text-[#6B756F]">
                <Clock className="w-5 h-5 animate-spin mx-auto mb-2 text-[#29352F]" />
                Loading your surplus food listings...
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
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#29352F] hover:bg-[#1B231F] transition-all cursor-pointer shadow-xs"
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

                  return (
                    <div
                      key={donation.id}
                      className="rounded-2xl border border-[#E6EAE7] bg-white p-5 shadow-2xs hover:border-[#29352F]/30 transition-all flex flex-col md:flex-row gap-5"
                    >
                      {/* Photo Thumbnail */}
                      <div className="w-full md:w-44 h-36 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-[#E6EAE7] relative">
                        <img
                          src={
                            donation.photos[0] ||
                            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
                          }
                          alt={donation.totalQuantityLabel}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/90 text-[#29352F] backdrop-blur-2xs border border-[#E6EAE7]">
                            ~{donation.estimatedPeopleServed} Serves
                          </span>
                        </div>
                      </div>

                      {/* Details Center */}
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(donation.status)}
                            <span className="text-[11px] text-[#6B756F]">
                              ID: <span className="font-mono">{donation.id.slice(0, 12)}</span>
                            </span>
                          </div>
                        </div>

                        {/* Separate Deadlines: Freshness vs Collection */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-xl bg-[#FAFAFA] border border-[#E6EAE7] text-xs">
                          <div className="flex items-start gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#1B5E20] shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[10px] uppercase font-bold text-[#6B756F] block">
                                Food Freshness Deadline
                              </span>
                              <span className="font-semibold text-[#29352F]">
                                Safe until:{' '}
                                {new Date(donation.earliestSafeUntil).toLocaleString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-start gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#C25E00] shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[10px] uppercase font-bold text-[#6B756F] block">
                                Collection Deadline
                              </span>
                              <span className="font-semibold text-[#29352F]">
                                Collect by:{' '}
                                {new Date(
                                  donation.pickupSchedule.deadlineTime
                                ).toLocaleString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Full Food Items & Quantities Table (No collapsed "+N items") */}
                        <div className="pt-1">
                          <span className="text-[11px] font-bold text-[#6B756F] uppercase tracking-wider block mb-1.5">
                            Donated Food Items ({donation.items.length})
                          </span>
                          <FoodItemsTable
                            items={donation.items}
                            fallbackPhoto={donation.photos[0]}
                            defaultSafeUntil={donation.earliestSafeUntil}
                          />
                        </div>

                        {/* Location Locality */}
                        <div className="flex items-center gap-1.5 text-xs text-[#6B756F]">
                          <MapPin className="w-3.5 h-3.5 text-[#C25E00] shrink-0" />
                          <span>
                            {donation.collectionAddress.addressLine1},{' '}
                            {donation.collectionAddress.areaLocality}
                          </span>
                        </div>

                        {/* PROMINENT HANDOVER OTP DISPLAY FOR DONOR */}
                        {isClaimed && (
                          <div className="p-3 rounded-xl bg-[#E8F5E9]/60 border border-[#C8E6C9] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-white border border-[#C8E6C9] text-[#1B5E20] flex items-center justify-center shrink-0">
                                <KeyRound className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B5E20]">
                                  Pickup Handover OTP
                                </span>
                                <div className="text-[11px] text-[#29352F]">
                                  Share with volunteer only upon physical handover:
                                </div>
                              </div>
                            </div>

                            <div className="bg-white px-3.5 py-1.5 rounded-xl border-2 border-[#1B5E20] font-mono text-base font-extrabold text-[#1B5E20] tracking-widest shadow-2xs self-start sm:self-auto">
                              {donation.handoverOtp}
                            </div>
                          </div>
                        )}

                        {/* Assigned Volunteer Card */}
                        {donation.claim && (
                          <div className="p-3.5 rounded-xl bg-[#FAFAFA] border border-[#E6EAE7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-[#EAF3FF] border border-[#BFDBFE] text-[#1E40AF] font-bold flex items-center justify-center text-xs">
                                {donation.claim.volunteerName.charAt(0)}
                              </div>
                              <div>
                                <span className="text-[10px] uppercase font-bold text-[#6B756F] block">
                                  Assigned Volunteer
                                </span>
                                <div className="font-bold text-[#29352F]">
                                  {donation.claim.volunteerName}
                                </div>
                                <div className="text-[11px] text-[#6B756F]">
                                  {donation.claim.volunteerVehicle || 'Two-Wheeler Pickup'}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <a
                                href={`tel:${donation.claim.volunteerPhone}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#E6EAE7] text-[#29352F] hover:bg-neutral-50 text-xs font-semibold cursor-pointer"
                              >
                                <Phone className="w-3 h-3 text-[#1B5E20]" />
                                <span>Call ({donation.claim.volunteerPhone})</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => onOpenTracker(donation.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#29352F] text-white hover:bg-[#1B231F] text-xs font-bold cursor-pointer"
                              >
                                <Bike className="w-3.5 h-3.5" />
                                <span>Track Volunteer</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Action Column */}
                      <div className="flex md:flex-col justify-end md:justify-center gap-2 border-t md:border-t-0 md:border-l border-[#E6EAE7] pt-3 md:pt-0 md:pl-4 shrink-0">
                        {isClaimed ? (
                          <button
                            type="button"
                            onClick={() => onOpenTracker(donation.id)}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#29352F] hover:bg-[#1B231F] transition-all cursor-pointer shadow-xs"
                          >
                            <Bike className="w-3.5 h-3.5" />
                            <span>Track Volunteer</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenTracker(donation.id)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#29352F] bg-white border border-[#E6EAE7] hover:bg-neutral-50 transition-all cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>View Tracker</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedDonation(donation)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#6B756F] hover:text-[#29352F] bg-white border border-[#E6EAE7] hover:bg-neutral-50 transition-all cursor-pointer"
                        >
                          <span>View Details</span>
                        </button>

                        {donation.status === 'available' && (
                          <button
                            type="button"
                            onClick={() => setCancelModalDonation(donation)}
                            className="text-[11px] font-semibold text-red-600 hover:text-red-800 p-1 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* 6. History Tab Content */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {historyDonations.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#6B756F] rounded-2xl border border-dashed border-[#E6EAE7] bg-[#FAFAFA]">
                No completed past donations yet.
              </div>
            ) : (
              historyDonations.map((donation) => (
                <div
                  key={donation.id}
                  className="p-5 rounded-2xl border border-[#E6EAE7] bg-[#FAFAFA] space-y-3 text-xs"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#E6EAE7] pb-2">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(donation.status)}
                      <span className="font-bold text-[#29352F]">
                        Donation #{donation.id.slice(0, 10)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[#6B756F]">
                      <span>
                        Created:{' '}
                        {new Date(donation.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedDonation(donation)}
                        className="px-2.5 py-1 rounded-lg border border-[#E6EAE7] bg-white text-[#29352F] font-semibold hover:bg-neutral-50 cursor-pointer"
                      >
                        Breakdown
                      </button>
                    </div>
                  </div>

                  <p className="text-[#6B756F]">
                    {donation.totalQuantityLabel} • ~{donation.estimatedPeopleServed} people served
                  </p>

                  <div className="pt-1">
                    <FoodItemsTable
                      items={donation.items}
                      fallbackPhoto={donation.photos[0]}
                      defaultSafeUntil={donation.earliestSafeUntil}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* MODAL 1: Detail Breakdown Modal */}
      {selectedDonation && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-neutral-900/30 backdrop-blur-2xs flex items-center justify-center p-4"
          onClick={() => setSelectedDonation(null)}
        >
          <div
            className="bg-white rounded-2xl border border-[#E6EAE7] shadow-xl p-6 max-w-lg w-full relative max-h-[90vh] overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E6EAE7]">
              <div>
                <h3 className="font-heading font-bold text-base text-[#29352F]">
                  Donation Breakdown
                </h3>
                <span className="text-[11px] text-[#6B756F] font-mono">
                  {selectedDonation.id}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDonation(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Food items list */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#6B756F] block mb-2">
                Itemized Food Details:
              </span>
              <div className="divide-y divide-[#E6EAE7] border border-[#E6EAE7] rounded-xl overflow-hidden text-xs">
                {selectedDonation.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-[#29352F]">{item.name}</span>
                      <span className="text-[10px] text-[#6B756F] ml-2 capitalize">
                        ({item.foodType})
                      </span>
                    </div>
                    <span className="font-mono font-bold text-[#29352F]">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Handover OTP */}
            <div className="p-3.5 rounded-xl bg-[#E8F5E9]/50 border border-[#C8E6C9] flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-[#1B5E20] block">Pickup Handover OTP:</span>
                <span className="text-[11px] text-[#29352F]">
                  Required for volunteer to verify collection
                </span>
              </div>
              <span className="font-mono text-base font-extrabold text-[#1B5E20] px-3 py-1 bg-white rounded-lg border border-[#C8E6C9]">
                {selectedDonation.handoverOtp}
              </span>
            </div>

            {/* Collection Location */}
            <div className="text-xs space-y-1">
              <span className="font-bold uppercase tracking-wider text-[#6B756F] block">
                Collection Point:
              </span>
              <p className="text-[#29352F] font-medium">
                {selectedDonation.collectionAddress.addressLine1},{' '}
                {selectedDonation.collectionAddress.areaLocality},{' '}
                {selectedDonation.collectionAddress.city}
              </p>
              {selectedDonation.collectionAddress.landmark && (
                <p className="text-[11px] text-[#6B756F]">
                  Landmark: {selectedDonation.collectionAddress.landmark}
                </p>
              )}
              {selectedDonation.pickupSchedule.pickupInstructions && (
                <p className="text-[11px] text-[#6B756F] italic">
                  Note: "{selectedDonation.pickupSchedule.pickupInstructions}"
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-[#E6EAE7] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDonation(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Cancel Donation Confirmation */}
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

      {/* MODAL 3: Success Banner when newly created */}
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
                Surplus Food Published!
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
              className="w-full py-3 rounded-xl text-xs font-bold text-white bg-[#29352F] hover:bg-[#1B231F] transition-all cursor-pointer shadow-xs"
            >
              Go to Active Donations
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
