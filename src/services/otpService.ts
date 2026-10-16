import type { CountryCode, OTPVerificationProof } from '../types/registration'

/**
 * ============================================================================
 * HACKATHON DEMO CONFIGURATION
 * Set DEMO_SKIP_OTP to true to temporarily bypass phone OTP verification
 * on both the Donor Registration and Volunteer Registration pages.
 *
 * To restore production SMS verification:
 *   1. Change DEMO_SKIP_OTP below to false, OR
 *   2. Set environment variable VITE_DEMO_SKIP_OTP="false" in your .env file.
 * ============================================================================
 */
export const DEMO_SKIP_OTP: boolean =
  typeof import.meta !== 'undefined' &&
  (import.meta as Record<string, any>).env?.VITE_DEMO_SKIP_OTP !== undefined
    ? (import.meta as Record<string, any>).env.VITE_DEMO_SKIP_OTP === 'true'
    : false

export interface OTPSendResponse {
  success: boolean
  verificationId?: string
  status?: string
  message?: string
  error?: string
  errorCode?: string
  retryAfterSeconds?: number
}

export interface OTPVerifyResponse {
  success: boolean
  status?: 'approved' | 'pending' | 'failed' | 'expired'
  verificationToken?: string
  message?: string
  error?: string
  errorCode?: string
}

export interface SMSProviderStatus {
  provider: string
  isConfigured: boolean
  missingVariables?: string[]
}

/**
 * Checks if the server has configured a production SMS provider.
 */
export async function getSMSProviderStatus(): Promise<SMSProviderStatus> {
  try {
    const res = await fetch('/api/otp/status')
    if (res.ok) {
      return await res.json()
    }
  } catch {
    // ignore
  }
  return {
    provider: 'twilio',
    isConfigured: false,
    missingVariables: ['SMS_ACCOUNT_SID', 'SMS_AUTH_TOKEN', 'SMS_VERIFY_SERVICE_SID'],
  }
}

/**
 * Sends a real SMS OTP request to the backend.
 */
export async function requestOTPSend(
  countryCode: CountryCode,
  phoneNumber: string
): Promise<OTPSendResponse> {
  try {
    const res = await fetch('/api/otp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ countryCode, phoneNumber }),
    })

    const data = await res.json()
    return data
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error connecting to SMS verification service.',
      errorCode: 'NETWORK_ERROR',
    }
  }
}

/**
 * Verifies the actual SMS OTP code entered by the user with the backend provider.
 */
export async function verifyOTPCode(
  countryCode: CountryCode,
  phoneNumber: string,
  code: string,
  verificationId?: string
): Promise<OTPVerifyResponse> {
  try {
    const res = await fetch('/api/otp/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        countryCode,
        phoneNumber,
        code,
        verificationId,
      }),
    })

    const data = await res.json()
    return data
  } catch (err) {
    return {
      success: false,
      status: 'failed',
      error: err instanceof Error ? err.message : 'Network failure during code verification.',
      errorCode: 'NETWORK_ERROR',
    }
  }
}

/**
 * Resends the SMS OTP code via the backend provider.
 */
export async function requestOTPResend(
  countryCode: CountryCode,
  phoneNumber: string
): Promise<OTPSendResponse> {
  try {
    const res = await fetch('/api/otp/resend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ countryCode, phoneNumber }),
    })

    const data = await res.json()
    return data
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error requesting OTP resend.',
      errorCode: 'NETWORK_ERROR',
    }
  }
}

export type { OTPVerificationProof }
