import React from 'react'
import type { CountryCode } from '../../types/registration'


interface PhoneNumberInputProps {
  id?: string
  countryCode: CountryCode
  onCountryCodeChange: (code: CountryCode) => void
  phoneNumber: string
  onPhoneNumberChange: (val: string) => void
  error?: string
  hasInteracted?: boolean
  onBlur?: () => void
}

const COUNTRIES: { code: CountryCode; label: string; flag: string; digits: number }[] = [
  { code: '+91', label: 'India (+91)', flag: '🇮🇳', digits: 10 },
  { code: '+1', label: 'USA / Canada (+1)', flag: '🇺🇸', digits: 10 },
  { code: '+44', label: 'United Kingdom (+44)', flag: '🇬🇧', digits: 10 },
  { code: '+61', label: 'Australia (+61)', flag: '🇦🇺', digits: 9 },
  { code: '+971', label: 'UAE (+971)', flag: '🇦🇪', digits: 9 },
]

export const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  id = 'phone-number-input',
  countryCode,
  onCountryCodeChange,
  phoneNumber,
  onPhoneNumberChange,
  error,
  hasInteracted,
  onBlur,
}) => {
  const currentCountry = COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only accept numeric digits
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, currentCountry.digits)
    onPhoneNumberChange(cleaned)
  }

  const isInvalid = Boolean(error && hasInteracted)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex rounded-xl border border-[#E6EAE7] focus-within:border-[#29352F] focus-within:ring-2 focus-within:ring-[#29352F]/10 transition-all overflow-hidden bg-white">
        {/* Country Code Selector */}
        <div className="relative bg-[#FAFAFA] border-r border-[#E6EAE7] flex items-center px-3">
          <span className="text-base mr-1.5" aria-hidden="true">{currentCountry.flag}</span>
          <select
            id={`${id}-country`}
            aria-label="Select country code"
            value={countryCode}
            onChange={(e) => onCountryCodeChange(e.target.value as CountryCode)}
            className="bg-transparent text-sm font-semibold text-[#29352F] focus:outline-none cursor-pointer pr-1"
          >
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.code} ({country.label.split(' ')[0]})
              </option>
            ))}
          </select>
        </div>

        {/* Number Input */}
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="tel-national"
          value={phoneNumber}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={`Enter ${currentCountry.digits}-digit phone number`}
          aria-invalid={isInvalid ? 'true' : undefined}
          aria-describedby={isInvalid ? `${id}-error` : undefined}
          className={`w-full px-3.5 py-2.5 text-sm font-medium text-[#29352F] placeholder-[#6B756F]/60 bg-white focus:outline-none ${
            isInvalid ? 'bg-red-50/30' : ''
          }`}
        />
      </div>
    </div>
  )
}
