import React, { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import {
  ArrowLeft,
  Bike,
  MapPin,
  Phone,
  CheckCircle2,
  KeyRound,
  AlertCircle,
  Navigation,
  RefreshCw,
  Route,
  Timer,
} from 'lucide-react'
import { useNavigation } from '../../context/useNavigation'
import {
  fetchDonationById,
  updatePickupStatus,
  verifyHandoverOtp,
  getCurrentDonor,
  getCurrentVolunteer,
  getActiveRole,
  sendVolunteerLocation,
} from '../../services/donationService'
import type { Donation, DonationStatus } from '../../types/donation'

interface PickupTrackerProps {
  donationId: string
  initialRole?: 'donor' | 'volunteer'
  userRole?: 'donor' | 'volunteer'
  onBack?: () => void
}

const STATUS_STEPS: Array<{ id: DonationStatus; label: string; desc: string }> = [
  { id: 'claimed', label: 'Claimed', desc: 'Volunteer assigned' },
  { id: 'en_route', label: 'En Route', desc: 'On the way to donor' },
  { id: 'arrived', label: 'Arrived', desc: 'At collection spot' },
  { id: 'collected', label: 'Collected', desc: 'Handover OTP verified' },
  { id: 'completed', label: 'Completed', desc: 'Delivered to beneficiaries' },
]

const distanceInKm = (from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }) => {
  const radiusKm = 6371
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180
  const latitudeDelta = toRadians(to.latitude - from.latitude)
  const longitudeDelta = toRadians(to.longitude - from.longitude)
  const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(longitudeDelta / 2) ** 2
  return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const formatArrival = (minutes: number) => minutes <= 1 ? 'Arriving now' : `Arriving in ${minutes} min`

export const PickupTracker: React.FC<PickupTrackerProps> = ({
  donationId,
  initialRole,
  userRole,
  onBack,
}) => {
  const { navigate } = useNavigation()

  // Active view role is strictly determined from authenticated role or initialRole prop (no manual switching)
  const activeRole: 'donor' | 'volunteer' = initialRole || userRole || getActiveRole() || 'donor'

  const donorProfile = getCurrentDonor()
  const volunteerProfile = getCurrentVolunteer()

  const [donation, setDonation] = useState<Donation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Real Volunteer GPS Location Broadcasting State
  const [isBroadcastingGps, setIsBroadcastingGps] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [lastBroadcastTime, setLastBroadcastTime] = useState<Date | null>(null)
  const watchIdRef = useRef<number | null>(null)

  // Handover OTP Input State for Volunteer
  const [otpInput, setOtpInput] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [showOtpInputModal, setShowOtpInputModal] = useState(false)
  const [clockNow, setClockNow] = useState(() => Date.now())

  // Map references
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const donorMarkerRef = useRef<L.Marker | null>(null)
  const volunteerMarkerRef = useRef<L.Marker | null>(null)
  const routeLineRef = useRef<L.Polyline | null>(null)

  // Load donation details
  const loadDonation = React.useCallback(async () => {
    try {
      const data = await fetchDonationById(
        donationId,
        activeRole,
        activeRole === 'donor' ? donorProfile.id : volunteerProfile.id
      )
      setDonation(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tracking details.')
    } finally {
      setLoading(false)
    }
  }, [donationId, activeRole, donorProfile.id, volunteerProfile.id])

  useEffect(() => {
    loadDonation()
    const timer = setInterval(loadDonation, 4000)
    return () => clearInterval(timer)
  }, [loadDonation])

  // The donor ETA is a local, rough travel estimate. It begins only when the
  // volunteer marks the pickup En Route and does not alter persisted pickup data.
  useEffect(() => {
    if (donation?.status !== 'en_route') return
    const interval = window.setInterval(() => setClockNow(Date.now()), 30_000)
    return () => window.clearInterval(interval)
  }, [donation?.status])

  // Map setup and update
  useEffect(() => {
    if (!mapContainerRef.current || !donation) return

    const donorLat = donation.collectionAddress.latitude || 12.9784
    const donorLng = donation.collectionAddress.longitude || 77.6408

    const volLat = donation.claim?.volunteerCoordinates?.latitude || donorLat + 0.008
    const volLng = donation.claim?.volunteerCoordinates?.longitude || donorLng + 0.009

    // Create Pin Icons
    const donorIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="transform: translate(-50%, -100%);">
          <div style="background: #1B5E20; color: white; padding: 6px; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.2); border: 2px solid white; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
              <line x1="6" y1="1" x2="6" y2="4"></line>
              <line x1="10" y1="1" x2="10" y2="4"></line>
              <line x1="14" y1="1" x2="14" y2="4"></line>
            </svg>
          </div>
          <div style="background: #29352F; color: white; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-align: center; margin-top: 4px; white-space: nowrap;">
            Food Collection Point
          </div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    })

    const volunteerIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="transform: translate(-50%, -100%);">
          <div style="background: #9A3412; color: white; padding: 6px; border-radius: 50%; box-shadow: 0 4px 14px rgba(154,52,18,0.4); border: 2px solid white; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="18.5" cy="17.5" r="3.5"></circle>
              <circle cx="5.5" cy="17.5" r="3.5"></circle>
              <circle cx="15" cy="5" r="1"></circle>
              <path d="M12 17.5V14l-3-3 4-3 2 3h2"></path>
            </svg>
          </div>
          <div style="background: #9A3412; color: white; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-align: center; margin-top: 4px; white-space: nowrap;">
            Volunteer • ${donation.claim?.volunteerName || 'En Route'}
          </div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    })

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [donorLat, donorLng],
        zoom: 14,
        scrollWheelZoom: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      const donorMarker = L.marker([donorLat, donorLng], { icon: donorIcon }).addTo(map)
      const volMarker = L.marker([volLat, volLng], { icon: volunteerIcon }).addTo(map)

      const routeLine = L.polyline(
        [
          [volLat, volLng],
          [donorLat, donorLng],
        ],
        {
          color: '#9A3412',
          weight: 4,
          dashArray: '8, 8',
          opacity: 0.8,
        }
      ).addTo(map)

      mapInstanceRef.current = map
      donorMarkerRef.current = donorMarker
      volunteerMarkerRef.current = volMarker
      routeLineRef.current = routeLine

      // Fit bounds to show both markers
      const bounds = L.latLngBounds([
        [donorLat, donorLng],
        [volLat, volLng],
      ])
      map.fitBounds(bounds, { padding: [50, 50] })
    } else {
      // Update existing markers
      if (donorMarkerRef.current) {
        donorMarkerRef.current.setLatLng([donorLat, donorLng])
      }
      if (volunteerMarkerRef.current) {
        volunteerMarkerRef.current.setLatLng([volLat, volLng])
      }
      if (routeLineRef.current) {
        routeLineRef.current.setLatLngs([
          [volLat, volLng],
          [donorLat, donorLng],
        ])
      }
    }
  }, [donation])

  // Start Real Volunteer GPS Location Broadcast
  const startGpsBroadcast = React.useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.')
      return
    }
    setGpsError(null)
    setIsBroadcastingGps(true)

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        try {
          const lat = Number(pos.coords.latitude.toFixed(6))
          const lng = Number(pos.coords.longitude.toFixed(6))
          await sendVolunteerLocation(donationId, {
            latitude: lat,
            longitude: lng,
          })
          setLastBroadcastTime(new Date())
        } catch {
          // ignore transient broadcast failure
        }
      },
      (err) => {
        setGpsError(err.message || 'GPS location tracking permission denied.')
        setIsBroadcastingGps(false)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      }
    )
  }, [donationId])

  // Stop GPS Location Broadcast
  const stopGpsBroadcast = React.useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsBroadcastingGps(false)
  }, [])

  // Cleanup GPS watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  // Stop tracking automatically if collected or completed
  useEffect(() => {
    if (donation?.status === 'collected' || donation?.status === 'completed') {
      stopGpsBroadcast()
    }
  }, [donation?.status, stopGpsBroadcast])

  // Handle Volunteer State Progression
  const handleAdvanceStatus = async (nextStatus: DonationStatus) => {
    if (!donation) return
    setIsUpdatingStatus(true)
    try {
      let currentCoords: { latitude: number; longitude: number } | undefined = donation.claim
        ?.volunteerCoordinates
        ? {
            latitude: donation.claim.volunteerCoordinates.latitude,
            longitude: donation.claim.volunteerCoordinates.longitude,
          }
        : undefined

      // Try acquiring genuine device GPS position if available
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 3000,
              enableHighAccuracy: true,
            })
          })
          currentCoords = {
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
          }
        } catch {
          // retain existing coordinates
        }
      }

      await updatePickupStatus(donation.id, nextStatus, volunteerProfile.id, {
        coordinates: currentCoords,
      })

      // If transitioning to en_route or arrived, automatically start GPS broadcasting
      if (nextStatus === 'en_route' || nextStatus === 'arrived') {
        startGpsBroadcast()
      }

      await loadDonation()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to advance status.')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Handle Handover OTP Verification Gate
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!donation || !otpInput.trim()) {
      setOtpError('Please enter the 6-digit Handover OTP provided by the food donor.')
      return
    }

    setIsVerifyingOtp(true)
    setOtpError(null)

    try {
      const res = await verifyHandoverOtp(donation.id, otpInput.trim(), volunteerProfile.id)
      if (res.success) {
        setShowOtpInputModal(false)
        setOtpInput('')
        await loadDonation()
      }
    } catch (err) {
      setOtpError(
        err instanceof Error
          ? err.message
          : 'Incorrect Handover OTP. Please ask the food donor for their 6-digit code.'
      )
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  // Determine current active step index
  const getCurrentStepIndex = () => {
    if (!donation) return 0
    switch (donation.status) {
      case 'claimed':
        return 0
      case 'en_route':
        return 1
      case 'arrived':
        return 2
      case 'collected':
        return 3
      case 'completed':
        return 4
      default:
        return 0
    }
  }

  const currentStepIdx = getCurrentStepIndex()
  const enRouteTimestamp = donation?.claim?.statusHistory.find((entry) => entry.status === 'en_route')?.timestamp
  const volunteerCoordinates = donation?.claim?.volunteerCoordinates
  const pickupCoordinates = typeof donation?.collectionAddress.latitude === 'number' && typeof donation?.collectionAddress.longitude === 'number'
    ? { latitude: donation.collectionAddress.latitude, longitude: donation.collectionAddress.longitude }
    : null
  const estimatedDistanceKm = volunteerCoordinates && pickupCoordinates
    ? distanceInKm(volunteerCoordinates, pickupCoordinates)
    : null
  const initialEtaMinutes = estimatedDistanceKm === null
    ? null
    : Math.max(3, Math.ceil((estimatedDistanceKm / 18) * 60) + 2)
  const elapsedMinutes = enRouteTimestamp ? Math.floor((clockNow - new Date(enRouteTimestamp).getTime()) / 60_000) : 0
  const minutesRemaining = initialEtaMinutes === null ? null : Math.max(0, initialEtaMinutes - Math.max(0, elapsedMinutes))

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-[#29352F] flex items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#29352F]" />
          <p className="text-xs text-[#6B756F]">Loading live pickup tracker...</p>
        </div>
      </div>
    )
  }

  if (error || !donation) {
    return (
      <div className="min-h-screen bg-white text-[#29352F] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-2xl border border-red-200 bg-red-50 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
          <h2 className="font-heading font-bold text-base text-[#29352F]">
            Tracking Session Unavailable
          </h2>
          <p className="text-xs text-red-700">{error || 'Donation record not found.'}</p>
          <button
            type="button"
            onClick={() => (onBack ? onBack() : navigate('/'))}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#29352F] cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#29352F] antialiased flex flex-col pb-16">
      {/* 1. Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-[#E6EAE7]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (onBack) {
                onBack()
              } else if (activeRole === 'donor') {
                navigate('/donor/dashboard')
              } else {
                navigate('/volunteer/dashboard')
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B756F] hover:text-[#29352F] px-3 py-1.5 rounded-lg border border-[#E6EAE7] hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>

          <div className="text-center">
            <span className="font-heading font-extrabold text-sm text-[#29352F]">
              Live Pickup Tracker
            </span>
            <div className="text-[11px] text-[#6B756F] flex items-center justify-center gap-1.5">
              <span>Run #{donation.id.slice(0, 10)}</span>
              <span>•</span>
              <span className="capitalize font-semibold text-[#1B5E20]">
                {donation.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Role Indicator Badge (Role strictly determined from authentication) */}
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                activeRole === 'donor'
                  ? 'bg-[#E8F5E9] text-[#1B5E20] border-[#C8E6C9]'
                  : 'bg-[#FFF0DB] text-[#9A3412] border-[#FFE0B2]'
              }`}
            >
              {activeRole === 'donor' ? 'Donor Tracking View' : 'Volunteer Pickup View'}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 2. Rapido-Style Status Stepper */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E6EAE7] shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6EAE7]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6B756F]">
              Pickup Progression
            </span>
            <span className="text-xs font-bold text-[#1B5E20] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#1B5E20] animate-pulse" />
              Live Status Sync
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1 pt-2">
            {STATUS_STEPS.map((step, idx) => {
              const isPast = idx < currentStepIdx
              const isCurrent = idx === currentStepIdx
              return (
                <div key={step.id} className="flex flex-col items-center text-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isPast
                        ? 'bg-[#1B5E20] text-white'
                        : isCurrent
                        ? 'bg-[#29352F] text-white ring-4 ring-[#29352F]/15 animate-pulse'
                        : 'bg-neutral-100 text-[#6B756F] border border-[#E6EAE7]'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] font-bold mt-1.5 truncate max-w-full ${
                      isCurrent
                        ? 'text-[#29352F]'
                        : isPast
                        ? 'text-[#1B5E20]'
                        : 'text-[#6B756F]'
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className="text-[9px] text-[#6B756F] hidden sm:block truncate max-w-full">
                    {step.desc}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* 3. The map remains available to the volunteer. Donors see a simple arrival estimate instead. */}
        {activeRole === 'volunteer' && <div className="bg-white rounded-2xl border border-[#E6EAE7] shadow-2xs overflow-hidden">
          {/* Map Status Header */}
          <div className="p-3.5 bg-[#FAFAFA] border-b border-[#E6EAE7] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Bike className="w-4 h-4 text-[#9A3412] shrink-0" />
              <span className="font-semibold text-[#29352F]">
                Volunteer {donation.claim?.volunteerName || 'Partner'}
                {donation.status === 'en_route'
                  ? ' is en route to pickup location'
                  : donation.status === 'arrived'
                  ? ' has arrived at the collection point'
                  : donation.status === 'collected'
                  ? ' has collected the surplus food'
                  : ' is assigned to this pickup'}
              </span>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {donation.claim?.isBroadcastingGps && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live GPS
                </span>
              )}
              {donation.claim?.lastLocationUpdate && (
                <span className="text-[11px] text-[#6B756F]">
                  Updated:{' '}
                  {new Date(donation.claim.lastLocationUpdate).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Map canvas */}
          <div className="h-72 sm:h-96 w-full relative">
            <div ref={mapContainerRef} className="w-full h-full" />
          </div>
        </div>}

        {activeRole === 'donor' && (
          <section className="overflow-hidden rounded-2xl border border-[#C8E6C9] bg-white shadow-2xs">
            <div className="flex flex-col gap-4 bg-gradient-to-r from-[#E8F5E9] via-[#F7FCF7] to-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-start gap-3.5">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${donation.status === 'en_route' ? 'bg-[#1B5E20] text-white shadow-sm' : donation.status === 'arrived' ? 'bg-[#FFF0DB] text-[#9A3412]' : 'bg-white text-[#1B5E20] border border-[#C8E6C9]'}`}>
                  {donation.status === 'en_route' ? <Bike className="h-6 w-6" /> : <MapPin className="h-6 w-6" />}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#1B5E20]">Volunteer arrival update</p>
                  <h2 className="mt-1 font-heading text-xl font-extrabold text-[#29352F]">
                    {donation.status === 'en_route'
                      ? minutesRemaining === null
                        ? 'Volunteer is on the way'
                        : formatArrival(minutesRemaining)
                      : donation.status === 'arrived'
                      ? 'Your volunteer has arrived'
                      : donation.status === 'collected' || donation.status === 'completed'
                      ? 'Pickup is complete'
                      : 'Volunteer assigned — waiting to start'}
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-[#536058]">
                    {donation.status === 'en_route'
                      ? `This is a rough local travel estimate for ${donation.claim?.volunteerName || 'your volunteer'}, not live navigation.`
                      : donation.status === 'arrived'
                      ? 'Please meet the volunteer and share the handover OTP after the food is inspected.'
                      : 'The estimated arrival countdown starts when the volunteer begins the journey.'}
                  </p>
                </div>
              </div>

              {donation.status === 'en_route' && minutesRemaining !== null && (
                <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-[#C8E6C9] bg-white px-4 py-3 text-[#1B5E20] shadow-2xs">
                  <Timer className="h-5 w-5" />
                  <div><p className="text-[10px] font-bold uppercase tracking-wider">Estimated arrival</p><p className="font-heading text-xl font-extrabold">{minutesRemaining <= 1 ? 'Now' : `${minutesRemaining} min`}</p></div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5">
              <div className="flex items-center gap-3 rounded-xl border border-[#E6EAE7] bg-[#FAFAFA] p-3.5">
                <Route className="h-5 w-5 shrink-0 text-[#C25E00]" />
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-[#6B756F]">Approximate distance</p><p className="mt-0.5 text-sm font-bold text-[#29352F]">{estimatedDistanceKm === null ? 'Calculating when journey begins' : `${estimatedDistanceKm.toFixed(1)} km away`}</p></div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-[#E6EAE7] bg-[#FAFAFA] p-3.5">
                <CheckCircle2 className={`h-5 w-5 shrink-0 ${donation.status === 'arrived' ? 'text-[#1B5E20]' : 'text-[#6B756F]'}`} />
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-[#6B756F]">Pickup status</p><p className="mt-0.5 text-sm font-bold capitalize text-[#29352F]">{donation.status.replace('_', ' ')}</p></div>
              </div>
            </div>
          </section>
        )}

        {/* 4. Role-Specific Action Panels */}

        {/* ======================================================== */}
        {/* DONOR PERSPECTIVE PANEL */}
        {/* ======================================================== */}
        {activeRole === 'donor' && (
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E6EAE7] shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6EAE7]">
              <div>
                <h3 className="font-heading font-extrabold text-base text-[#29352F]">
                  Donor Pickup Controls
                </h3>
                <p className="text-xs text-[#6B756F]">
                  Share your Handover OTP in person once volunteer arrives
                </p>
              </div>

              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9]">
                Donor View
              </span>
            </div>

            {/* PROMINENT HANDOVER OTP DISPLAY BANNER */}
            <div className="p-5 rounded-2xl bg-[#E8F5E9]/70 border-2 border-[#C8E6C9] text-center space-y-2 shadow-2xs">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1B5E20]">
                <KeyRound className="w-4 h-4" />
                <span>Your Single-Use Handover OTP</span>
              </div>

              <div className="py-2.5 bg-white rounded-xl border border-[#C8E6C9] max-w-xs mx-auto font-mono text-3xl font-black text-[#1B5E20] tracking-widest shadow-xs">
                {donation.handoverOtp}
              </div>

              <p className="text-xs text-[#29352F] max-w-md mx-auto leading-relaxed">
                Provide this code to volunteer{' '}
                <strong>{donation.claim?.volunteerName || 'Vikram'}</strong> in person when they inspect and collect the food. They will enter it into their device to verify pickup.
              </p>
            </div>

            {/* Live GPS Telemetry Status for Donor */}
            {donation.claim && (
              <div className="p-3.5 rounded-xl bg-[#FAFAFA] border border-[#E6EAE7] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      donation.claim.isBroadcastingGps
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-neutral-400'
                    }`}
                  />
                  <span className="font-semibold text-[#29352F]">
                    Volunteer Live GPS:{' '}
                    {donation.claim.isBroadcastingGps
                      ? 'Live GPS Broadcast Active'
                      : 'Waiting for volunteer to start broadcast'}
                  </span>
                </div>

                {donation.claim.lastLocationUpdate && (
                  <span className="text-[11px] text-[#6B756F]">
                    Last ping: {new Date(donation.claim.lastLocationUpdate).toLocaleTimeString()}
                  </span>
                )}
              </div>
            )}

            {/* Assigned Volunteer Details Card */}
            {donation.claim && (
              <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E6EAE7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EAF3FF] border border-[#BFDBFE] text-[#1E40AF] font-bold flex items-center justify-center text-sm">
                    {donation.claim.volunteerName.charAt(0)}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B756F] block">
                      Assigned Volunteer
                    </span>
                    <div className="font-bold text-[#29352F] text-sm">
                      {donation.claim.volunteerName}
                    </div>
                    <div className="text-[11px] text-[#6B756F]">
                      {donation.claim.volunteerVehicle || 'Two-Wheeler'} • Verified Community Volunteer
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${donation.claim.volunteerPhone}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E6EAE7] text-[#29352F] font-bold hover:bg-neutral-50 transition-colors cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#1B5E20]" />
                    <span>Call Volunteer ({donation.claim.volunteerPhone})</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* VOLUNTEER PERSPECTIVE PANEL */}
        {/* ======================================================== */}
        {activeRole === 'volunteer' && (
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E6EAE7] shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6EAE7]">
              <div>
                <h3 className="font-heading font-extrabold text-base text-[#29352F]">
                  Volunteer Pickup Controls
                </h3>
                <p className="text-xs text-[#6B756F]">
                  Full donor address and phone unlocked for coordination
                </p>
              </div>

              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFF0DB] text-[#9A3412] border border-[#FFE0B2]">
                Volunteer View
              </span>
            </div>

            {/* GPS Location Broadcast Control for Volunteer */}
            {(donation.status === 'claimed' ||
              donation.status === 'en_route' ||
              donation.status === 'arrived') && (
              <div className="p-4 rounded-xl bg-[#EAF3FF] border border-[#BFDBFE] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-3 h-3 rounded-full shrink-0 ${
                      isBroadcastingGps ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'
                    }`}
                  />
                  <div>
                    <div className="font-bold text-[#1E40AF]">
                      {isBroadcastingGps
                        ? 'Broadcasting Real-Time Location'
                        : 'Real-Time Location Broadcast Inactive'}
                    </div>
                    <div className="text-[11px] text-[#6B756F]">
                      {isBroadcastingGps
                        ? `Transmitting coordinates to donor. Last ping: ${
                            lastBroadcastTime ? lastBroadcastTime.toLocaleTimeString() : 'just now'
                          }`
                        : 'Allow the food donor to track your approach live on the map.'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={isBroadcastingGps ? stopGpsBroadcast : startGpsBroadcast}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs self-end sm:self-auto ${
                    isBroadcastingGps
                      ? 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
                      : 'bg-[#1E40AF] text-white hover:bg-[#1e3a8a]'
                  }`}
                >
                  {isBroadcastingGps ? 'Stop Live GPS Broadcast' : 'Start Live GPS Broadcast'}
                </button>
              </div>
            )}

            {gpsError && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{gpsError}</span>
              </div>
            )}

            {/* Unlocked Address Card */}
            <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E6EAE7] space-y-2 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B5E20] block">
                    Unlocked Collection Point:
                  </span>
                  <div className="font-bold text-sm text-[#29352F] mt-0.5">
                    {donation.collectionAddress.addressLine1}
                  </div>
                  {donation.collectionAddress.addressLine2 && (
                    <div className="text-[#6B756F]">
                      {donation.collectionAddress.addressLine2}
                    </div>
                  )}
                  <div className="text-[#6B756F]">
                    {donation.collectionAddress.areaLocality},{' '}
                    {donation.collectionAddress.city} - {donation.collectionAddress.pincode}
                  </div>
                </div>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${donation.collectionAddress.latitude},${donation.collectionAddress.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-[#E6EAE7] text-[#29352F] font-bold hover:bg-neutral-50 shrink-0"
                >
                  <Navigation className="w-3.5 h-3.5 text-[#1E40AF]" />
                  <span>Navigate</span>
                </a>
              </div>

              {donation.collectionAddress.landmark && (
                <div className="text-[11px] text-[#6B756F] pt-1 border-t border-[#E6EAE7]">
                  <strong>Landmark:</strong> {donation.collectionAddress.landmark}
                </div>
              )}

              {donation.pickupSchedule.pickupInstructions && (
                <div className="text-[11px] text-[#6B756F] italic">
                  <strong>Pickup Note:</strong> "{donation.pickupSchedule.pickupInstructions}"
                </div>
              )}

              <div className="pt-2 flex items-center justify-between text-xs border-t border-[#E6EAE7]">
                <span className="text-[#6B756F]">
                  Donor Contact: <strong>{donation.donorName}</strong>
                </span>
                <a
                  href={`tel:${donation.donorPhone}`}
                  className="inline-flex items-center gap-1 text-[#1B5E20] font-bold hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{donation.donorPhone}</span>
                </a>
              </div>
            </div>

            {/* Stepper Progression Button for Volunteer */}
            <div className="pt-2">
              {donation.status === 'claimed' && (
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleAdvanceStatus('en_route')}
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#29352F] hover:bg-[#1B231F] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <Bike className="w-4 h-4" />
                  <span>Start Journey (Mark as En Route)</span>
                </button>
              )}

              {donation.status === 'en_route' && (
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleAdvanceStatus('arrived')}
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#29352F] hover:bg-[#1B231F] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <MapPin className="w-4 h-4" />
                  <span>I Have Arrived at Collection Location</span>
                </button>
              )}

              {donation.status === 'arrived' && (
                <button
                  type="button"
                  onClick={() => setShowOtpInputModal(true)}
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#1B5E20] hover:bg-[#144718] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs animate-bounce"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Verify Collection (Enter Handover OTP)</span>
                </button>
              )}

              {donation.status === 'collected' && (
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleAdvanceStatus('completed')}
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#29352F] hover:bg-[#1B231F] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#C8E6C9]" />
                  <span>Mark as Completed / Delivered to Beneficiaries</span>
                </button>
              )}

              {donation.status === 'completed' && (
                <div className="p-4 rounded-xl bg-[#E8F5E9] border border-[#C8E6C9] text-center space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-[#1B5E20] mx-auto" />
                  <div className="font-heading font-bold text-sm text-[#1B5E20]">
                    Delivery Completed!
                  </div>
                  <p className="text-xs text-[#29352F]">
                    Thank you for volunteering. ~{donation.estimatedPeopleServed} people received nutritious surplus meals.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* HANDOVER OTP ENTRY MODAL FOR VOLUNTEER */}
      {showOtpInputModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-neutral-900/50 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowOtpInputModal(false)}
        >
          <div
            className="bg-white rounded-2xl border border-[#E6EAE7] shadow-2xl p-6 max-w-sm w-full space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-[#E8F5E9] border border-[#C8E6C9] text-[#1B5E20] flex items-center justify-center mx-auto">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-extrabold text-base text-[#29352F]">
                Enter Pickup Handover OTP
              </h3>
              <p className="text-xs text-[#6B756F]">
                Ask the food donor for their 6-digit verification code.
              </p>
            </div>

            {otpError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#29352F] mb-1.5 text-center">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  value={otpInput}
                  onChange={(e) => {
                    setOtpInput(e.target.value.replace(/\D/g, ''))
                    setOtpError(null)
                  }}
                  placeholder="• • • • • •"
                  className="w-full py-3 text-center font-mono text-2xl font-black tracking-widest rounded-xl border border-[#E6EAE7] bg-[#FAFAFA] text-[#29352F] focus:outline-none focus:border-[#29352F] focus:bg-white"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowOtpInputModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-[#6B756F] hover:bg-neutral-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingOtp || otpInput.length < 4}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1B5E20] hover:bg-[#144718] disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  {isVerifyingOtp ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Confirm Handover</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
