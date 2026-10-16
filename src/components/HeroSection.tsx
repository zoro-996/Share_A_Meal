import React from 'react'
import { ArrowRight, UserRound, UsersRound } from 'lucide-react'
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
  onLoginClick: (role: 'donor' | 'volunteer') => void
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onActionClick, onLoginClick }) => {
  return (
    <div className="relative w-full flex-1 flex flex-col justify-between overflow-hidden bg-white">
      {/* ======================================================== */}
      {/* 1. MAIN HERO GRID (Left: Content & Actions, Right: Photo) */}
      {/* ======================================================== */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 w-full pt-8 sm:pt-12 lg:pt-14 pb-8 sm:pb-12 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* LEFT COLUMN: Brand Identity, Quotation, Description and Actions */}
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

            {/* DOMINANT BRAND IDENTITY: "Share a Meal" */}
            <div className="space-y-3">
              <h1 className="font-brand font-black text-6xl sm:text-7xl md:text-8xl lg:text-[84px] xl:text-[92px] text-[#113324] tracking-tight leading-[1.02]">
                Share a <span className="text-[#F26522] inline-block">Meal</span>
              </h1>

              {/* SECONDARY SUPPORTING QUOTATION */}
              <h2 className="font-heading font-extrabold text-xl sm:text-2xl lg:text-[26px] text-[#113324]/80 tracking-tight leading-snug">
                “Good Food Deserves a Second Chance.”
              </h2>
            </div>

            {/* PRESERVED EXACT DESCRIPTION (No "selfless", no marketing fluff) */}
            <p className="text-base sm:text-lg text-[#5A6760] font-medium leading-relaxed max-w-xl">
              Share surplus food. Connect with people who care. Help good food reach those who need it.
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

            {/* Login actions stay directly below the primary cards and align to their width. */}
            <div className="max-w-xl w-full pt-2 sm:pt-3">
              <div className="flex items-center gap-3 text-xs sm:text-sm text-[#5A6760]">
                <span className="h-px flex-1 bg-[#DDE8E0]" />
                <span className="shrink-0 font-medium">Already registered?</span>
                <span className="h-px flex-1 bg-[#DDE8E0]" />
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onLoginClick('donor')}
                  className="h-12 rounded-xl border border-[#8DC9A2] bg-[#F4FBF6] px-4 text-sm font-bold text-[#155F34] flex items-center justify-center gap-2.5 transition-colors hover:bg-[#E7F6EB] cursor-pointer"
                >
                  <UserRound className="w-5 h-5" aria-hidden="true" />
                  Donor Login
                </button>
                <button
                  type="button"
                  onClick={() => onLoginClick('volunteer')}
                  className="h-12 rounded-xl border border-[#F5B888] bg-[#FFF7F0] px-4 text-sm font-bold text-[#A74414] flex items-center justify-center gap-2.5 transition-colors hover:bg-[#FFECDD] cursor-pointer"
                >
                  <UsersRound className="w-5 h-5" aria-hidden="true" />
                  Volunteer Login
                </button>
              </div>
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

              {/* Decorative Floating Leaves */}
              <div className="absolute -top-3 right-8 pointer-events-none z-20">
                <DecorativeLeafGreen className="w-9 h-9 rotate-[-25deg] drop-shadow-2xs" />
              </div>
              <div className="absolute top-8 -right-3 pointer-events-none z-20">
                <DecorativePetalOrange className="w-5 h-5 rotate-[45deg] drop-shadow-2xs" />
              </div>
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
      {/* 2. BOTTOM IMPACT SECTION                                 */}
      {/* ======================================================== */}
      <section className="relative mt-auto bg-[#F2F9F5] pt-2 pb-7 sm:pb-8">
        <svg
          className="block w-full h-14 sm:h-20 -mt-2 sm:-mt-4 text-white"
          viewBox="0 0 1440 160"
          fill="currentColor"
          preserveAspectRatio="none"
        >
          <path d="M0,0 L0,72 C320,125 500,28 820,72 C1120,110 1300,43 1440,66 L1440,0 Z" />
        </svg>
        <div className="max-w-5xl mx-auto px-6 sm:px-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#D7E7DC]">
            <div className="flex flex-col items-center text-center px-6 py-5 sm:py-2">
              <div className="w-14 h-14 rounded-full bg-[#E3F3E7] flex items-center justify-center shadow-2xs">
                <ImpactLeafIcon className="w-7 h-7" />
              </div>
              <h3 className="mt-3 font-heading font-extrabold text-base text-[#113324]">Reduce Food Waste</h3>
              <p className="mt-1 text-sm text-[#5A6760]">Give good food a new purpose.</p>
            </div>
            <div className="flex flex-col items-center text-center px-6 py-5 sm:py-2">
              <div className="w-14 h-14 rounded-full bg-[#FFF0E3] flex items-center justify-center shadow-2xs">
                <ImpactCommunityIcon className="w-7 h-7" />
              </div>
              <h3 className="mt-3 font-heading font-extrabold text-base text-[#113324]">Support Communities</h3>
              <p className="mt-1 text-sm text-[#5A6760]">Help people in need.</p>
            </div>
            <div className="flex flex-col items-center text-center px-6 py-5 sm:py-2">
              <div className="w-14 h-14 rounded-full bg-[#EAF1FF] flex items-center justify-center shadow-2xs">
                <ImpactHeartHandIcon className="w-7 h-7" />
              </div>
              <h3 className="mt-3 font-heading font-extrabold text-base text-[#113324]">Share More Meals</h3>
              <p className="mt-1 text-sm text-[#5A6760]">Together for a brighter tomorrow.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
