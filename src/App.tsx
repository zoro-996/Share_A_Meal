import { useEffect, useState } from 'react'
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
import { LoginPage } from './components/common/LoginPage'
import { clearCurrentSession, getActiveRole, saveCurrentDonor, saveCurrentVolunteer, setActiveRole } from './services/donationService'
import { getAuthenticatedProfile } from './services/authService'
import { supabase } from './services/supabaseClient'

const CURRENT_YEAR = 2026

type PortalRole = 'donor' | 'volunteer'

function getLocalPreviewRole(): PortalRole | null {
  if (!import.meta.env.DEV) return null
  const previewRole = new URLSearchParams(window.location.search).get('previewRole')
  return previewRole === 'donor' || previewRole === 'volunteer' ? previewRole : null
}

function AppContent() {
  const { currentPath, navigate } = useNavigation()
  // Localhost-only visual preview. Production builds always require Supabase authentication.
  const localPreviewRole = getLocalPreviewRole()
  const [authRole, setAuthRole] = useState<PortalRole | null>(getActiveRole() || localPreviewRole)
  const [isRestoringSession, setIsRestoringSession] = useState(true)
  const [newlyCreatedDonation, setNewlyCreatedDonation] = useState<{ id: string; otp: string } | null>(null)

  const restoreAuthenticatedProfile = async () => {
    const authenticated = await getAuthenticatedProfile()
    if (!authenticated) {
      clearCurrentSession()
      setAuthRole(null)
      return null
    }
    setActiveRole(authenticated.role)
    setAuthRole(authenticated.role)
    if (authenticated.role === 'donor') saveCurrentDonor(authenticated.profile)
    else saveCurrentVolunteer(authenticated.profile)
    return authenticated
  }

  useEffect(() => {
    if (localPreviewRole) {
      setIsRestoringSession(false)
      return
    }
    restoreAuthenticatedProfile()
      .catch(() => { clearCurrentSession(); setAuthRole(null) })
      .finally(() => setIsRestoringSession(false))
  }, [localPreviewRole])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !localPreviewRole) {
        clearCurrentSession()
        setAuthRole(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [localPreviewRole])

  useEffect(() => {
    if (!isRestoringSession && authRole && currentPath === '/') {
      navigate(authRole === 'donor' ? '/donor/dashboard' : '/volunteer/dashboard')
    }
  }, [authRole, currentPath, isRestoringSession, navigate])

  if (isRestoringSession) return <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center text-sm text-[#6B756F]">Restoring your session…</div>

  const dashboardFor = (role: 'donor' | 'volunteer') => role === 'donor' ? '/donor/dashboard' : '/volunteer/dashboard'
  const handleActionClick = (role: 'donor' | 'volunteer') => {
    if (authRole) { navigate(dashboardFor(authRole)); return }
    navigate(role === 'donor' ? '/register/donor' : '/register/volunteer')
  }

  if (currentPath === '/register/donor' || currentPath === '/register/volunteer') {
    if (authRole) { navigate(dashboardFor(authRole)); return null }
    return currentPath.endsWith('donor')
      ? <DonorRegistration onAuthenticated={restoreAuthenticatedProfile} />
      : <VolunteerRegistration onAuthenticated={restoreAuthenticatedProfile} />
  }

  if (currentPath === '/login/donor' || currentPath === '/login/volunteer') {
    if (authRole) { navigate(dashboardFor(authRole)); return null }
    return <LoginPage role={currentPath.endsWith('donor') ? 'donor' : 'volunteer'} onAuthenticated={async () => { await restoreAuthenticatedProfile(); }} />
  }

  if (currentPath === '/donor/donate') {
    if (authRole !== 'donor') { navigate(authRole === 'volunteer' ? '/volunteer/dashboard' : '/login/donor'); return null }
    return <DonateNowForm onBack={() => navigate('/donor/dashboard')} onSuccess={(id, otp) => { setNewlyCreatedDonation({ id, otp }); navigate('/donor/dashboard') }} />
  }

  if (currentPath === '/donor/dashboard') {
    if (authRole !== 'donor') { navigate(authRole === 'volunteer' ? '/volunteer/dashboard' : '/login/donor'); return null }
    return <DonorDashboard onOpenDonateForm={() => navigate('/donor/donate')} onOpenTracker={(donationId) => navigate(`/tracking/${donationId}`)} justCreatedDonationId={newlyCreatedDonation?.id} justCreatedOtp={newlyCreatedDonation?.otp} onDismissSuccessModal={() => setNewlyCreatedDonation(null)} />
  }

  if (currentPath === '/volunteer/dashboard') {
    if (authRole !== 'volunteer') { navigate(authRole === 'donor' ? '/donor/dashboard' : '/login/volunteer'); return null }
    return <VolunteerDashboard onOpenTracker={(donationId) => navigate(`/tracking/${donationId}`)} />
  }

  if (currentPath.startsWith('/tracking/')) {
    const donationId = currentPath.replace('/tracking/', '')
    return <PickupTracker donationId={donationId} userRole={authRole || 'donor'} onBack={() => navigate(authRole === 'volunteer' ? '/volunteer/dashboard' : '/donor/dashboard')} />
  }

  if (currentPath !== '/' && currentPath !== '') return <NotFound onHomeClick={() => navigate('/')} />

  return <div className="min-h-screen flex flex-col bg-white text-neutral-800"><HeroSection onActionClick={handleActionClick} onLoginClick={(role) => navigate(`/login/${role}`)} /><footer className="py-3.5 bg-[#F2F9F5] text-center text-[11px] text-[#5A6760]/80"><p>&copy; {CURRENT_YEAR} Share a Meal. Connecting surplus food with care.</p></footer></div>
}

export function App() { return <NavigationProvider><AppContent /></NavigationProvider> }
export default App
