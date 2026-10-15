import { useState } from 'react'
import { Header } from './components/Header'
import { HeroSection } from './components/HeroSection'
import { NavigationProvider } from './context/NavigationContext'
import { useNavigation } from './context/useNavigation'

import { VolunteerRegistration } from './components/volunteer/VolunteerRegistration'
import { DonorRegistration } from './components/donor/DonorRegistration'
import { DonorDashboard } from './components/dashboard/DonorDashboard'
import { VolunteerDashboard } from './components/dashboard/VolunteerDashboard'
import { DonateNowForm } from './components/donor/DonateNowForm'
import { PickupTracker } from './components/tracking/PickupTracker'
import { NotFound } from './components/common/NotFound'
import {
  PackageCheck,
  HeartHandshake,
  ArrowRight,
  X,
  LogIn,
} from 'lucide-react'

import { getActiveRole, setActiveRole } from './services/donationService'

const CURRENT_YEAR = 2026

function AppContent() {
  const { currentPath, navigate } = useNavigation()
  const activeRole = getActiveRole()

  // Sign In modal state
  const [showSignInModal, setShowSignInModal] = useState(false)

  // Newly created donation alert state (strictly transient in-memory; never re-shown on refresh)
  const [newlyCreatedDonation, setNewlyCreatedDonation] = useState<{
    id: string
    otp: string
  } | null>(null)

  // Direct navigation from landing page actions
  const handleActionClick = (role: 'donor' | 'volunteer') => {
    setActiveRole(role)
    if (role === 'donor') {
      navigate('/register/donor')
    } else {
      navigate('/register/volunteer')
    }
  }

  const handleSignInClick = () => {
    setShowSignInModal(true)
  }

  // 1. Volunteer Registration Flow
  if (currentPath === '/register/volunteer') {
    return <VolunteerRegistration />
  }

  // 2. Donor Registration Flow
  if (currentPath === '/register/donor') {
    return <DonorRegistration />
  }

  // 3. Donate Surplus Food Form (Protected: donors only)
  if (currentPath === '/donor/donate') {
    if (activeRole === 'volunteer') {
      navigate('/volunteer/dashboard')
      return null
    }
    return (
      <DonateNowForm
        onBack={() => navigate('/donor/dashboard')}
        onSuccess={(id, otp) => {
          setNewlyCreatedDonation({ id, otp })
          navigate('/donor/dashboard')
        }}
      />
    )
  }

  // 4. Donor Dashboard (Protected: donors only)
  if (currentPath === '/donor/dashboard') {
    if (activeRole === 'volunteer') {
      navigate('/volunteer/dashboard')
      return null
    }
    return (
      <DonorDashboard
        onOpenDonateForm={() => navigate('/donor/donate')}
        onOpenTracker={(donationId) => navigate(`/tracking/${donationId}`)}
        justCreatedDonationId={newlyCreatedDonation?.id}
        justCreatedOtp={newlyCreatedDonation?.otp}
        onDismissSuccessModal={() => setNewlyCreatedDonation(null)}
      />
    )
  }

  // 5. Volunteer Dashboard (Protected: volunteers only)
  if (currentPath === '/volunteer/dashboard') {
    if (activeRole === 'donor') {
      navigate('/donor/dashboard')
      return null
    }
    return (
      <VolunteerDashboard
        onOpenTracker={(donationId) => navigate(`/tracking/${donationId}`)}
      />
    )
  }

  // 6. Live Rapido-Style Pickup Tracker (Role-specific view)
  if (currentPath.startsWith('/tracking/')) {
    const donationId = currentPath.replace('/tracking/', '')
    return (
      <PickupTracker
        donationId={donationId}
        userRole={activeRole || 'donor'}
        onBack={() => {
          if (activeRole === 'volunteer') {
            navigate('/volunteer/dashboard')
          } else {
            navigate('/donor/dashboard')
          }
        }}
      />
    )
  }

  // 7. 404 Not Found for any unrecognized paths
  if (currentPath !== '/' && currentPath !== '') {
    return <NotFound onHomeClick={() => navigate('/')} />
  }

  // 8. Landing Page View (Preserved completely)
  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-800">
      {/* 1. Compact Header */}
      <Header onSignInClick={handleSignInClick} />

      {/* 2. Main Hero Section with introduction, actions, and impact highlights */}
      <HeroSection onActionClick={handleActionClick} />

      {/* Modal for Sign In Portal Selection */}
      {showSignInModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          className="fixed inset-0 z-50 bg-neutral-900/30 backdrop-blur-2xs flex items-center justify-center p-4"
          onClick={() => setShowSignInModal(false)}
        >
          <div
            className="bg-white rounded-2xl border border-neutral-200 shadow-xl p-6 max-w-sm w-full relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowSignInModal(false)}
              aria-label="Close dialog"
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 p-1 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#E8F5E9] border border-[#C8E6C9] flex items-center justify-center text-[#1B5E20]">
                <LogIn className="w-4 h-4" />
              </div>
              <div>
                <h3 id="dialog-title" className="font-heading font-bold text-neutral-900 text-sm">
                  Sign In to Share a Meal
                </h3>
                <p className="text-xs text-neutral-500">
                  Select your portal to access your account:
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              {/* Donor Portal option */}
              <button
                type="button"
                onClick={() => {
                  setShowSignInModal(false)
                  navigate('/donor/dashboard')
                }}
                className="w-full p-3.5 rounded-xl border border-[#C8E6C9] bg-[#E8F5E9]/50 hover:bg-[#E8F5E9] text-left transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#C8E6C9] text-[#1B5E20] flex items-center justify-center">
                    <PackageCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-xs text-[#29352F]">
                      Food Donor Portal
                    </div>
                    <div className="text-[11px] text-[#6B756F]">
                      Restaurants, Caterers & Households
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#1B5E20] group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Volunteer Portal option */}
              <button
                type="button"
                onClick={() => {
                  setShowSignInModal(false)
                  navigate('/volunteer/dashboard')
                }}
                className="w-full p-3.5 rounded-xl border border-[#FFE0B2] bg-[#FFF0DB]/50 hover:bg-[#FFF0DB] text-left transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#FFE0B2] text-[#9A3412] flex items-center justify-center">
                    <HeartHandshake className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-xs text-[#29352F]">
                      Volunteer & NGO Portal
                    </div>
                    <div className="text-[11px] text-[#6B756F]">
                      Claim nearby runs & distribute meals
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#9A3412] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="pt-2 text-center text-xs text-neutral-500 border-t border-neutral-100">
              New to Share a Meal?{' '}
              <button
                type="button"
                onClick={() => {
                  setShowSignInModal(false)
                  navigate('/register/donor')
                }}
                className="text-[#1B5E20] font-bold hover:underline cursor-pointer"
              >
                Register as Donor
              </button>{' '}
              or{' '}
              <button
                type="button"
                onClick={() => {
                  setShowSignInModal(false)
                  navigate('/register/volunteer')
                }}
                className="text-[#9A3412] font-bold hover:underline cursor-pointer"
              >
                Volunteer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minimal clean footer integrated into the bottom wave */}
      <footer className="py-3.5 bg-[#F2F9F5] text-center text-[11px] text-[#5A6760]/80">
        <p>&copy; {CURRENT_YEAR} Share a Meal. Connecting surplus food with care.</p>
      </footer>
    </div>
  )
}

export function App() {
  return (
    <NavigationProvider>
      <AppContent />
    </NavigationProvider>
  )
}

export default App
