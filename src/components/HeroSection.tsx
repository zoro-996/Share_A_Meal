import React from 'react'
import { ArrowRight } from 'lucide-react'
import heroPhoto from '../assets/hero-volunteer-handover.jpg'
import {
  DonorCrateIllustration,
  VolunteerHandsIllustration,
  DecorativeLeafGreen,
  DecorativePetalOrange,
  ImpactLeafIcon,
  ImpactCommunityIcon,
  ImpactHeartHandIcon,
} from './common/LandingPageIllustrations'

interface HeroSectionProps {
  onActionClick: (role: 'donor' | 'volunteer') => void
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onActionClick }) => {
  return (
    <div className="relative w-full flex-1 flex flex-col justify-between overflow-hidden bg-white">
      {/* ======================================================== */}
      {/* 1. MAIN HERO GRID (Left: Content & Actions, Right: Photo) */}
      {/* ======================================================== */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 w-full pt-4 sm:pt-6 lg:pt-8 pb-12 sm:pb-16 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* LEFT COLUMN: Tagline, Headline, Subtitle, Two Action Cards */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-center space-y-5 sm:space-y-6">
            
            {/* Tagline Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF6EE] border border-[#D3EBD9] self-start shadow-2xs">
              <svg className="w-4 h-4 text-[#1B8349]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
              </svg>
              <span className="font-heading font-bold text-xs sm:text-[13px] text-[#113324] tracking-tight">
                Good Food. Brighter Communities.
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-[54px] xl:text-[60px] text-[#0F2C1F] tracking-tight leading-[1.12]">
              Good Food Deserves <br className="hidden sm:inline" />
              a <span className="text-[#F26522]">Second Chance.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#5A6760] font-medium leading-relaxed max-w-xl">
              Share surplus food. Connect with people who care. <br className="hidden sm:inline" />
              Help good food reach those who need it.
            </p>

            {/* Two Action Cards (Side by side) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 max-w-xl">
              
              {/* Card 1: Become a Donor */}
              <button
                type="button"
                onClick={() => onActionClick('donor')}
                className="group relative flex items-center justify-between p-4 sm:p-5 rounded-[22px] bg-[#EBF6EE] hover:bg-[#E3F2E7] transition-all duration-200 text-left cursor-pointer border border-transparent hover:border-[#C8E6C9]"
              >
                <div className="flex items-center gap-3.5">
                  <DonorCrateIllustration className="w-14 h-14 shrink-0 drop-shadow-2xs" />
                  <div>
                    <h3 className="font-heading font-extrabold text-[#113324] text-base sm:text-lg leading-snug">
                      Become <br /> a Donor
                    </h3>
                    <p className="text-xs text-[#5A6760] font-medium mt-1">
                      Share your surplus food.
                    </p>
                  </div>
                </div>

                <div className="w-10 h-10 rounded-full bg-[#1E824C] group-hover:bg-[#166B3D] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-all ml-2">
                  <ArrowRight className="w-5 h-5 stroke-[2.4]" />
                </div>
              </button>

              {/* Card 2: Join as a Volunteer */}
              <button
                type="button"
                onClick={() => onActionClick('volunteer')}
                className="group relative flex items-center justify-between p-4 sm:p-5 rounded-[22px] bg-[#FFF1E1] hover:bg-[#FEEAD4] transition-all duration-200 text-left cursor-pointer border border-transparent hover:border-[#FFD8B3]"
              >
                <div className="flex items-center gap-3.5">
                  <VolunteerHandsIllustration className="w-14 h-14 shrink-0 drop-shadow-2xs" />
                  <div>
                    <h3 className="font-heading font-extrabold text-[#113324] text-base sm:text-lg leading-snug">
                      Join as a <br /> Volunteer
                    </h3>
                    <p className="text-xs text-[#5A6760] font-medium mt-1">
                      Help collect and share food.
                    </p>
                  </div>
                </div>

                <div className="w-10 h-10 rounded-full bg-[#F26522] group-hover:bg-[#D95316] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-all ml-2">
                  <ArrowRight className="w-5 h-5 stroke-[2.4]" />
                </div>
              </button>

            </div>

          </div>

          {/* RIGHT COLUMN: Hero Photo in Organic Blob with Decorative Shapes & Leaves */}
          <div className="lg:col-span-6 xl:col-span-5 flex justify-center items-center relative">
            <div className="relative w-full max-w-[480px] sm:max-w-[520px] aspect-[1.18/1]">
              
              {/* Decorative Backdrop Shape 1: Pale Yellow/Cream blob on top-left */}
              <div
                className="absolute -top-7 -left-7 w-[96%] h-[94%] bg-[#FFF5E8] pointer-events-none -z-10"
                style={{
                  borderRadius: '56% 44% 48% 52% / 46% 56% 44% 54%',
                }}
              />

              {/* Decorative Backdrop Shape 2: Pale Peach/Orange blob on bottom-right */}
              <div
                className="absolute -bottom-8 -right-8 w-[94%] h-[92%] bg-[#FFEBD6] pointer-events-none -z-10"
                style={{
                  borderRadius: '42% 58% 62% 38% / 54% 44% 56% 46%',
                }}
              />

              {/* Decorative Floating Leaves (Matching Reference Image 2 exact positions) */}
              {/* Top-Right Green Leaf */}
              <div className="absolute -top-3 right-8 pointer-events-none z-20">
                <DecorativeLeafGreen className="w-9 h-9 rotate-[-25deg] drop-shadow-2xs" />
              </div>
              {/* Top-Right Small Orange Petal */}
              <div className="absolute top-8 -right-3 pointer-events-none z-20">
                <DecorativePetalOrange className="w-5 h-5 rotate-[45deg] drop-shadow-2xs" />
              </div>
              {/* Bottom-Right Small Orange Petal */}
              <div className="absolute -bottom-4 right-16 pointer-events-none z-20">
                <DecorativePetalOrange className="w-5 h-5 rotate-[-20deg] drop-shadow-2xs" />
              </div>

              {/* Main Hero Photograph in Organic Rounded Blob Frame */}
              <div
                className="relative w-full h-full overflow-hidden shadow-sm"
                style={{
                  borderRadius: '46% 54% 58% 42% / 48% 46% 54% 52%',
                }}
              >
                <img
                  src={heroPhoto}
                  alt="Share a Meal male volunteer in green apron handing fresh meals to recipient"
                  className="w-full h-full object-cover object-[center_32%] select-none scale-102 hover:scale-105 transition-transform duration-700"
                />
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. BOTTOM IMPACT HIGHLIGHTS & SOFT PASTEL WAVE */}
      {/* ======================================================== */}
      <div className="relative w-full mt-auto">
        {/* Soft flowing wave background */}
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden flex items-end">
          <svg
            className="w-full h-32 sm:h-36 text-[#F2F9F5]"
            viewBox="0 0 1440 160"
            fill="currentColor"
            preserveAspectRatio="none"
          >
            <path d="M0,80 C320,130 500,30 820,75 C1120,115 1300,45 1440,70 L1440,160 L0,160 Z" />
          </svg>
        </div>

        {/* Floating Green Leaf on lower left wave */}
        <div className="absolute bottom-16 left-8 sm:left-14 pointer-events-none z-10 hidden sm:block">
          <DecorativeLeafGreen className="w-9 h-9 rotate-[35deg] opacity-90" />
        </div>

        {/* Three Impact Highlights Container */}
        <div className="max-w-5xl mx-auto px-6 sm:px-10 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 sm:gap-4">
            
            {/* Impact Item 1: Reduce Food Waste */}
            <div className="flex items-center gap-3.5 w-full sm:w-auto justify-center sm:justify-start">
              <div className="w-14 h-14 rounded-full bg-[#E6F5EA] flex items-center justify-center shrink-0 shadow-2xs">
                <ImpactLeafIcon className="w-7 h-7" />
              </div>
              <div className="text-left font-heading font-extrabold text-[#113324] text-base leading-tight">
                <div>Reduce</div>
                <div>Food Waste</div>
              </div>
            </div>

            {/* Vertical Divider 1 */}
            <div className="hidden sm:block h-10 w-px bg-neutral-200/90" />

            {/* Impact Item 2: Support Communities */}
            <div className="flex items-center gap-3.5 w-full sm:w-auto justify-center sm:justify-start">
              <div className="w-14 h-14 rounded-full bg-[#FFEFE4] flex items-center justify-center shrink-0 shadow-2xs">
                <ImpactCommunityIcon className="w-7 h-7" />
              </div>
              <div className="text-left font-heading font-extrabold text-[#113324] text-base leading-tight">
                <div>Support</div>
                <div>Communities</div>
              </div>
            </div>

            {/* Vertical Divider 2 */}
            <div className="hidden sm:block h-10 w-px bg-neutral-200/90" />

            {/* Impact Item 3: Share More Meals */}
            <div className="flex items-center gap-3.5 w-full sm:w-auto justify-center sm:justify-start">
              <div className="w-14 h-14 rounded-full bg-[#EAF3FF] flex items-center justify-center shrink-0 shadow-2xs">
                <ImpactHeartHandIcon className="w-7 h-7" />
              </div>
              <div className="text-left font-heading font-extrabold text-[#113324] text-base leading-tight">
                <div>Share</div>
                <div>More Meals</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
