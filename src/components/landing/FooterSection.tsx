import React, { useEffect, useRef } from 'react'
import { ArrowRight, Mail, MapPin } from 'lucide-react'
import { DonorCrateIllustration, VolunteerHandsIllustration } from '../common/LandingPageIllustrations'

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
      { threshold: 0.08 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])
  return ref
}

// ── Instagram SVG icon ────────────────────────────────────────────────────────
const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
)

// ── TikTok SVG icon ───────────────────────────────────────────────────────────
const TikTokIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.69a8.18 8.18 0 0 0 4.79 1.52V6.76a4.85 4.85 0 0 1-1.03-.07z" />
  </svg>
)

// ── X / Twitter SVG icon ──────────────────────────────────────────────────────
const XIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.629 5.905-5.629zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

interface FooterSectionProps {
  onActionClick: (role: 'donor' | 'volunteer') => void
}

export const FooterSection: React.FC<FooterSectionProps> = ({ onActionClick }) => {
  const ctaRef = useScrollReveal<HTMLDivElement>()
  const headingRef = useScrollReveal<HTMLHeadingElement>(80)
  const buttonsRef = useScrollReveal<HTMLDivElement>(160)

  const CURRENT_YEAR = 2026

  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToHowItWorks = (e: React.MouseEvent) => {
    e.preventDefault()
    const el = document.getElementById('how-it-works')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <footer aria-label="Site footer" className="relative w-full overflow-hidden">
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 1. CTA SECTION — Cream Foundation with Floral Accents          */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="relative bg-[#FFFCF6] pt-16 sm:pt-20 lg:pt-24 pb-12 sm:pb-16 overflow-hidden">
        
        {/* Ambient radial glows */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[340px] pointer-events-none -z-10 blur-3xl opacity-35"
          style={{ background: 'radial-gradient(ellipse, rgba(39,134,83,0.12) 0%, rgba(39,134,83,0) 70%)' }}
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-10 left-[8%] w-[380px] h-[300px] pointer-events-none -z-10 blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(234,245,237,0.9) 0%, rgba(234,245,237,0) 70%)' }}
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-10 right-[8%] w-[350px] h-[300px] pointer-events-none -z-10 blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(255,240,228,0.9) 0%, rgba(255,240,228,0) 70%)' }}
          aria-hidden="true"
        />

        {/* Decorative handwriting labels from reference image */}
        <div
          className="absolute top-14 left-[5%] text-[#123B2A]/30 font-serif italic text-base sm:text-lg leading-tight select-none pointer-events-none hidden xl:block rotate-[-6deg]"
          aria-hidden="true"
        >
          <div>Good Food</div>
          <div className="flex items-center gap-1">
            <span>Brighter Communities.</span>
          </div>
          {/* Curved brush underline */}
          <svg className="w-28 h-3 text-[#278653]/30 mt-0.5" viewBox="0 0 120 12" fill="none">
            <path d="M2 9C30 3 80 3 118 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        <div
          className="absolute top-14 right-[5%] text-[#123B2A]/30 font-serif italic text-base sm:text-lg leading-tight select-none pointer-events-none hidden xl:block rotate-[5deg] text-left"
          aria-hidden="true"
        >
          <div>People</div>
          <div>Food</div>
          <div>Stronger Communities.</div>
          {/* Curved orange brush underline */}
          <svg className="w-28 h-3 text-[#FF642D]/35 mt-0.5" viewBox="0 0 120 12" fill="none">
            <path d="M2 4C35 9 85 9 118 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Floating leaves in upper corners */}
        <div className="absolute top-8 left-16 pointer-events-none hidden lg:block opacity-60">
          <svg className="w-6 h-6 text-[#278653] rotate-[25deg]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
          </svg>
        </div>
        <div className="absolute top-10 right-20 pointer-events-none hidden lg:block opacity-60">
          <svg className="w-5 h-5 text-[#278653] rotate-[-40deg]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
          </svg>
        </div>

        <div className="max-w-[1240px] w-full mx-auto px-6 sm:px-8 lg:px-10 text-center relative z-10">
          
          {/* Mission badge */}
          <div
            ref={ctaRef}
            className="scroll-reveal inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF5ED] border border-[#DFE9E0] shadow-2xs mb-5"
          >
            <svg className="w-3.5 h-3.5 text-[#278653] shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
            </svg>
            <span className="font-heading font-bold text-xs text-[#123B2A] tracking-tight">Be Part of the Change</span>
          </div>

          {/* Headline */}
          <h2
            ref={headingRef}
            className="scroll-reveal font-heading font-black text-3xl sm:text-5xl lg:text-[52px] xl:text-[58px] text-[#0B281D] tracking-tight leading-[1.08] max-w-3xl mx-auto mb-5"
          >
            Together, We Can <br />
            Share a <span className="text-[#FF642D]">Better Tomorrow.</span>
          </h2>

          {/* Description */}
          <p className="text-[#64756B] text-base sm:text-lg font-medium leading-relaxed max-w-xl mx-auto mb-10">
            Your extra food can fill empty plates, reduce food waste, and
            bring hope to communities. Join hands with us and make a real difference.
          </p>

          {/* Two CTA Action Cards (matching exact reference buttons with comic rays) */}
          <div
            ref={buttonsRef}
            className="scroll-reveal flex flex-col sm:flex-row gap-5 items-center justify-center max-w-[640px] mx-auto"
          >
            {/* Card 1: Become a Donor (with comic accent rays) */}
            <div className="relative group w-full sm:w-auto">
              {/* Comic rays on upper left */}
              <div className="absolute -top-3.5 -left-3 pointer-events-none hidden sm:block text-[#123B2A]" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="4" y1="4" x2="8" y2="8" />
                  <line x1="2" y1="12" x2="7" y2="12" />
                  <line x1="4" y1="20" x2="8" y2="16" />
                </svg>
              </div>

              <button
                type="button"
                onClick={() => onActionClick('donor')}
                className="w-full sm:w-auto flex items-center justify-between gap-4 pl-4 pr-5 py-3.5 rounded-full bg-[#123B2A] hover:bg-[#0B281D] text-white shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer min-w-[240px] active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <DonorCrateIllustration className="w-7 h-7 shrink-0" />
                  </div>
                  <div className="text-left">
                    <div className="font-heading font-black text-sm leading-tight text-white">Become a Donor</div>
                    <div className="text-white/70 text-xs mt-0.5">Share your surplus food</div>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:translate-x-0.5 transition-all">
                  <ArrowRight className="w-4 h-4 text-white" aria-hidden="true" />
                </div>
              </button>
            </div>

            {/* Card 2: Join as a Volunteer (with comic accent rays) */}
            <div className="relative group w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onActionClick('volunteer')}
                className="w-full sm:w-auto flex items-center justify-between gap-4 pl-4 pr-5 py-3.5 rounded-full bg-[#FFF0E4] hover:bg-[#FFE4CC] border border-[#FFD6BC] text-[#0B281D] shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer min-w-[240px] active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FF642D]/10 flex items-center justify-center shrink-0">
                    <VolunteerHandsIllustration className="w-7 h-7 shrink-0" />
                  </div>
                  <div className="text-left">
                    <div className="font-heading font-black text-sm leading-tight text-[#123B2A]">Join as a Volunteer</div>
                    <div className="text-[#64756B] text-xs mt-0.5">Help collect and share food</div>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#FF642D] group-hover:bg-[#E9511F] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 group-hover:translate-x-0.5 transition-all">
                  <ArrowRight className="w-4 h-4 text-white" aria-hidden="true" />
                </div>
              </button>

              {/* Comic rays on upper right */}
              <div className="absolute -top-3.5 -right-3 pointer-events-none hidden sm:block text-[#FF642D]" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="20" y1="4" x2="16" y2="8" />
                  <line x1="22" y1="12" x2="17" y2="12" />
                  <line x1="20" y1="20" x2="16" y2="16" />
                </svg>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 2. UNDULATING BOTANICAL WAVE TRANSITION                      */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div
        className="relative w-full overflow-hidden leading-none select-none pointer-events-none"
        style={{ height: '110px', marginBottom: '-1px' }}
        aria-hidden="true"
      >
        {/* Deep Forest Green Wave */}
        <svg
          className="absolute bottom-0 left-0 w-full h-[110px]"
          viewBox="0 0 1440 110"
          preserveAspectRatio="none"
          fill="#0B281D"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0,60 C240,110 440,25 720,70 C1000,115 1200,35 1440,65 L1440,110 L0,110 Z" />
        </svg>

        {/* Botanical leaves rising on left edge */}
        <div className="absolute bottom-0 left-0 w-44 h-28 pointer-events-none opacity-85">
          <svg viewBox="0 0 160 100" fill="none" className="w-full h-full text-[#144733]">
            <path d="M0 100 C15 70 30 40 60 30 C50 50 35 80 0 100 Z" fill="currentColor" />
            <path d="M10 100 C30 65 60 35 95 20 C80 48 55 75 10 100 Z" fill="#1A543D" />
            <path d="M30 100 C50 70 85 45 130 35 C110 58 75 80 30 100 Z" fill="#206147" />
          </svg>
        </div>

        {/* Botanical leaves rising on right edge */}
        <div className="absolute bottom-0 right-0 w-44 h-28 pointer-events-none opacity-85">
          <svg viewBox="0 0 160 100" fill="none" className="w-full h-full text-[#144733]">
            <path d="M160 100 C145 70 130 40 100 30 C110 50 125 80 160 100 Z" fill="currentColor" />
            <path d="M150 100 C130 65 100 35 65 20 C80 48 105 75 150 100 Z" fill="#1A543D" />
            <path d="M130 100 C110 70 75 45 30 35 C50 58 85 80 130 100 Z" fill="#206147" />
          </svg>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 3. DEEP FOREST GREEN FOOTER CONTENT                           */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="bg-[#0B281D] text-white relative">
        
        {/* Subtle background leaves in dark footer background */}
        <div className="absolute bottom-6 left-2 pointer-events-none opacity-15 hidden lg:block">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="currentColor" className="text-[#278653]">
            <ellipse cx="60" cy="60" rx="25" ry="50" transform="rotate(-30 60 60)" />
          </svg>
        </div>
        <div className="absolute bottom-6 right-2 pointer-events-none opacity-15 hidden lg:block">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="currentColor" className="text-[#278653]">
            <ellipse cx="60" cy="60" rx="25" ry="50" transform="rotate(30 60 60)" />
          </svg>
        </div>

        <div className="max-w-[1240px] w-full mx-auto px-6 sm:px-8 lg:px-10 pt-10 pb-8 relative z-10">
          
          {/* Main Footer Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6 mb-12">

            {/* Column 1: Brand & Socials (Col span 4) */}
            <div className="sm:col-span-2 lg:col-span-4 flex flex-col gap-4">
              {/* Logo */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#278653] flex items-center justify-center shadow-xs">
                  <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
                  </svg>
                </div>
                <span className="font-heading font-black text-2xl tracking-tight text-white">
                  Share a <span className="text-[#FF642D]">Meal</span>
                </span>
              </div>

              <div className="text-[#A8BDB5] text-sm leading-relaxed max-w-[260px]">
                <p>Connecting surplus food with care.</p>
                <p>Good food. Brighter communities.</p>
              </div>

              {/* Exact Social Icons with Authentic Colors */}
              <div className="flex items-center gap-3 pt-2">
                {/* Instagram Gradient */}
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share a Meal on Instagram"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-xs hover:scale-108 transition-transform duration-200"
                  style={{
                    background:
                      'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
                  }}
                >
                  <InstagramIcon className="w-4.5 h-4.5" />
                </a>

                {/* TikTok Icon */}
                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share a Meal on TikTok"
                  className="w-9 h-9 rounded-full bg-black border border-white/20 flex items-center justify-center text-white shadow-xs hover:scale-108 transition-transform duration-200"
                >
                  <TikTokIcon className="w-4.5 h-4.5" />
                </a>

                {/* X Icon */}
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share a Meal on X"
                  className="w-9 h-9 rounded-full bg-black border border-white/20 flex items-center justify-center text-white shadow-xs hover:scale-108 transition-transform duration-200"
                >
                  <XIcon className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Column 2: Quick Links (Col span 3, vertical border) */}
            <div className="lg:col-span-3 flex flex-col gap-3 lg:border-l lg:border-white/10 lg:pl-8">
              <h3 className="font-heading font-extrabold text-xs text-[#278653] uppercase tracking-widest">
                Quick Links
              </h3>
              <ul className="flex flex-col gap-2.5">
                <li>
                  <button
                    type="button"
                    onClick={scrollToTop}
                    className="text-[#A8BDB5] hover:text-white text-sm transition-colors duration-150 cursor-pointer"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={scrollToHowItWorks}
                    className="text-[#A8BDB5] hover:text-white text-sm transition-colors duration-150 cursor-pointer"
                  >
                    About
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={scrollToHowItWorks}
                    className="text-[#A8BDB5] hover:text-white text-sm transition-colors duration-150 cursor-pointer"
                  >
                    How It Works
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onActionClick('donor')}
                    className="text-[#A8BDB5] hover:text-white text-sm transition-colors duration-150 cursor-pointer"
                  >
                    Become a Donor
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onActionClick('volunteer')}
                    className="text-[#A8BDB5] hover:text-white text-sm transition-colors duration-150 cursor-pointer"
                  >
                    Join as a Volunteer
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Support (Col span 2, vertical border) */}
            <div className="lg:col-span-2 flex flex-col gap-3 lg:border-l lg:border-white/10 lg:pl-6">
              <h3 className="font-heading font-extrabold text-xs text-[#278653] uppercase tracking-widest">
                Support
              </h3>
              <ul className="flex flex-col gap-2.5">
                {['Help & FAQ', 'Contact Us', 'Community Guidelines', 'Privacy Policy', 'Terms of Service'].map(
                  (label) => (
                    <li key={label}>
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        className="text-[#A8BDB5] hover:text-white text-sm transition-colors duration-150"
                      >
                        {label}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Column 4: Get In Touch (Col span 3, vertical border) */}
            <div className="lg:col-span-3 flex flex-col gap-3 lg:border-l lg:border-white/10 lg:pl-8">
              <h3 className="font-heading font-extrabold text-xs text-[#278653] uppercase tracking-widest">
                Get In Touch
              </h3>
              <div className="flex flex-col gap-3 pt-1">
                <a
                  href="mailto:contact@shareameal.org"
                  className="flex items-center gap-2.5 text-[#A8BDB5] hover:text-white transition-colors group"
                >
                  <Mail className="w-4 h-4 text-[#278653] shrink-0" aria-hidden="true" />
                  <span className="text-sm font-medium">contact@shareameal.org</span>
                </a>

                <div className="flex items-center gap-2.5 text-[#A8BDB5]">
                  <MapPin className="w-4 h-4 text-[#278653] shrink-0" aria-hidden="true" />
                  <span className="text-sm font-medium">Tirupati, India</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Divider Line */}
          <div className="border-t border-white/10" />

          {/* Bottom Bar: Copyright & Legal */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 text-xs text-[#6B8A80]">
            <p>© {CURRENT_YEAR} Share a Meal. All rights reserved.</p>
            <div className="flex items-center gap-4">
              {['Privacy Policy', 'Terms of Service', 'Cookies'].map((label, idx) => (
                <React.Fragment key={label}>
                  {idx > 0 && <span className="text-[#6B8A80]/50">|</span>}
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="text-[#6B8A80] hover:text-[#A8BDB5] transition-colors"
                  >
                    {label}
                  </a>
                </React.Fragment>
              ))}
            </div>
          </div>

        </div>
      </div>
    </footer>
  )
}
