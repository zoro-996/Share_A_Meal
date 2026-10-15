import React from 'react'
import { User } from 'lucide-react'
import { BrandHeartLogoIcon } from './common/LandingPageIllustrations'

interface HeaderProps {
  onSignInClick: () => void
}

export const Header: React.FC<HeaderProps> = ({ onSignInClick }) => {
  return (
    <header className="w-full bg-white z-30">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 h-20 sm:h-24 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 cursor-default">
          <BrandHeartLogoIcon className="w-8 h-8 sm:w-9 sm:h-9" />
          <span className="font-heading font-extrabold text-xl sm:text-2xl tracking-tight text-[#113324]">
            Share a <span className="text-[#F26522]">Meal</span>
          </span>
        </div>

        {/* Right side: Elegant Sign In button with User icon */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={onSignInClick}
            aria-label="Sign in to Share a Meal"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-[#113324] bg-white border border-[#D1DAD5] hover:border-[#A8BDB1] hover:bg-[#F6FAF7] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] cursor-pointer shadow-2xs"
          >
            <User className="w-4 h-4 text-[#113324]" />
            <span>Sign In</span>
          </button>
        </div>
      </div>
    </header>
  )
}
