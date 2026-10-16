import { useEffect, useState } from 'react'
import { HeroSection } from './components/HeroSection'
import { Header } from './components/Header'
import { HowItWorksSection } from './components/landing/HowItWorksSection'
import { HumanImpactSection } from './components/landing/HumanImpactSection'
import { FooterSection } from './components/landing/FooterSection'
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
import { getAuthenticatedProfile, hasLocalAuthenticatedSession } from './services/authService'
import { supabase } from './services/supabaseClient'

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
  const [isSignInOpen, setIsSignInOpen] = useState(false)

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
      if (!session && !localPreviewRole && !hasLocalAuthenticatedSession()) {
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

  return (
    <div className="min-h-screen bg-[#FFFCF6] text-[#173529] selection:bg-[#EAF5ED] selection:text-[#123B2A]">
      <Header onSignInClick={() => setIsSignInOpen(true)} />
      <main>
        <HeroSection onActionClick={handleActionClick} />
        <HowItWorksSection />
        <HumanImpactSection onActionClick={handleActionClick} />
        <FooterSection onActionClick={handleActionClick} />
      </main>
      {isSignInOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#0B281D]/35 p-4 backdrop-blur-sm" onClick={() => setIsSignInOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-[#DFE9E0] bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <h2 className="font-heading text-lg font-black text-[#123B2A]">Sign In to Share a Meal</h2>
            <p className="mt-1 text-sm text-[#64756B]">Choose the portal for your account.</p>
            <div className="mt-5 grid gap-3">
              <button type="button" onClick={() => navigate('/login/donor')} className="rounded-xl bg-[#EAF5ED] p-4 text-left font-bold text-[#123B2A] transition-colors hover:bg-[#d9efdf]">Food Donor Portal</button>
              <button type="button" onClick={() => navigate('/login/volunteer')} className="rounded-xl bg-[#FFF0E4] p-4 text-left font-bold text-[#123B2A] transition-colors hover:bg-[#ffe4cc]">Volunteer & NGO Portal</button>
            </div>
            <button type="button" onClick={() => setIsSignInOpen(false)} className="mt-5 text-sm font-bold text-[#64756B] hover:text-[#123B2A]">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

export function App() { return <NavigationProvider><AppContent /></NavigationProvider> }
export default App
