import React, { useState, useEffect, useRef } from 'react'
import {
  UtensilsCrossed,
  Bell,
  User,
  LogOut,
  ChevronDown,
  HeartHandshake,
  PackageCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react'
import { useNavigation } from '../../context/useNavigation'
import {
  fetchNotifications,
  markNotificationAsRead,
  getCurrentDonor,
  getCurrentVolunteer,
} from '../../services/donationService'
import type { DonationNotification } from '../../types/donation'
import { ProfileModal } from './ProfileModal'

interface AppHeaderProps {
  currentPortal: 'donor' | 'volunteer'
  activePickupCount?: number
  onNavigateTracking?: (donationId: string) => void
  onProfileUpdated?: () => void
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentPortal,
  activePickupCount = 0,
  onNavigateTracking,
  onProfileUpdated,
}) => {
  const { navigate } = useNavigation()
  const [notifications, setNotifications] = useState<DonationNotification[]>([])
  const [showNotifMenu, setShowNotifMenu] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)

  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const donorProfile = getCurrentDonor()
  const volunteerProfile = getCurrentVolunteer()

  const userName = currentPortal === 'donor' ? donorProfile.name : volunteerProfile.name
  const userSubtext =
    currentPortal === 'donor'
      ? `${donorProfile.donorType === 'restaurant' ? 'Restaurant' : 'Food Donor'} • ${donorProfile.collectionAddress.areaLocality}`
      : `${volunteerProfile.role === 'ngo_member' ? 'NGO Member' : 'Volunteer'} • ${volunteerProfile.vehicle}`

  useEffect(() => {
    let isMounted = true
    const loadNotifications = async () => {
      try {
        const list = await fetchNotifications(
          currentPortal,
          currentPortal === 'donor' ? donorProfile.id : volunteerProfile.id
        )
        if (isMounted) {
          setNotifications(list)
        }
      } catch {
        // ignore
      }
    }

    loadNotifications()
    const interval = setInterval(loadNotifications, 8000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [currentPortal, donorProfile.id, volunteerProfile.id])

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleNotificationClick = async (notif: DonationNotification) => {
    if (!notif.read) {
      await markNotificationAsRead(notif.id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      )
    }
    setShowNotifMenu(false)
    if (notif.donationId && onNavigateTracking) {
      onNavigateTracking(notif.donationId)
    } else if (notif.donationId) {
      navigate(`/tracking/${notif.donationId}`)
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-xs border-b border-[#E6EAE7] transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Portal Badge */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
            aria-label="Share a Meal home"
          >
            <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] border border-[#C8E6C9] flex items-center justify-center text-[#1B5E20] group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-base tracking-tight text-[#29352F]">
                Share a Meal
              </span>
            </div>
          </button>

          {/* Current Role Pill */}
          <div className="hidden sm:flex items-center gap-1.5 ml-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                currentPortal === 'donor'
                  ? 'bg-[#E8F5E9] text-[#1B5E20] border-[#C8E6C9]'
                  : 'bg-[#FFF0DB] text-[#9A3412] border-[#FFE0B2]'
              }`}
            >
              {currentPortal === 'donor' ? (
                <>
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>Donor Portal</span>
                </>
              ) : (
                <>
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span>Volunteer Portal</span>
                </>
              )}
            </span>

            {activePickupCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF3FF] text-[#1E40AF] border border-[#BFDBFE]">
                <Clock className="w-3 h-3 animate-pulse" />
                {activePickupCount} Active
              </span>
            )}
          </div>
        </div>

        {/* Right: Notifications & User Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setShowNotifMenu(!showNotifMenu)
                setShowProfileMenu(false)
              }}
              aria-label="Notifications"
              className="relative p-2 rounded-xl border border-[#E6EAE7] hover:bg-neutral-50 text-[#29352F] transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D32F2F] text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-[#E6EAE7] shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E6EAE7]">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-[#29352F]" />
                    <span className="font-heading text-xs font-bold text-[#29352F]">
                      Notifications
                    </span>
                  </div>
                  <span className="text-[11px] text-[#6B756F]">
                    {unreadCount} unread
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#6B756F]">
                      No notifications right now.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-2.5 rounded-xl text-xs cursor-pointer transition-colors border ${
                          notif.read
                            ? 'bg-neutral-50/60 border-neutral-100 text-[#6B756F]'
                            : 'bg-[#E8F5E9]/40 border-[#C8E6C9] text-[#29352F] font-medium'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <strong className="block text-xs font-bold text-[#29352F]">
                            {notif.title}
                          </strong>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-[#1B5E20] shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-[11px] mt-0.5 leading-snug line-clamp-2">
                          {notif.message}
                        </p>
                        {notif.handoverOtp && (
                          <div className="mt-1.5 inline-block px-2 py-0.5 rounded bg-white border border-[#C8E6C9] font-mono font-bold text-[#1B5E20] text-[11px]">
                            OTP: {notif.handoverOtp}
                          </div>
                        )}
                        <span className="block text-[10px] text-[#6B756F]/80 mt-1">
                          {new Date(notif.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => {
                setShowProfileMenu(!showProfileMenu)
                setShowNotifMenu(false)
              }}
              className="flex items-center gap-2 p-1.5 sm:px-2.5 rounded-xl border border-[#E6EAE7] hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-[#EAF3FF] border border-[#BFDBFE] text-[#1E40AF] flex items-center justify-center font-bold text-xs">
                {userName ? userName.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-[#29352F] leading-tight line-clamp-1 max-w-[120px]">
                  {userName}
                </div>
                <div className="text-[10px] text-[#6B756F] leading-none capitalize">
                  {currentPortal}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#6B756F]" />
            </button>

            {/* Profile Menu Popover */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-[#E6EAE7] shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 mb-2">
                  <div className="font-heading font-bold text-xs text-[#29352F]">
                    {userName}
                  </div>
                  <div className="text-[11px] text-[#6B756F] mt-0.5">
                    {userSubtext}
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[#1B5E20] bg-[#E8F5E9] px-2 py-0.5 rounded-md border border-[#C8E6C9]">
                    <CheckCircle2 className="w-3 h-3" />
                    Phone & Safety Verified
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false)
                      setShowProfileModal(true)
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#E8F5E9] text-[#29352F] font-semibold transition-colors text-left cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-[#1B5E20]" />
                      <span>View & Edit Profile</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#1B5E20]" />
                  </button>

                  <div className="pt-1 border-t border-[#E6EAE7]">
                    <button
                      type="button"
                      onClick={() => navigate('/')}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-100 text-[#6B756F] font-medium transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Return to Landing Page</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showProfileModal && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          role={currentPortal}
          onProfileUpdated={onProfileUpdated}
        />
      )}
    </header>
  )
}
