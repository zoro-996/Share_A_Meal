import { useNavigation } from '../../context/useNavigation'

import { HeartHandshake, ShieldCheck, Clock, ArrowLeft, AlertCircle } from 'lucide-react'

export const VolunteerDashboardPlaceholder: React.FC = () => {
  const { navigate } = useNavigation()

  return (
    <div className="min-h-screen bg-white text-[#29352F] flex flex-col antialiased">
      <header className="w-full bg-white border-b border-[#E6EAE7]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FFF0DB] border border-[#FFE0B2] flex items-center justify-center text-[#9A3412]">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <span className="font-heading font-bold text-base text-[#29352F]">Share a Meal</span>
              <span className="text-[10px] text-[#9A3412] font-semibold bg-[#FFF0DB] px-1.5 py-0.5 rounded ml-2">Volunteer Portal</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B756F] hover:text-[#29352F] px-3 py-1.5 rounded-lg border border-[#E6EAE7] hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Landing Page</span>
          </button>
        </div>
      </header>

      <main className="flex-1 py-10 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-[#FFF0DB]/40 border border-[#FFE0B2] p-6 rounded-2xl">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#FFE0B2] flex items-center justify-center text-[#9A3412] shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-heading text-lg font-bold text-[#29352F]">
                  Volunteer Profile Registered — Verification In Progress
                </h1>
                <p className="text-xs sm:text-sm text-[#6B756F] mt-1 leading-relaxed">
                  Your phone number is confirmed. Identity document verification is currently being reviewed by our safety team.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-xl border border-[#C8E6C9] flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#1B5E20]" />
                <span className="text-xs font-semibold text-[#29352F]">Phone Verified</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#FFE0B2] flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#9A3412]" />
                <span className="text-xs font-semibold text-[#29352F]">ID Review Pending</span>
              </div>
            </div>
          </div>

          <div className="bg-[#FAFAFA] border border-[#E6EAE7] p-5 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-[#6B756F] shrink-0 mt-0.5" />
            <div className="text-xs text-[#6B756F] leading-relaxed">
              <strong className="text-[#29352F]">Next Development Step:</strong> Full volunteer dispatching, real-time surplus food notification feeds, pickup claiming, and distribution routing will be introduced in Step 3.
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 border-t border-[#E6EAE7] text-center text-xs text-[#6B756F]">
        <p>&copy; 2026 Share a Meal. Volunteer Network.</p>
      </footer>
    </div>
  )
}
