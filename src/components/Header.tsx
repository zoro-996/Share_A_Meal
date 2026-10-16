import React from 'react'
import { User } from 'lucide-react'
import { BrandHeartLogoIcon } from './common/LandingPageIllustrations'

interface HeaderProps {
  onSignInClick: () => void
}

export const Header: React.FC<HeaderProps> = ({ onSignInClick }) => {
  return (
    <header className="w-full bg-[#FFFCF6]/90 backdrop-blur-md sticky top-0 z-40 border-b border-[#DFE9E0]/70 transition-colors">
      <div className="max-w-[1240px] w-full mx-auto px-6 sm:px-8 lg:px-10 h-20 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 select-none cursor-default">
          <BrandHeartLogoIcon className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 drop-shadow-2xs" />
          <span className="font-heading font-extrabold text-xl sm:text-2xl tracking-tight text-[#123B2A]">
            Share a <span className="text-[#FF642D]">Meal</span>
          </span>
        </div>

        {/* Right side: Perfectly aligned Sign In button with 44px touch target */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={onSignInClick}
            aria-label="Sign in to Share a Meal"
            className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-sm font-bold text-[#123B2A] bg-white border border-[#DFE9E0] hover:border-[#278653]/50 hover:bg-[#EAF5ED] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#278653] cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98] min-h-[42px]"
          >
            <User className="w-4 h-4 text-[#123B2A]" />
            <span>Sign In</span>
          </button>
        </div>
      </div>
    </header>
  )
}
