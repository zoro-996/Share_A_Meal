import { useNavigation } from '../../context/useNavigation'

import { PackageCheck, ShieldCheck, Clock, ArrowLeft, AlertCircle, MapPin } from 'lucide-react'

export const DonorDashboardPlaceholder: React.FC = () => {
  const { navigate } = useNavigation()

  return (
    <div className="min-h-screen bg-white text-[#29352F] flex flex-col antialiased">
      <header className="w-full bg-white border-b border-[#E6EAE7]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] border border-[#C8E6C9] flex items-center justify-center text-[#1B5E20]">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-heading font-bold text-base text-[#29352F]">Share a Meal</span>
              <span className="text-[10px] text-[#1B5E20] font-semibold bg-[#E8F5E9] px-1.5 py-0.5 rounded ml-2">Donor Portal</span>
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
          <div className="bg-[#E8F5E9]/40 border border-[#C8E6C9] p-6 rounded-2xl">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#C8E6C9] flex items-center justify-center text-[#1B5E20] shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-heading text-lg font-bold text-[#29352F]">
                  Donor Hub Registered — Verification In Progress
                </h1>
                <p className="text-xs sm:text-sm text-[#6B756F] mt-1 leading-relaxed">
                  Your food pickup point has been recorded and your phone number is verified. Identity verification is in progress.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-xl border border-[#C8E6C9] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#1B5E20] shrink-0" />
                <span className="text-xs font-semibold text-[#29352F]">Phone Verified</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#FFE0B2] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#9A3412] shrink-0" />
                <span className="text-xs font-semibold text-[#29352F]">ID Review Pending</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#BFDBFE] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#1E40AF] shrink-0" />
                <span className="text-xs font-semibold text-[#29352F]">Location Geocoded</span>
              </div>
            </div>
          </div>

          <div className="bg-[#FAFAFA] border border-[#E6EAE7] p-5 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-[#6B756F] shrink-0 mt-0.5" />
            <div className="text-xs text-[#6B756F] leading-relaxed">
              <strong className="text-[#29352F]">Next Development Step:</strong> Surplus food listing forms, quantity counters, pickup time window specifications, and volunteer arrival tracking will be enabled in Step 3.
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 border-t border-[#E6EAE7] text-center text-xs text-[#6B756F]">
        <p>&copy; 2026 Share a Meal. Donor Network.</p>
      </footer>
    </div>
  )
}
