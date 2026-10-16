import crypto from 'node:crypto'

export interface VerificationSendResult {
  success: boolean
  verificationId?: string
  status?: string
  error?: string
  errorCode?: 'CONFIGURATION_ERROR' | 'RATE_LIMIT_EXCEEDED' | 'INVALID_PHONE' | 'PROVIDER_ERROR'
  retryAfterSeconds?: number
}

export interface VerificationCheckResult {
  success: boolean
  status: 'approved' | 'pending' | 'failed' | 'expired'
  verificationToken?: string
  error?: string
  errorCode?: 'INVALID_CODE' | 'EXPIRED_CODE' | 'MAX_ATTEMPTS_EXCEEDED' | 'PROVIDER_ERROR' | 'CONFIGURATION_ERROR'
}

/**
 * Normalizes a phone number to standard E.164 format.
 * Prevents duplicate country codes (+91+91 or +9191...).
 */
export function normalizePhoneNumber(countryCode: string, phoneNumber: string): string {
  const digitsOnly = phoneNumber.replace(/\D/g, '')
  const codeDigits = countryCode.replace(/\D/g, '')

  // For Indian phone numbers (+91), always take the last 10 digits
  if (countryCode === '+91') {
    if (digitsOnly.length >= 10) {
      const last10 = digitsOnly.slice(-10)
      return `+91${last10}`
    }
    return `+91${digitsOnly}`
  }

  // Generic country code normalization
  if (digitsOnly.startsWith(codeDigits)) {
    return `+${digitsOnly}`
  }
  return `+${codeDigits}${digitsOnly}`
}


/**
 * In-memory security tracker for rate limiting and attempt locking.
 */
interface PhoneAttemptRecord {
  sendTimestamps: number[]
  lastSentAt: number
  verifyAttempts: number
  isLockedOutUntil?: number
  activeVerificationId?: string
}

const attemptStore = new Map<string, PhoneAttemptRecord>()

// Security constants
const RESEND_COOLDOWN_MS = 30 * 1000 // 30 seconds
const MAX_SENDS_PER_WINDOW = 3
const SEND_WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const MAX_VERIFY_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes lockout after 5 failed code attempts

export interface SMSConfig {
  provider: string
  accountSid?: string
  authToken?: string
  verifyServiceSid?: string
  secretKey: string
}

export class SMSVerificationService {
  private config: SMSConfig

  constructor(config?: Partial<SMSConfig>) {
    this.config = {
      provider: config?.provider || process.env.SMS_PROVIDER || 'twilio',
      accountSid: config?.accountSid || process.env.SMS_ACCOUNT_SID,
      authToken: config?.authToken || process.env.SMS_AUTH_TOKEN,
      verifyServiceSid: config?.verifyServiceSid || process.env.SMS_VERIFY_SERVICE_SID,
      secretKey: config?.secretKey || process.env.OTP_SECRET || '',
    }
  }

  /**
   * Validates whether production SMS provider credentials are configured.
   */
  public isConfigured(): { configured: boolean; missingVars: string[] } {
    const missing: string[] = []
    if (!this.config.accountSid) missing.push('SMS_ACCOUNT_SID')
    if (!this.config.authToken) missing.push('SMS_AUTH_TOKEN')
    if (!this.config.verifyServiceSid) missing.push('SMS_VERIFY_SERVICE_SID')
    if (!this.config.secretKey) missing.push('OTP_SECRET')

    return {
      configured: missing.length === 0,
      missingVars: missing,
    }
  }

  /**
   * Generates a tamper-proof cryptographic HMAC signature proving that this
   * exact phone number was verified by the server at a specific timestamp.
   */
  public generateVerificationProof(phoneNumber: string, verificationId: string): string {
    const timestamp = Date.now()
    const payload = `${phoneNumber}:${verificationId}:${timestamp}`
    const hmac = crypto.createHmac('sha256', this.config.secretKey).update(payload).digest('hex')
    return `sam_v1_${timestamp}_${hmac}`
  }

  /**
   * Validates a cryptographic verification proof token.
   */
  public verifyProof(phoneNumber: string, verificationId: string, proof: string): boolean {
    const parts = proof.split('_')
    if (parts.length !== 4 || parts[0] !== 'sam' || parts[1] !== 'v1') return false

    const timestamp = Number(parts[2])
    const providedHmac = parts[3]

    // Token expires after 30 minutes
    if (Date.now() - timestamp > 30 * 60 * 1000) return false

    const expectedPayload = `${phoneNumber}:${verificationId}:${timestamp}`
    const expectedHmac = crypto.createHmac('sha256', this.config.secretKey).update(expectedPayload).digest('hex')

    return crypto.timingSafeEqual(Buffer.from(providedHmac), Buffer.from(expectedHmac))
  }

  /**
   * Initiates real SMS OTP send to the target phone number.
   */
  public async sendOTP(countryCode: string, rawPhone: string): Promise<VerificationSendResult> {
    const normalizedPhone = normalizePhoneNumber(countryCode, rawPhone)

    // Basic format validation
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      return {
        success: false,
        error: 'Invalid phone number format. Please check the country code and digits.',
        errorCode: 'INVALID_PHONE',
      }
    }

    const now = Date.now()
    const record = attemptStore.get(normalizedPhone) || {
      sendTimestamps: [],
      lastSentAt: 0,
      verifyAttempts: 0,
    }

    // Check lockout
    if (record.isLockedOutUntil && record.isLockedOutUntil > now) {
      const waitMinutes = Math.ceil((record.isLockedOutUntil - now) / 60000)
      return {
        success: false,
        error: `Too many failed verification attempts. Please wait ${waitMinutes} minutes before requesting another code.`,
        errorCode: 'RATE_LIMIT_EXCEEDED',
        retryAfterSeconds: Math.ceil((record.isLockedOutUntil - now) / 1000),
      }
    }

    // Check cooldown
    const timeSinceLast = now - record.lastSentAt
    if (record.lastSentAt > 0 && timeSinceLast < RESEND_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((RESEND_COOLDOWN_MS - timeSinceLast) / 1000)
      return {
        success: false,
        error: `Please wait ${remainingSeconds} seconds before requesting a new code.`,
        errorCode: 'RATE_LIMIT_EXCEEDED',
        retryAfterSeconds: remainingSeconds,
      }
    }

    // Check sliding window rate limit
    record.sendTimestamps = record.sendTimestamps.filter((t) => now - t < SEND_WINDOW_MS)
    if (record.sendTimestamps.length >= MAX_SENDS_PER_WINDOW) {
      return {
        success: false,
        error: `Maximum OTP send limit reached for this number (3 requests per 10 minutes). Please try again later.`,
        errorCode: 'RATE_LIMIT_EXCEEDED',
        retryAfterSeconds: Math.ceil((SEND_WINDOW_MS - (now - record.sendTimestamps[0])) / 1000),
      }
    }

    // Check provider configuration
    const configCheck = this.isConfigured()
    if (!configCheck.configured) {
      return {
        success: false,
        error: `Production SMS verification service is not yet configured. Missing environment variables: ${configCheck.missingVars.join(', ')}. Please configure them in your server environment.`,
        errorCode: 'CONFIGURATION_ERROR',
      }
    }

    // Execute real SMS request through Twilio Verify v2 API
    try {
      const authHeader = `Basic ${Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString('base64')}`
      const url = `https://verify.twilio.com/v2/Services/${this.config.verifyServiceSid}/Verifications`

      const body = new URLSearchParams()
      body.append('To', normalizedPhone)
      body.append('Channel', 'sms')

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      })

      interface TwilioResponse {
        message?: string
        sid?: string
        status?: string
      }

      const data = (await response.json()) as TwilioResponse

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `SMS delivery provider error (Status ${response.status}).`,
          errorCode: 'PROVIDER_ERROR',
        }
      }

      // Record successful send
      record.lastSentAt = now
      record.sendTimestamps.push(now)
      record.verifyAttempts = 0
      record.activeVerificationId = data.sid
      attemptStore.set(normalizedPhone, record)

      return {
        success: true,
        verificationId: data.sid,
        status: data.status,
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Network error communicating with the SMS provider.',
        errorCode: 'PROVIDER_ERROR',
      }
    }
  }

  /**
   * Verifies the actual SMS OTP code entered by the user with the provider.
   */
  public async verifyOTP(
    countryCode: string,
    rawPhone: string,
    code: string,
    verificationId?: string
  ): Promise<VerificationCheckResult> {
    const normalizedPhone = normalizePhoneNumber(countryCode, rawPhone)
    const cleanedCode = code.trim().replace(/\D/g, '')

    if (cleanedCode.length < 4 || cleanedCode.length > 8) {
      return {
        success: false,
        status: 'failed',
        error: 'Verification code must be between 4 and 8 numeric digits.',
        errorCode: 'INVALID_CODE',
      }
    }

    const now = Date.now()
    const record = attemptStore.get(normalizedPhone) || {
      sendTimestamps: [],
      lastSentAt: 0,
      verifyAttempts: 0,
    }

    // Check lockout
    if (record.isLockedOutUntil && record.isLockedOutUntil > now) {
      return {
        success: false,
        status: 'failed',
        error: 'Too many incorrect attempts. For security, this phone number is temporarily locked out. Please try again later.',
        errorCode: 'MAX_ATTEMPTS_EXCEEDED',
      }
    }

    // Increment attempts
    record.verifyAttempts += 1

    if (record.verifyAttempts > MAX_VERIFY_ATTEMPTS) {
      record.isLockedOutUntil = now + LOCKOUT_DURATION_MS
      attemptStore.set(normalizedPhone, record)
      return {
        success: false,
        status: 'failed',
        error: `Maximum verification attempts exceeded (${MAX_VERIFY_ATTEMPTS}/${MAX_VERIFY_ATTEMPTS}). Locked out for 15 minutes.`,
        errorCode: 'MAX_ATTEMPTS_EXCEEDED',
      }
    }

    attemptStore.set(normalizedPhone, record)

    // Check provider configuration
    const configCheck = this.isConfigured()
    if (!configCheck.configured) {
      return {
        success: false,
        status: 'failed',
        error: `SMS provider is not configured. Missing variables: ${configCheck.missingVars.join(', ')}.`,
        errorCode: 'CONFIGURATION_ERROR',
      }
    }

    // Execute verification check via Twilio Verify v2 API
    try {
      const authHeader = `Basic ${Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString('base64')}`
      const url = `https://verify.twilio.com/v2/Services/${this.config.verifyServiceSid}/VerificationCheck`

      const body = new URLSearchParams()
      body.append('To', normalizedPhone)
      body.append('Code', cleanedCode)
      if (verificationId) {
        body.append('VerificationSid', verificationId)
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      })

      interface TwilioVerifyCheckResponse {
        message?: string
        sid?: string
        status?: 'approved' | 'pending' | 'failed' | 'expired'
      }

      const data = (await response.json()) as TwilioVerifyCheckResponse

      if (!response.ok) {
        return {
          success: false,
          status: 'failed',
          error: data.message || `Failed to verify code (Status ${response.status}).`,
          errorCode: 'PROVIDER_ERROR',
        }
      }

      if (data.status === 'approved') {
        // Reset failed attempts on success
        record.verifyAttempts = 0
        record.isLockedOutUntil = undefined
        attemptStore.set(normalizedPhone, record)

        // Issue server-signed proof
        const token = this.generateVerificationProof(normalizedPhone, data.sid || 'v_approved')

        return {
          success: true,
          status: 'approved',
          verificationToken: token,
        }
      }

      if (data.status === 'expired') {
        return {
          success: false,
          status: 'expired',
          error: 'Verification code has expired. Please request a new code.',
          errorCode: 'EXPIRED_CODE',
        }
      }

      return {
        success: false,
        status: 'failed',
        error: `Invalid verification code. Please check your SMS and try again (${MAX_VERIFY_ATTEMPTS - record.verifyAttempts} attempts remaining).`,
        errorCode: 'INVALID_CODE',
      }
    } catch (err) {
      return {
        success: false,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Network failure during verification check.',
        errorCode: 'PROVIDER_ERROR',
      }
    }
  }
}
