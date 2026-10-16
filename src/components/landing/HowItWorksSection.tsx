import React, { useEffect, useRef } from 'react'
import {
  Store,
  Leaf,
  Users,
  MapPin,
  ShieldCheck,
  BarChart3,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react'
import step1SurplusImg from '../../assets/step1-surplus.png'
import step2VolunteerImg from '../../assets/step2-volunteer.png'
import step3HandoverImg from '../../assets/step3-handover.png'

// ── Scroll-reveal hook ────────────────────────────────────────────────────────
function useScrollReveal<T extends HTMLElement>(delay = 0) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add('visible'), delay)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])
  return ref
}

// ── Benefit badges data ───────────────────────────────────────────────────────
const BENEFITS = [
  {
    icon: Trash2,
    label: ['Reduce', 'Food Waste'],
    circleBg: '#EAF5ED',
    iconColor: '#278653',
  },
  {
    icon: Users,
    label: ['Support', 'Communities'],
    circleBg: '#FFF0E4',
    iconColor: '#FF642D',
  },
  {
    icon: UtensilsCrossed,
    label: ['Share', 'More Meals'],
    circleBg: '#EAF3FF',
    iconColor: '#3B82F6',
  },
]

// ── Component ─────────────────────────────────────────────────────────────────
export const HowItWorksSection: React.FC = () => {
  const sectionRef = useScrollReveal<HTMLElement>()
  const leftRef = useScrollReveal<HTMLDivElement>(60)
  const rightRef = useScrollReveal<HTMLDivElement>(120)

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="scroll-reveal relative w-full bg-[#FFFCF6] overflow-hidden"
      aria-label="How Share a Meal works"
    >
      {/* ── AMBIENT DECORATIVE CORNER GRADIENTS & WAVES ──────────────────────── */}
      <div
        className="absolute -top-24 -left-20 w-[480px] h-[480px] pointer-events-none -z-10 blur-3xl opacity-40"
        style={{
          background: 'radial-gradient(circle, rgba(234,245,237,0.95) 0%, rgba(234,245,237,0) 70%)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 right-0 w-[420px] h-[420px] pointer-events-none -z-10 blur-3xl opacity-35"
        style={{
          background: 'radial-gradient(circle, rgba(255,240,228,0.9) 0%, rgba(255,240,228,0) 70%)',
        }}
        aria-hidden="true"
      />

      {/* Decorative Pastel Peach Wave at bottom-left (matching reference image) */}
      <div
        className="absolute bottom-0 left-0 w-[360px] h-[180px] pointer-events-none -z-10 overflow-hidden hidden sm:block opacity-75"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 360 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <path
            d="M-20 180 C80 130 180 150 260 110 C320 80 340 30 360 0 L0 0 L0 180 Z"
            fill="#FFF0E4"
            transform="scale(1, -1) translate(0, -180)"
          />
        </svg>
        {/* Floating Orange Petal on wave */}
        <div className="absolute bottom-10 left-36 pointer-events-none">
          <svg className="w-5 h-5 text-[#FF642D] opacity-80 rotate-[-15deg]" viewBox="0 0 24 24" fill="currentColor">
            <ellipse cx="12" cy="12" rx="5" ry="9" transform="rotate(30 12 12)" />
          </svg>
        </div>
      </div>

      {/* Floating leaves in top-left & right */}
      <div className="absolute top-10 left-12 pointer-events-none hidden lg:block opacity-65">
        <svg className="w-6 h-6 text-[#278653] rotate-[35deg]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
        </svg>
      </div>

      <div className="max-w-[1240px] w-full mx-auto px-6 sm:px-8 lg:px-10 py-16 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 xl:gap-12 items-start">

          {/* ════════════════════════════════════════════════════════════ */}
          {/* LEFT COLUMN: HOW IT WORKS + HEADLINE + 3 CHIPS               */}
          {/* ════════════════════════════════════════════════════════════ */}
          <div
            ref={leftRef}
            className="scroll-reveal lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24"
          >
            {/* Pill Label */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF5ED] border border-[#DFE9E0] self-start shadow-2xs">
              <svg className="w-3.5 h-3.5 text-[#278653] shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
              </svg>
              <span className="font-heading font-bold text-xs text-[#123B2A] tracking-tight">How It Works</span>
            </div>

            {/* Main Headline */}
            <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-[42px] xl:text-[48px] text-[#0B281D] tracking-tight leading-[1.1]">
              A Simple Way <br />
              to Make a <br />
              <span className="text-[#FF642D]">Bigger Impact.</span>
            </h2>

            {/* Subtitle / Explanation */}
            <p className="text-base text-[#64756B] font-medium leading-relaxed max-w-[420px]">
              Share a Meal connects people who have surplus food with those who can collect and deliver it to people in need — quickly, safely and responsibly.
            </p>

            {/* Three Benefit Chips (Horizontal row with circular icons & 2-line labels) */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 pt-2 max-w-[440px]">
              {BENEFITS.map(({ icon: Icon, label, circleBg, iconColor }, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-center sm:items-center gap-2 p-2.5 rounded-2xl bg-white border border-[#DFE9E0] shadow-2xs"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: circleBg }}
                  >
                    <Icon className="w-5 h-5 shrink-0" style={{ color: iconColor }} aria-hidden="true" />
                  </div>
                  <div className="text-center sm:text-left font-heading font-extrabold text-[12px] sm:text-[13px] text-[#123B2A] leading-tight">
                    <div>{label[0]}</div>
                    <div>{label[1]}</div>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* MIDDLE TIMELINE INDICATOR (Visible on large screens)          */}
          {/* ════════════════════════════════════════════════════════════ */}
          <div className="hidden lg:flex lg:col-span-1 justify-center pt-10" aria-hidden="true">
            <div className="relative flex flex-col items-center h-full min-h-[580px]">
              {/* Dot 1 */}
              <div className="w-4 h-4 rounded-full border-2 border-[#278653] bg-white flex items-center justify-center z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-[#278653]" />
              </div>
              {/* Dashed connector line 1 */}
              <div className="flex-1 w-0 border-r-2 border-dashed border-[#C8E6D0] my-2" />
              {/* Dot 2 */}
              <div className="w-4 h-4 rounded-full border-2 border-[#FF642D] bg-white flex items-center justify-center z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF642D]" />
              </div>
              {/* Dashed connector line 2 */}
              <div className="flex-1 w-0 border-r-2 border-dashed border-[#C8E6D0] my-2" />
              {/* Dot 3 */}
              <div className="w-4 h-4 rounded-full border-2 border-[#278653] bg-white flex items-center justify-center z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-[#278653]" />
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* RIGHT COLUMN: 3 INTERACTIVE STEP CARDS                       */}
          {/* ════════════════════════════════════════════════════════════ */}
          <div
            ref={rightRef}
            className="scroll-reveal lg:col-span-6 flex flex-col gap-5 sm:gap-6"
          >

            {/* ── CARD 01: List Surplus Food ────────────────────────── */}
            <div className="group relative rounded-3xl bg-[#EAF5ED] border border-[#DFE9E0] p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                
                {/* Left: Text & bullets */}
                <div className="sm:col-span-7 flex flex-col space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#123B2A] text-white font-heading font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                      01
                    </div>
                    <h3 className="font-heading font-black text-lg sm:text-xl text-[#0B281D] tracking-tight">
                      List Surplus Food
                    </h3>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-white/80 border border-[#DFE9E0] flex items-center justify-center shrink-0 text-[#278653] mt-0.5">
                        <Store className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-xs sm:text-[13px] text-[#173529] font-medium leading-snug">
                        Restaurants and households can post surplus food with quantity, location, freshness and pickup deadline.
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-white/80 border border-[#DFE9E0] flex items-center justify-center shrink-0 text-[#278653] mt-0.5">
                        <Leaf className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-xs sm:text-[13px] text-[#173529] font-medium leading-snug">
                        Help good food reach people before it spoils, instead of being wasted.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Graphic Card from Reference */}
                <div className="sm:col-span-5 flex justify-center sm:justify-end">
                  <div className="relative w-full max-w-[210px] rounded-2xl overflow-hidden shadow-sm group-hover:scale-[1.02] transition-transform duration-300">
                    <img
                      src={step1SurplusImg}
                      alt="Crate of surplus food ready for donation with verification status badge"
                      className="w-full h-auto object-cover rounded-2xl"
                      loading="lazy"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* ── CARD 02: Connect with Helpers ─────────────────────── */}
            <div className="group relative rounded-3xl bg-[#FFF0E4] border border-[#FFD6BC] p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                
                {/* Left: Text & bullets */}
                <div className="sm:col-span-7 flex flex-col space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#FF642D] text-white font-heading font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                      02
                    </div>
                    <h3 className="font-heading font-black text-lg sm:text-xl text-[#0B281D] tracking-tight">
                      Connect with Helpers
                    </h3>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-white/80 border border-[#FFD6BC] flex items-center justify-center shrink-0 text-[#FF642D] mt-0.5">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-xs sm:text-[13px] text-[#173529] font-medium leading-snug">
                        Nearby volunteers and NGOs can discover available food donations and claim suitable collections.
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-white/80 border border-[#FFD6BC] flex items-center justify-center shrink-0 text-[#FF642D] mt-0.5">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-xs sm:text-[13px] text-[#173529] font-medium leading-snug">
                        Location-based matching and pickup coordination help connect surplus food with people ready to collect it.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Graphic Card from Reference */}
                <div className="sm:col-span-5 flex justify-center sm:justify-end">
                  <div className="relative w-full max-w-[210px] rounded-2xl overflow-hidden shadow-sm group-hover:scale-[1.02] transition-transform duration-300">
                    <img
                      src={step2VolunteerImg}
                      alt="Map route tracking with volunteer matched indicator"
                      className="w-full h-auto object-cover rounded-2xl"
                      loading="lazy"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* ── CARD 03: Verified Handover ────────────────────────── */}
            <div className="group relative rounded-3xl bg-[#EAF5ED] border border-[#DFE9E0] p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                
                {/* Left: Text & bullets */}
                <div className="sm:col-span-7 flex flex-col space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#123B2A] text-white font-heading font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                      03
                    </div>
                    <h3 className="font-heading font-black text-lg sm:text-xl text-[#0B281D] tracking-tight">
                      Verified Handover
                    </h3>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-white/80 border border-[#DFE9E0] flex items-center justify-center shrink-0 text-[#278653] mt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-xs sm:text-[13px] text-[#173529] font-medium leading-snug">
                        Pickup confirmation using a verification code helps record when food is handed over.
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-white/80 border border-[#DFE9E0] flex items-center justify-center shrink-0 text-[#278653] mt-0.5">
                        <BarChart3 className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-xs sm:text-[13px] text-[#173529] font-medium leading-snug">
                        Track verified collections and meals saved to see the real impact on reducing food waste and supporting communities.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Graphic Card from Reference */}
                <div className="sm:col-span-5 flex justify-center sm:justify-end">
                  <div className="relative w-full max-w-[210px] rounded-2xl overflow-hidden shadow-sm group-hover:scale-[1.02] transition-transform duration-300">
                    <img
                      src={step3HandoverImg}
                      alt="Hands safely transferring food container with handover verified confirmation"
                      className="w-full h-auto object-cover rounded-2xl"
                      loading="lazy"
                    />
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  )
}
