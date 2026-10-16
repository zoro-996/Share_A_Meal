import React from 'react'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useNavigation } from '../../context/useNavigation'

interface Step {
  id: number
  title: string
}

interface RegistrationLayoutProps {
  role: 'volunteer' | 'donor'
  title: string
  subtitle: string
  currentStep: 1 | 2 | 3
  onBack?: () => void
  children: React.ReactNode
  steps?: Step[]
}

const DEFAULT_DONOR_STEPS: Step[] = [
  { id: 1, title: 'Details & ID' },
  { id: 2, title: 'Source & Address' },
  { id: 3, title: 'Terms & Complete' },
]

const DEFAULT_VOLUNTEER_STEPS: Step[] = [
  { id: 1, title: 'Details & ID' },
  { id: 2, title: 'Role & Address' },
  { id: 3, title: 'Terms & Complete' },
]

export const RegistrationLayout: React.FC<RegistrationLayoutProps> = ({
  role,
  title,
  subtitle,
  currentStep,
  onBack,
  children,
  steps,
}) => {
  const { navigate } = useNavigation()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate('/')
    }
  }

  const roleAccentBg = role === 'volunteer' ? 'bg-[#FFF0DB]' : 'bg-[#E8F5E9]'
  const roleAccentBorder = role === 'volunteer' ? 'border-[#FFE0B2]' : 'border-[#C8E6C9]'
  const roleAccentText = role === 'volunteer' ? 'text-[#9A3412]' : 'text-[#1B5E20]'

  const activeSteps = steps || (role === 'donor' ? DEFAULT_DONOR_STEPS : DEFAULT_VOLUNTEER_STEPS)

  return (
    <div className="min-h-screen bg-white text-[#29352F] flex flex-col antialiased">
      {/* Top Header */}
      <header className="w-full bg-white border-b border-[#E6EAE7] sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand + Back */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleBack}
              aria-label="Back to home"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6B756F] hover:text-[#29352F] p-1.5 -ml-1.5 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="h-4 w-px bg-[#E6EAE7]" aria-hidden="true" />

            <div 
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 cursor-pointer"
              role="link"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate('/') }}
              aria-label="Share a Meal Home"
            >
              <div 
                className="w-8 h-8 rounded-lg bg-[#E8F5E9] border border-[#C8E6C9] flex items-center justify-center text-[#1B5E20]"
                aria-hidden="true"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 11h16a1 1 0 0 1 1 1c0 5-4.03 9-9 9s-9-4-9-9a1 1 0 0 1 1-1z" fill="currentColor" fillOpacity="0.15" />
                  <path d="M12 4c.6-1 1.8-1 2.4 0 .8 1.4-.4 2.5-1.2 3.2-.6.5-1.2.8-1.2 1.3" />
                  <path d="M9 6c.4-.7 1.2-.7 1.6 0 .5 1-.3 1.8-.8 2.3" />
                </svg>
              </div>
              <span className="font-heading font-bold text-base text-[#29352F]">
                Share a Meal
              </span>
            </div>
          </div>

          {/* Role badge */}
          <div className="flex items-center">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${roleAccentBg} ${roleAccentBorder} ${roleAccentText}`}>
              {role === 'volunteer' ? 'Volunteer Registration' : 'Donor Registration'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 py-8 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          {/* Progress Stepper */}
          <nav aria-label="Registration progress" className="mb-8">
            <ol className="flex items-center justify-between relative">
              <div className="absolute top-4 left-6 right-6 h-0.5 bg-[#E6EAE7] -z-0" aria-hidden="true" />
              {activeSteps.map((step) => {
                const isCompleted = currentStep > step.id
                const isCurrent = currentStep === step.id
                return (
                  <li key={step.id} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        isCompleted
                          ? 'bg-[#E8F5E9] text-[#1B5E20] border-2 border-[#2E7D32]'
                          : isCurrent
                          ? 'bg-[#29352F] text-white border-2 border-[#29352F]'
                          : 'bg-white text-[#6B756F] border-2 border-[#E6EAE7]'
                      }`}
                      aria-current={isCurrent ? 'step' : undefined}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                    </div>
                    <span
                      className={`text-xs mt-1.5 font-medium ${
                        isCurrent ? 'text-[#29352F] font-semibold' : 'text-[#6B756F]'
                      }`}
                    >
                      {step.title}
                    </span>
                  </li>
                )
              })}
            </ol>
          </nav>

          {/* Header Description */}
          <div className="mb-8 text-center sm:text-left">
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#29352F] tracking-tight">
              {title}
            </h1>
            <p className="text-sm sm:text-base text-[#6B756F] mt-1.5 leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Form / Content Card */}
          <div className="bg-white rounded-2xl border border-[#E6EAE7] shadow-xs p-5 sm:p-8">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-[#E6EAE7] text-center text-xs text-[#6B756F]">
        <p>&copy; 2026 Share a Meal. Secure onboarding & verified food rescue network.</p>
      </footer>
    </div>
  )
}
