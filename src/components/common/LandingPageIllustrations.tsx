import React from 'react'

// 1. Share a Meal Brand Logo Icon (Heart with green left leaf & orange right petal)
export const BrandHeartLogoIcon: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <svg
    className={className}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Left Green Leaf Lobe */}
    <path
      d="M20 33C20 33 7.5 24 7.5 14C7.5 8.8 11.5 5 16.2 5C18.4 5 20 6.4 20 6.4C20 6.4 18.2 11.5 18.2 17.5C18.2 24.5 20 33 20 33Z"
      fill="#288349"
      stroke="#133827"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Right Orange Leaf / Petal Lobe */}
    <path
      d="M20 6.4C20 6.4 21.6 5 23.8 5C28.5 5 32.5 8.8 32.5 14C32.5 24 20 33 20 33C20 33 21.8 24.5 21.8 17.5C21.8 11.5 20 6.4 20 6.4Z"
      fill="#F26522"
      stroke="#133827"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

// 2. Vegetable Basket / Produce Crate Illustration (Become a Donor Card)
export const DonorCrateIllustration: React.FC<{ className?: string }> = ({ className = 'w-14 h-14' }) => (
  <svg
    className={className}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Green leafy greens in background */}
    <path
      d="M17 32C15 22 23 16 28 20C32 14 42 16 41 24C46 21 53 26 49 34Z"
      fill="#2E7D32"
    />
    <path
      d="M22 28C20 20 27 16 31 19C34 14 43 17 40 24C45 22 50 26 47 32Z"
      fill="#43A047"
    />

    {/* Tomato / Apple */}
    <circle cx="43" cy="33" r="7" fill="#E53935" />
    <path d="M43 25C43 25 44 23 45 23" stroke="#2E7D32" strokeWidth="1.5" strokeLinecap="round" />

    {/* Carrot peeking out */}
    <path
      d="M32 20L39 34L35 36L29 22C30 21 31 20 32 20Z"
      fill="#F4511E"
    />
    <path d="M32 19L33 15M30 20L28 16M33 21L36 17" stroke="#2E7D32" strokeWidth="1.5" strokeLinecap="round" />

    {/* Crate / Basket Body */}
    <rect x="12" y="32" width="40" height="24" rx="4" fill="#F5C782" stroke="#D89D52" strokeWidth="1.8" />
    {/* Slats line */}
    <line x1="12" y1="44" x2="52" y2="44" stroke="#D89D52" strokeWidth="1.6" strokeDasharray="2 1" />
    {/* Handle / Chevron on front of crate */}
    <path
      d="M28 42L32 46L36 42"
      stroke="#2E7D32"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

// 3. Hands Holding Heart Illustration (Join as a Volunteer Card)
export const VolunteerHandsIllustration: React.FC<{ className?: string }> = ({ className = 'w-14 h-14' }) => (
  <svg
    className={className}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Centered Orange Heart */}
    <path
      d="M32 37C32 37 21 29 21 21C21 16.5 24.5 13 28.8 13C30.8 13 32 14.5 32 14.5C32 14.5 33.2 13 35.2 13C39.5 13 43 16.5 43 21C43 29 32 37 32 37Z"
      fill="#F26522"
    />

    {/* Left caring hand */}
    <path
      d="M12 43L18 36C20 34 23 34 25 36L30 42C31 43 31 45 30 46L24 51C22 52 19 51 17 49L12 43Z"
      fill="#F6B17A"
    />
    <path
      d="M21 34C22.5 33 25.5 33 27 35L33 41"
      stroke="#E29255"
      strokeWidth="1.5"
      strokeLinecap="round"
    />

    {/* Right caring hand */}
    <path
      d="M52 43L46 36C44 34 41 34 39 36L34 42C33 43 33 45 34 46L40 51C42 52 45 51 47 49L52 43Z"
      fill="#F6B17A"
    />
    <path
      d="M43 34C41.5 33 38.5 33 37 35L31 41"
      stroke="#E29255"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

// 4. Floating Decorative Leaves
export const DecorativeLeafGreen: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    className={className}
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M4 24C4 24 6 12 16 6C23 1.8 26 2 26 2C26 2 26.2 5 22 12C16 22 4 24 4 24Z"
      fill="#A8DCB8"
    />
  </svg>
)

export const DecorativePetalOrange: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    className={className}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M3 17C3 17 4 8 11 4C16 1.2 18 1.4 18 1.4C18 1.4 18.1 3.4 15.3 8.3C11.1 15.3 3 17 3 17Z"
      fill="#F69567"
    />
  </svg>
)

// 5. Bottom Impact Icons
export const ImpactLeafIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M4 20C4 20 5.5 10 14 5C20 1.5 22 2 22 2C22 2 22.5 4 19 10C14 18.5 4 20 4 20Z"
      fill="#1B8349"
    />
    <path
      d="M4 20C8 17 12 13 16 8"
      stroke="#A8DCB8"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

export const ImpactCommunityIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    className={className}
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Center person */}
    <circle cx="14" cy="9" r="3.5" fill="#EA580C" />
    <path
      d="M9 22C9 18.5 11.2 16 14 16C16.8 16 19 18.5 19 22"
      stroke="#EA580C"
      strokeWidth="2.8"
      strokeLinecap="round"
    />
    {/* Left person */}
    <circle cx="7.5" cy="11.5" r="2.8" fill="#F26522" />
    <path
      d="M3.5 22C3.5 19 5.2 17.2 7.5 17.2"
      stroke="#F26522"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    {/* Right person */}
    <circle cx="20.5" cy="11.5" r="2.8" fill="#F26522" />
    <path
      d="M24.5 22C24.5 19 22.8 17.2 20.5 17.2"
      stroke="#F26522"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
)

export const ImpactHeartHandIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    className={className}
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Heart hovering */}
    <path
      d="M14 14C14 14 8.5 9.5 8.5 5.5C8.5 3.2 10.3 1.5 12.5 1.5C13.5 1.5 14 2.2 14 2.2C14 2.2 14.5 1.5 15.5 1.5C17.7 1.5 19.5 3.2 19.5 5.5C19.5 9.5 14 14 14 14Z"
      fill="#2563EB"
    />
    {/* Hand underneath */}
    <path
      d="M4 19L10 16.5C12 15.7 14.5 16.2 16 17.8L18 20C19.5 21.5 22 22 24 21.2L26 20.5"
      stroke="#2563EB"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <path
      d="M6 23L12 21C13.5 20.5 15.2 21 16.2 22.2L17.5 23.5"
      stroke="#2563EB"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
)
