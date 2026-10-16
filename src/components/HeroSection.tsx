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
    <div className="relative w-full flex-1 flex flex-col justify-between overflow-hidden bg-transparent">
      {/* ======================================================== */}
      {/* 0. AMBIENT BACKGROUND GLOWS (Soft Mint & Restrained Peach) */}
      {/* ======================================================== */}
      <div
        className="absolute top-0 left-[-8%] w-[600px] h-[500px] pointer-events-none -z-10 blur-3xl opacity-60"
        style={{
          background: 'radial-gradient(circle, rgba(234, 245, 237, 0.95) 0%, rgba(234, 245, 237, 0) 70%)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute top-12 right-[-5%] w-[550px] h-[480px] pointer-events-none -z-10 blur-3xl opacity-50"
        style={{
          background: 'radial-gradient(circle, rgba(255, 240, 228, 0.9) 0%, rgba(255, 240, 228, 0) 70%)',
        }}
        aria-hidden="true"
      />

      {/* ======================================================== */}
      {/* 1. MAIN HERO GRID (Left: Content & Actions, Right: Photo) */}
      {/* ======================================================== */}
      <div className="max-w-[1240px] w-full mx-auto px-6 sm:px-8 lg:px-10 pt-6 sm:pt-8 lg:pt-10 pb-10 sm:pb-14 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-center">
          
          {/* LEFT COLUMN: Mission Tagline, Headline, Subtitle, Two Action Cards */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-5 sm:space-y-6">
            
            {/* Mission Badge / Tagline Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF5ED] border border-[#DFE9E0] self-start shadow-2xs">
              <svg className="w-3.5 h-3.5 text-[#278653] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
              </svg>
              <span className="font-heading font-bold text-xs sm:text-[13px] text-[#123B2A] tracking-tight">
                Good Food. Brighter Communities.
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-heading font-black text-3xl sm:text-5xl lg:text-[50px] xl:text-[56px] text-[#0B281D] tracking-tight leading-[1.12] max-w-2xl">
              Good Food Deserves <br className="hidden sm:inline" />
              a <span className="text-[#FF642D]">Second Chance.</span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-[#64756B] font-medium leading-relaxed max-w-[480px]">
              Share surplus food. Connect with people who care. Help good food reach those who need it.
            </p>

            {/* Two Action Cards (Side by side with balanced height and alignment) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 max-w-[560px]">
              
              {/* Card 1: Become a Donor */}
              <button
                type="button"
                onClick={() => onActionClick('donor')}
                className="group relative flex items-center justify-between p-4.5 sm:p-5 rounded-2xl bg-[#EAF5ED] hover:bg-[#E0EFE4] transition-all duration-200 text-left cursor-pointer border border-[#DFE9E0] hover:border-[#278653]/40 shadow-2xs hover:shadow-xs active:scale-[0.99] min-h-[104px]"
              >
                <div className="flex items-center gap-3">
                  <DonorCrateIllustration className="w-12 h-12 sm:w-13 sm:h-13 shrink-0 drop-shadow-2xs" />
                  <div>
                    <h2 className="font-heading font-extrabold text-[#123B2A] text-base leading-snug">
                      Become <br /> a Donor
                    </h2>
                    <p className="text-xs text-[#64756B] font-medium mt-0.5">
                      Share your surplus food.
                    </p>
                  </div>
                </div>

                <div className="w-9 h-9 rounded-full bg-[#278653] group-hover:bg-[#123B2A] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 group-hover:translate-x-0.5 transition-all ml-2">
                  <ArrowRight className="w-4.5 h-4.5 stroke-[2.4]" />
                </div>
              </button>

              {/* Card 2: Join as a Volunteer */}
              <button
                type="button"
                onClick={() => onActionClick('volunteer')}
                className="group relative flex items-center justify-between p-4.5 sm:p-5 rounded-2xl bg-[#FFF0E4] hover:bg-[#FEE5D4] transition-all duration-200 text-left cursor-pointer border border-[#DFE9E0] hover:border-[#FF642D]/40 shadow-2xs hover:shadow-xs active:scale-[0.99] min-h-[104px]"
              >
                <div className="flex items-center gap-3">
                  <VolunteerHandsIllustration className="w-12 h-12 sm:w-13 sm:h-13 shrink-0 drop-shadow-2xs" />
                  <div>
                    <h2 className="font-heading font-extrabold text-[#123B2A] text-base leading-snug">
                      Join as a <br /> Volunteer
                    </h2>
                    <p className="text-xs text-[#64756B] font-medium mt-0.5">
                      Help collect and share food.
                    </p>
                  </div>
                </div>

                <div className="w-9 h-9 rounded-full bg-[#FF642D] group-hover:bg-[#E9511F] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 group-hover:translate-x-0.5 transition-all ml-2">
                  <ArrowRight className="w-4.5 h-4.5 stroke-[2.4]" />
                </div>
              </button>

            </div>

          </div>

          {/* RIGHT COLUMN: Hero Photo in Organic Blob with Balanced Composition */}
          <div className="lg:col-span-5 flex justify-center items-center relative mt-6 lg:mt-0">
            <div className="relative w-full max-w-[420px] sm:max-w-[460px] lg:max-w-[440px] xl:max-w-[480px] aspect-[1.14/1]">
              
              {/* Decorative Backdrop Shape 1: Pale Mint organic blob */}
              <div
                className="absolute -top-5 -left-5 w-[96%] h-[94%] bg-[#EAF5ED]/80 pointer-events-none -z-10"
                style={{
                  borderRadius: '56% 44% 48% 52% / 46% 56% 44% 54%',
                }}
              />

              {/* Decorative Backdrop Shape 2: Pale Peach organic blob */}
              <div
                className="absolute -bottom-6 -right-6 w-[94%] h-[92%] bg-[#FFF0E4]/90 pointer-events-none -z-10"
                style={{
                  borderRadius: '42% 58% 62% 38% / 54% 44% 56% 46%',
                }}
              />

              {/* Decorative Floating Leaves (Subordinate, clean positioning) */}
              <div className="absolute -top-3 right-6 pointer-events-none z-20">
                <DecorativeLeafGreen className="w-8 h-8 rotate-[-25deg] drop-shadow-2xs opacity-90" />
              </div>
              <div className="absolute top-7 -right-3 pointer-events-none z-20">
                <DecorativePetalOrange className="w-4.5 h-4.5 rotate-[45deg] drop-shadow-2xs opacity-90" />
              </div>
              <div className="absolute -bottom-3 right-14 pointer-events-none z-20">
                <DecorativePetalOrange className="w-4.5 h-4.5 rotate-[-20deg] drop-shadow-2xs opacity-90" />
              </div>

              {/* Main Hero Photograph in Organic Frame */}
              <div
                className="relative w-full h-full overflow-hidden shadow-md shadow-[#123B2A]/8 border-2 border-white"
                style={{
                  borderRadius: '46% 54% 58% 42% / 48% 46% 54% 52%',
                }}
              >
                <img
                  src={heroPhoto}
                  alt="Share a Meal volunteer handing freshly packed meals to community member"
                  className="w-full h-full object-cover object-[center_30%] select-none scale-102 hover:scale-105 transition-transform duration-700"
                  loading="eager"
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
            className="w-full h-28 sm:h-32 text-[#F4F9F6]"
            viewBox="0 0 1440 160"
            fill="currentColor"
            preserveAspectRatio="none"
          >
            <path d="M0,80 C320,130 500,30 820,75 C1120,115 1300,45 1440,70 L1440,160 L0,160 Z" />
          </svg>
        </div>

        {/* Floating Green Leaf on lower left wave */}
        <div className="absolute bottom-12 left-6 sm:left-12 pointer-events-none z-10 hidden sm:block">
          <DecorativeLeafGreen className="w-8 h-8 rotate-[35deg] opacity-80" />
        </div>

        {/* Three Impact Highlights Container (Symmetrically aligned to 1240px grid) */}
        <div className="max-w-[1240px] w-full mx-auto px-6 sm:px-8 lg:px-10 py-6 sm:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 items-center justify-between">
            {/* Impact Item 1: Reduce Food Waste */}
            <div className="flex items-center gap-3.5 justify-center sm:justify-start">
              <div className="w-12 h-12 rounded-full bg-[#EAF5ED] border border-[#DFE9E0] flex items-center justify-center shrink-0 shadow-2xs">
                <ImpactLeafIcon className="w-6 h-6" />
              </div>
              <div className="text-left font-heading font-extrabold text-[#123B2A] text-sm sm:text-[15px] leading-tight">
                <div>Reduce</div>
                <div>Food Waste</div>
              </div>
            </div>

            {/* Impact Item 2: Support Communities */}
            <div className="flex items-center gap-3.5 justify-center sm:justify-center sm:border-x sm:border-[#DFE9E0] sm:px-4">
              <div className="w-12 h-12 rounded-full bg-[#FFF0E4] border border-[#DFE9E0] flex items-center justify-center shrink-0 shadow-2xs">
                <ImpactCommunityIcon className="w-6 h-6" />
              </div>
              <div className="text-left font-heading font-extrabold text-[#123B2A] text-sm sm:text-[15px] leading-tight">
                <div>Support</div>
                <div>Communities</div>
              </div>
            </div>

            {/* Impact Item 3: Share More Meals */}
            <div className="flex items-center gap-3.5 justify-center sm:justify-end">
              <div className="w-12 h-12 rounded-full bg-[#EAF3FF] border border-[#DFE9E0] flex items-center justify-center shrink-0 shadow-2xs">
                <ImpactHeartHandIcon className="w-6 h-6" />
              </div>
              <div className="text-left font-heading font-extrabold text-[#123B2A] text-sm sm:text-[15px] leading-tight">
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
