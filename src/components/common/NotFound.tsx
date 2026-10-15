import React from 'react'
import { ArrowLeft, Home, AlertCircle } from 'lucide-react'
import { BrandHeartLogoIcon } from './LandingPageIllustrations'

interface NotFoundProps {
  onHomeClick: () => void
}

export const NotFound: React.FC<NotFoundProps> = ({ onHomeClick }) => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-800">
      <header className="w-full bg-white border-b border-neutral-100 z-30">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 h-16 sm:h-20 flex items-center justify-between">
          <button
            type="button"
            onClick={onHomeClick}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <BrandHeartLogoIcon className="w-8 h-8" />
            <span className="font-heading font-extrabold text-xl tracking-tight text-[#113324]">
              Share a <span className="text-[#F26522]">Meal</span>
            </span>
          </button>
          <button
            type="button"
            onClick={onHomeClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#113324] bg-[#E8F5E9] hover:bg-[#D7ECD9] transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Go Home</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-[#FFF0DB] border border-[#FFE0B2] flex items-center justify-center text-[#9A3412]">
            <AlertCircle className="w-10 h-10 stroke-[2]" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#9A3412] bg-[#FFF0DB] px-3 py-1 rounded-full">
              404 &bull; Page Not Found
            </span>
            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#113324] pt-2">
              Lost in Transit
            </h1>
            <p className="text-sm text-neutral-500 max-w-sm mx-auto">
              We couldn't find the page or run you're looking for. It may have been moved, completed, or typed incorrectly.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onHomeClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#1E824C] hover:bg-[#166B3D] text-white text-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 text-sm font-bold transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous Page</span>
            </button>
          </div>
        </div>
      </main>

      <footer className="py-3.5 bg-[#F2F9F5] text-center text-[11px] text-[#5A6760]/80">
        <p>&copy; 2026 Share a Meal. Connecting surplus food with care.</p>
      </footer>
    </div>
  )
}
