import React, { useState, useEffect } from 'react'
import {
  HeartHandshake,
  Clock,
  MapPin,
  Search,
  CheckCircle2,
  AlertCircle,
  Users,
  ShieldCheck,
  Bike,
  ChevronRight,
  Flame,
} from 'lucide-react'
import { AppHeader } from '../common/AppHeader'
import { FoodItemsTable } from '../common/FoodItemsTable'
import { ClaimConfirmationModal } from '../volunteer/ClaimConfirmationModal'
import {
  fetchDonations,
  getCurrentVolunteer,
} from '../../services/donationService'
import type { Donation, DonationStatus } from '../../types/donation'

interface VolunteerDashboardProps {
  onOpenTracker: (donationId: string) => void
}

export const VolunteerDashboard: React.FC<VolunteerDashboardProps> = ({ onOpenTracker }) => {
  const volunteer = getCurrentVolunteer()

  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [foodTypeFilter, setFoodTypeFilter] = useState<'all' | 'veg' | 'vegan' | 'non_veg'>('all')
  const [urgencyFilter, setUrgencyFilter] = useState(false)
  const [activeTab, setActiveTab] = useState<'available' | 'my_pickups' | 'history'>('available')

  // Claim Modal State
  const [claimModalDonation, setClaimModalDonation] = useState<Donation | null>(null)
  const [raceConditionNotice, setRaceConditionNotice] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 15000)
    return () => clearInterval(timer)
  }, [])

  const loadDonations = React.useCallback(async () => {
    try {
      const list = await fetchDonations({ role: 'volunteer', userId: volunteer.id })
      setDonations(list)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [volunteer.id])

  useEffect(() => {
    loadDonations()
    const timer = setInterval(loadDonations, 6000)
    return () => clearInterval(timer)
  }, [loadDonations])

  // Partition donations
  const availableDonations = donations.filter((d) => d.status === 'available')
  const myClaimedRuns = donations.filter(
    (d) =>
      d.claim?.volunteerId === volunteer.id &&
      (d.status === 'claimed' ||
        d.status === 'en_route' ||
        d.status === 'arrived' ||
        d.status === 'collected')
  )
  const myCompletedRuns = donations.filter(
    (d) => d.claim?.volunteerId === volunteer.id && d.status === 'completed'
  )

  // Filtered available donations
  const filteredAvailable = availableDonations.filter((donation) => {
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchesLocality = donation.collectionAddress.areaLocality.toLowerCase().includes(q)
      const matchesItem = donation.items.some((it) => it.name.toLowerCase().includes(q))
      if (!matchesLocality && !matchesItem) return false
    }

    // Food type match
    if (foodTypeFilter !== 'all') {
      const matchesType = donation.items.some((it) => it.foodType === foodTypeFilter)
      if (!matchesType) return false
    }

    // Urgency match (< 2.5 hours remaining)
    if (urgencyFilter) {
      const remainingMinutes =
        (new Date(donation.earliestSafeUntil).getTime() - currentTime) / (1000 * 60)
      if (remainingMinutes > 150) return false
    }

    return true
  })

  const getStatusBadge = (status: DonationStatus) => {
    switch (status) {
      case 'claimed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF0DB] text-[#9A3412] border border-[#FFE0B2]">
            <Clock className="w-3 h-3" />
            Claimed / Preparing
          </span>
        )
      case 'en_route':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EAF3FF] text-[#1E40AF] border border-[#BFDBFE]">
            <Bike className="w-3 h-3 animate-bounce" />
            En Route to Donor
          </span>
        )
      case 'arrived':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F3E8FF] text-[#6B21A8] border border-[#E9D5FF] animate-pulse">
            <MapPin className="w-3 h-3" />
            At Collection Point
          </span>
        )
      case 'collected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9]">
            <CheckCircle2 className="w-3 h-3" />
            Food Collected (Delivering)
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-100 text-[#29352F] border border-neutral-200">
            Completed & Distributed
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-white text-[#29352F] antialiased flex flex-col">
      {/* 1. Header */}
      <AppHeader
        currentPortal="volunteer"
        activePickupCount={myClaimedRuns.length}
        onNavigateTracking={onOpenTracker}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Active Pickup Alert Banner if any */}
        {myClaimedRuns.length > 0 && (
          <div className="p-4 rounded-2xl bg-[#FFF0DB]/80 border border-[#FFE0B2] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#FFE0B2] text-[#9A3412] flex items-center justify-center shrink-0">
                <Bike className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-extrabold text-sm text-[#29352F]">
                    Pickup In Progress ({myClaimedRuns[0].items[0]?.name || 'Food Run'})
                  </span>
                  {getStatusBadge(myClaimedRuns[0].status)}
                </div>
                <p className="text-xs text-[#6B756F] mt-0.5">
                  {myClaimedRuns[0].collectionAddress.areaLocality} • ~
                  {myClaimedRuns[0].estimatedPeopleServed} people will be served
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenTracker(myClaimedRuns[0].id)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#29352F] hover:bg-[#1B231F] transition-all cursor-pointer flex items-center gap-1.5 self-end sm:self-auto shadow-xs"
            >
              <span>Open Live Tracker & Verify OTP</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 2. Welcome & Hero Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E6EAE7]">
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9A3412] bg-[#FFF0DB] px-2.5 py-0.5 rounded-md border border-[#FFE0B2] mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Volunteer • {volunteer.role === 'ngo_member' ? 'NGO Partner' : 'Community Volunteer'}
            </div>
            <h1 className="font-heading text-xl sm:text-2xl font-extrabold text-[#29352F]">
              Hello, {volunteer.name}
            </h1>
            <p className="text-xs sm:text-sm text-[#6B756F] mt-0.5">
              Claim available surplus food in your vicinity and deliver it directly to beneficiaries.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6B756F] bg-[#FAFAFA] border border-[#E6EAE7] px-3 py-2 rounded-xl">
              Vehicle: <strong>{volunteer.vehicle}</strong>
            </span>
          </div>
        </div>

        {/* 3. Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E6EAE7] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] border border-[#C8E6C9] text-[#1B5E20] flex items-center justify-center shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#6B756F]">
                Available Nearby
              </span>
              <div className="font-heading text-2xl font-black text-[#29352F]">
                {availableDonations.length}
                <span className="text-xs font-normal text-[#6B756F] ml-1">listings</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E6EAE7] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FFF0DB] border border-[#FFE0B2] text-[#9A3412] flex items-center justify-center shrink-0">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#6B756F]">
                Active Runs
              </span>
              <div className="font-heading text-2xl font-black text-[#29352F]">
                {myClaimedRuns.length}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E6EAE7] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#EAF3FF] border border-[#BFDBFE] text-[#1E40AF] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#6B756F]">
                Meals Distributed
              </span>
              <div className="font-heading text-2xl font-black text-[#29352F]">
                ~125
                <span className="text-xs font-normal text-[#6B756F] ml-1">people fed</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#E6EAE7] pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('available')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'available'
                ? 'border-[#29352F] text-[#29352F]'
                : 'border-transparent text-[#6B756F] hover:text-[#29352F]'
            }`}
          >
            <span>Surplus Food Near You</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'available'
                  ? 'bg-[#29352F] text-white'
                  : 'bg-neutral-100 text-[#6B756F]'
              }`}
            >
              {filteredAvailable.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('my_pickups')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'my_pickups'
                ? 'border-[#29352F] text-[#29352F]'
                : 'border-transparent text-[#6B756F] hover:text-[#29352F]'
            }`}
          >
            <span>My Active Pickups</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'my_pickups'
                  ? 'bg-[#29352F] text-white'
                  : 'bg-neutral-100 text-[#6B756F]'
              }`}
            >
              {myClaimedRuns.length}
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
            <span>Past Deliveries</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'history'
                  ? 'bg-[#29352F] text-white'
                  : 'bg-neutral-100 text-[#6B756F]'
              }`}
            >
              {myCompletedRuns.length}
            </span>
          </button>
        </div>

        {/* 5. TAB A: Available Food Near You */}
        {activeTab === 'available' && (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#FAFAFA] border border-[#E6EAE7]">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-[#6B756F] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by locality or food item (e.g. Indiranagar, Biryani)..."
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-[#E6EAE7] bg-white text-[#29352F] placeholder-[#6B756F]/60 focus:outline-none focus:border-[#29352F]"
                />
              </div>

              {/* Food Type Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {(['all', 'veg', 'vegan', 'non_veg'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFoodTypeFilter(type)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                      foodTypeFilter === type
                        ? 'bg-[#29352F] text-white border-[#29352F]'
                        : 'bg-white text-[#6B756F] border-[#E6EAE7] hover:bg-neutral-50'
                    }`}
                  >
                    {type === 'all'
                      ? 'All'
                      : type === 'veg'
                      ? 'Pure Veg'
                      : type === 'vegan'
                      ? 'Vegan'
                      : 'Non-Veg'}
                  </button>
                ))}

                {/* Urgency Toggle */}
                <button
                  type="button"
                  onClick={() => setUrgencyFilter(!urgencyFilter)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                    urgencyFilter
                      ? 'bg-[#FFF0DB] text-[#9A3412] border-[#FFE0B2]'
                      : 'bg-white text-[#6B756F] border-[#E6EAE7] hover:bg-neutral-50'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-[#C25E00]" />
                  <span>Expiring Soon</span>
                </button>
              </div>
            </div>

            {/* Listings Grid / Cards */}
            {loading ? (
              <div className="py-12 text-center text-xs text-[#6B756F]">
                <Clock className="w-5 h-5 animate-spin mx-auto mb-2 text-[#29352F]" />
                Searching for surplus food listings near your location...
              </div>
            ) : filteredAvailable.length === 0 ? (
              <div className="py-16 text-center rounded-2xl border border-dashed border-[#E6EAE7] bg-[#FAFAFA] p-8">
                <HeartHandshake className="w-10 h-10 text-[#6B756F] mx-auto mb-2" />
                <h3 className="font-heading text-sm font-bold text-[#29352F]">
                  No matching surplus food listings found
                </h3>
                <p className="text-xs text-[#6B756F] mt-1">
                  Try adjusting your locality search or removing food category filters.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAvailable.map((donation) => {
                  const remainingMinutes = Math.max(
                    0,
                    Math.round(
                      (new Date(donation.earliestSafeUntil).getTime() - currentTime) / (1000 * 60)
                    )
                  )
                  const remainingHours = Math.floor(remainingMinutes / 60)
                  const remainingMins = remainingMinutes % 60
                  const isUrgent = remainingMinutes <= 120 // less than 2 hours

                  return (
                    <div
                      key={donation.id}
                      className="rounded-2xl border border-[#E6EAE7] bg-white p-5 shadow-2xs hover:border-[#29352F]/40 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        {/* Top: Header Badges & Donor Locality */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E6EAE7]">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B5E20] bg-[#E8F5E9] px-2 py-0.5 rounded-md border border-[#C8E6C9]">
                              {donation.donorType === 'restaurant'
                                ? 'Restaurant'
                                : donation.donorType === 'function_event'
                                ? 'Event Banquet'
                                : 'Food Donor'}
                            </span>

                            {isUrgent && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#9A3412] bg-[#FFF0DB] px-1.5 py-0.5 rounded border border-[#FFE0B2]">
                                <Flame className="w-3 h-3 text-[#C25E00]" />
                                Urgent
                              </span>
                            )}

                            <span className="text-[11px] text-[#6B756F]">
                              ID: <span className="font-mono">{donation.id.slice(0, 10)}</span>
                            </span>
                          </div>

                          <div className="inline-flex items-center gap-1 text-xs font-bold text-[#29352F] bg-[#FAFAFA] px-2.5 py-1 rounded-lg border border-[#E6EAE7]">
                            <Users className="w-3.5 h-3.5 text-[#1B5E20]" />
                            <span>~{donation.estimatedPeopleServed} People Served</span>
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
                                })}{' '}
                                ({remainingHours}h {remainingMins}m left)
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

                        {/* Complete Food Items & Quantities Table */}
                        <div className="pt-1">
                          <span className="text-[11px] font-bold text-[#6B756F] uppercase tracking-wider block mb-1.5">
                            Food Items ({donation.items.length})
                          </span>
                          <FoodItemsTable
                            items={donation.items}
                            fallbackPhoto={donation.photos[0]}
                            defaultSafeUntil={donation.earliestSafeUntil}
                          />
                        </div>

                        {/* Masked Pickup Locality & Privacy Notice */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs pt-1">
                          <div className="flex items-center gap-1.5 text-[#6B756F]">
                            <MapPin className="w-3.5 h-3.5 text-[#C25E00] shrink-0" />
                            <span className="font-semibold text-[#29352F]">
                              Pickup Area: {donation.collectionAddress.areaLocality},{' '}
                              {donation.collectionAddress.city}
                            </span>
                          </div>

                          <span className="text-[11px] text-[#6B756F] italic">
                            Exact street address & donor phone unlock upon claiming.
                          </span>
                        </div>
                      </div>

                      {/* Primary Claim Action */}
                      <button
                        type="button"
                        onClick={() => setClaimModalDonation(donation)}
                        className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#29352F] hover:bg-[#1B231F] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <HeartHandshake className="w-4 h-4" />
                        <span>Claim Food Pickup</span>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* 6. TAB B: My Active Pickups */}
        {activeTab === 'my_pickups' && (
          <div className="space-y-4">
            {myClaimedRuns.length === 0 ? (
              <div className="py-16 text-center rounded-2xl border border-dashed border-[#E6EAE7] bg-[#FAFAFA] p-8">
                <Bike className="w-10 h-10 text-[#6B756F] mx-auto mb-2" />
                <h3 className="font-heading text-sm font-bold text-[#29352F]">
                  You have no active pickups claimed right now
                </h3>
                <p className="text-xs text-[#6B756F] mt-1">
                  Explore available surplus meals in the feed and claim a run.
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('available')}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#29352F] hover:bg-[#1B231F] transition-colors cursor-pointer"
                  >
                    View Available Surplus Food
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {myClaimedRuns.map((donation) => (
                  <div
                    key={donation.id}
                    className="p-5 rounded-2xl border border-[#E6EAE7] bg-white shadow-2xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#E6EAE7] pb-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(donation.status)}
                        <span className="font-heading font-bold text-sm text-[#29352F]">
                          Active Run #{donation.id.slice(0, 10)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenTracker(donation.id)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#29352F] hover:bg-[#1B231F] transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <Bike className="w-3.5 h-3.5" />
                        <span>Live Pickup Tracker</span>
                      </button>
                    </div>

                    {/* Unlocked Collection Address */}
                    <div className="p-3 rounded-xl bg-[#FAFAFA] border border-[#E6EAE7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-[#29352F]">
                        <MapPin className="w-4 h-4 text-[#C25E00] shrink-0" />
                        <div>
                          <span className="font-bold block">
                            {donation.collectionAddress.addressLine1},{' '}
                            {donation.collectionAddress.areaLocality},{' '}
                            {donation.collectionAddress.city}
                          </span>
                          {donation.collectionAddress.landmark && (
                            <span className="text-[11px] text-[#6B756F]">
                              Landmark: {donation.collectionAddress.landmark}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] text-[#6B756F]">
                        Donor Contact: <strong>{donation.donorName}</strong> ({donation.donorPhone})
                      </div>
                    </div>

                    {/* Food Items Table */}
                    <div className="pt-1">
                      <span className="text-[11px] font-bold text-[#6B756F] uppercase tracking-wider block mb-1">
                        Claimed Items ({donation.items.length}) • ~{donation.estimatedPeopleServed} people served
                      </span>
                      <FoodItemsTable
                        items={donation.items}
                        fallbackPhoto={donation.photos[0]}
                        defaultSafeUntil={donation.earliestSafeUntil}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 7. TAB C: Past Deliveries */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {myCompletedRuns.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#6B756F] rounded-2xl border border-dashed border-[#E6EAE7] bg-[#FAFAFA]">
                No completed pickups yet. Your verified runs will appear here.
              </div>
            ) : (
              myCompletedRuns.map((donation) => (
                <div
                  key={donation.id}
                  className="p-5 rounded-2xl border border-[#E6EAE7] bg-[#FAFAFA] space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-[#E6EAE7] pb-2">
                    <div className="space-y-0.5">
                      <span className="font-bold text-sm text-[#29352F]">
                        Delivered Run #{donation.id.slice(0, 10)}
                      </span>
                      <p className="text-[#6B756F]">
                        {donation.totalQuantityLabel} • ~{donation.estimatedPeopleServed} meals distributed
                      </p>
                    </div>
                    <span className="text-[11px] text-[#1B5E20] font-bold bg-[#E8F5E9] px-2.5 py-1 rounded-md border border-[#C8E6C9]">
                      ✓ Completed & Distributed
                    </span>
                  </div>

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

      {/* Claim Confirmation Modal */}
      {claimModalDonation && (
        <ClaimConfirmationModal
          donation={claimModalDonation}
          onClose={() => setClaimModalDonation(null)}
          onClaimSuccess={(claimedId) => {
            setClaimModalDonation(null)
            loadDonations()
            onOpenTracker(claimedId)
          }}
          onRaceCondition={() => {
            setClaimModalDonation(null)
            setRaceConditionNotice(
              'This food donation was just claimed by another volunteer. The available feed has been refreshed.'
            )
            loadDonations()
          }}
        />
      )}

      {/* Race Condition Notice Modal */}
      {raceConditionNotice && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-neutral-900/30 backdrop-blur-2xs flex items-center justify-center p-4"
          onClick={() => setRaceConditionNotice(null)}
        >
          <div
            className="bg-white rounded-2xl border border-amber-200 shadow-xl p-5 max-w-sm w-full space-y-3 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-full bg-[#FFF0DB] text-[#9A3412] flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-sm text-[#29352F]">
              Listing Already Claimed
            </h3>
            <p className="text-xs text-[#6B756F] leading-relaxed">
              {raceConditionNotice}
            </p>
            <button
              type="button"
              onClick={() => setRaceConditionNotice(null)}
              className="w-full py-2 rounded-xl text-xs font-bold text-white bg-[#29352F] cursor-pointer"
            >
              Okay, Got It
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
