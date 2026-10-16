// Cloudflare Pages Function: /api/otp/verify
export const onRequestPost: PagesFunction<{
  SMS_PROVIDER?: string
  SMS_ACCOUNT_SID?: string
  SMS_AUTH_TOKEN?: string
  SMS_VERIFY_SERVICE_SID?: string
  OTP_SECRET?: string
}> = async (context) => {
  try {
    const body = (await context.request.json()) as {
      countryCode?: string
      phoneNumber?: string
      code?: string
      verificationId?: string
    }

    if (!body || !body.phoneNumber || !body.code) {
      return new Response(
        JSON.stringify({ success: false, error: 'Phone number and verification code are required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const accountSid = context.env.SMS_ACCOUNT_SID
    const authToken = context.env.SMS_AUTH_TOKEN
    const serviceSid = context.env.SMS_VERIFY_SERVICE_SID

    if (!accountSid || !authToken || !serviceSid) {
      return new Response(
        JSON.stringify({
          success: false,
          status: 'failed',
          error: 'SMS provider is not configured. Missing SMS credentials.',
          errorCode: 'CONFIGURATION_ERROR',
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Normalize phone number to E.164
    const digitsOnly = body.phoneNumber.replace(/\D/g, '')
    const countryCode = body.countryCode || '+91'
    let e164 = ''
    if (countryCode === '+91') {
      e164 = digitsOnly.length === 12 && digitsOnly.startsWith('91') ? `+${digitsOnly}` : `+91${digitsOnly.slice(-10)}`
    } else {
      e164 = `${countryCode}${digitsOnly}`
    }

    const authHeader = `Basic ${btoa(`${accountSid}:${authToken}`)}`
    const url = `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`

    const formBody = new URLSearchParams()
    formBody.append('To', e164)
    formBody.append('Code', body.code.trim())
    if (body.verificationId) {
      formBody.append('VerificationSid', body.verificationId)
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody.toString(),
    })

    const data = (await response.json()) as {
      message?: string
      sid?: string
      status?: 'approved' | 'pending' | 'failed' | 'expired'
    }

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          status: 'failed',
          error: data.message || `Failed to verify code (Status ${response.status}).`,
          errorCode: 'PROVIDER_ERROR',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (data.status === 'approved') {
      const timestamp = Date.now()
      const secret = context.env.OTP_SECRET
      if (!secret) {
        return new Response(JSON.stringify({ success: false, status: 'failed', error: 'Phone verification is not available.' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      // Generate WebCrypto HMAC signature
      const encoder = new TextEncoder()
      const keyData = encoder.encode(secret)
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
      const payloadData = encoder.encode(`${e164}:${data.sid || 'v_approved'}:${timestamp}`)
      const signature = await crypto.subtle.sign('HMAC', cryptoKey, payloadData)
      const hexSignature = Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      const verificationToken = `sam_v1_${timestamp}_${hexSignature}`

      return new Response(
        JSON.stringify({
          success: true,
          status: 'approved',
          verificationToken,
          message: 'Phone number successfully verified.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (data.status === 'expired') {
      return new Response(
        JSON.stringify({
          success: false,
          status: 'expired',
          error: 'Verification code has expired. Please request a new code.',
          errorCode: 'EXPIRED_CODE',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: false,
        status: 'failed',
        error: 'Invalid verification code. Please check your SMS and try again.',
        errorCode: 'INVALID_CODE',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Internal error verifying SMS OTP.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
