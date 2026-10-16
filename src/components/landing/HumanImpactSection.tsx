import React, { useEffect, useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import mealPhoto from '../../assets/volunteer-meal-handover.jpg'

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

interface HumanImpactSectionProps {
  onActionClick: (role: 'donor' | 'volunteer') => void
}

export const HumanImpactSection: React.FC<HumanImpactSectionProps> = ({ onActionClick }) => {
  const sectionRef = useScrollReveal<HTMLElement>()
  const textRef = useScrollReveal<HTMLDivElement>(80)
  const photoRef = useScrollReveal<HTMLDivElement>(180)

  return (
    <section
      ref={sectionRef}
      className="scroll-reveal relative w-full overflow-hidden"
      style={{ backgroundColor: '#EAF5ED' }}
      aria-label="Human impact — why Share a Meal matters"
    >
      {/* Ambient top glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] pointer-events-none -z-10 blur-3xl opacity-40"
        style={{ background: 'radial-gradient(ellipse, rgba(39,134,83,0.18) 0%, rgba(39,134,83,0) 70%)' }}
        aria-hidden="true"
      />
      {/* Subtle peach glow bottom-right */}
      <div
        className="absolute bottom-0 right-0 w-[400px] h-[360px] pointer-events-none -z-10 blur-3xl opacity-35"
        style={{ background: 'radial-gradient(circle, rgba(255,100,45,0.14) 0%, rgba(255,100,45,0) 70%)' }}
        aria-hidden="true"
      />

      <div className="max-w-[1240px] w-full mx-auto px-6 sm:px-8 lg:px-10 py-16 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-20 items-center">

          {/* ── LEFT: Text content ─────────────────────────────────────── */}
          <div
            ref={textRef}
            className="scroll-reveal flex flex-col gap-6"
          >
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFFCF6] border border-[#DFE9E0] self-start shadow-2xs">
              <span className="font-heading font-bold text-xs text-[#278653] tracking-widest uppercase">
                Beyond Food. Beyond Waste.
              </span>
            </div>

            {/* Heading */}
            <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-[40px] xl:text-[46px] text-[#0B281D] tracking-tight leading-[1.1]">
              Somewhere, Someone{' '}
              <br className="hidden sm:inline" />
              Is Waiting for a{' '}
              <span className="text-[#FF642D]">Meal.</span>
            </h2>

            {/* Pull quote */}
            <blockquote className="relative pl-5 border-l-4 border-[#278653]">
              <p className="font-heading font-semibold text-[#123B2A] text-lg sm:text-xl italic leading-snug">
                "Food should never be wasted while kindness is still possible."
              </p>
            </blockquote>

            {/* Supporting paragraph */}
            <p className="text-[#64756B] text-base leading-relaxed max-w-[440px]">
              Every day, good food is discarded — not from lack of need, but from lack of connection.
              Share a Meal bridges that gap, turning surplus into sustenance and strangers into
              communities of care.
            </p>

            {/* Closing line */}
            <p className="font-heading font-bold text-[#123B2A] text-base leading-snug">
              Let no good meal go to waste.{' '}
              <span className="text-[#278653]">Let no one feel forgotten.</span>
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => onActionClick('donor')}
                className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#123B2A] hover:bg-[#0B281D] text-white font-heading font-bold text-sm shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer active:scale-[0.98]"
              >
                Become a Donor
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onActionClick('volunteer')}
                className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#FFF0E4] hover:bg-[#FFE4CC] text-[#E9511F] border border-[#FFD6BC] font-heading font-bold text-sm shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer active:scale-[0.98]"
              >
                Join as a Volunteer
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* ── RIGHT: Photograph ─────────────────────────────────────── */}
          <div
            ref={photoRef}
            className="scroll-reveal relative flex justify-center lg:justify-end"
          >
            {/* Decorative backdrop blob */}
            <div
              className="absolute -top-6 -right-4 w-[94%] h-[94%] bg-[#FFFCF6]/70 pointer-events-none -z-10"
              style={{ borderRadius: '48% 52% 42% 58% / 52% 44% 56% 48%' }}
              aria-hidden="true"
            />
            {/* Orange peach accent blob */}
            <div
              className="absolute -bottom-4 -left-4 w-[55%] h-[55%] bg-[#FFF0E4]/80 pointer-events-none -z-10"
              style={{ borderRadius: '60% 40% 50% 50% / 40% 60% 50% 50%' }}
              aria-hidden="true"
            />

            {/* Photo frame */}
            <div
              className="relative w-full max-w-[480px] sm:max-w-[520px] overflow-hidden shadow-lg shadow-[#123B2A]/12 border-2 border-white"
              style={{
                borderRadius: '40% 60% 55% 45% / 48% 44% 56% 52%',
                aspectRatio: '1 / 1.04',
              }}
            >
              <img
                src={mealPhoto}
                alt="Volunteer handing a warm meal to an elderly woman at a community dining table"
                className="w-full h-full object-cover object-[68%_35%] select-none scale-102 hover:scale-106 transition-transform duration-700"
                loading="lazy"
              />
              {/* Warm overlay for depth */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(160deg, rgba(18,59,42,0.06) 0%, rgba(255,100,45,0.04) 100%)',
                }}
                aria-hidden="true"
              />
            </div>

            {/* Floating stat card */}
            <div
              className="absolute bottom-6 -left-2 sm:left-4 lg:-left-6 bg-white rounded-2xl border border-[#DFE9E0] shadow-md px-4 py-3 flex items-center gap-3 max-w-[200px]"
              aria-hidden="true"
            >
              <div className="w-9 h-9 rounded-full bg-[#EAF5ED] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#278653]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
                </svg>
              </div>
              <div>
                <div className="font-heading font-extrabold text-[#123B2A] text-sm leading-none">Every Meal</div>
                <div className="text-[#64756B] text-xs mt-0.5 leading-snug">Counts. Every connection matters.</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
