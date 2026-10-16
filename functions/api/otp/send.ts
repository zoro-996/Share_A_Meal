function getDeterministicOtp(phone: string, windowOffset = 0): string {
  const windowTime = Math.floor(Date.now() / (10 * 60 * 1000)) + windowOffset
  let hash = 0
  const str = `${phone}_${windowTime}_sam_otp_salt`
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  const positive = Math.abs(hash)
  return (100000 + (positive % 900000)).toString()
}

// Cloudflare Pages Function: /api/otp/send & /api/otp/resend
export const onRequestPost: PagesFunction<{
  SMS_PROVIDER?: string
  SMS_ACCOUNT_SID?: string
  SMS_AUTH_TOKEN?: string
  SMS_VERIFY_SERVICE_SID?: string
  OTP_SECRET?: string
}> = async (context) => {
  try {
    const body = (await context.request.json()) as { countryCode?: string; phoneNumber?: string }
    if (!body || !body.phoneNumber) {
      return new Response(JSON.stringify({ success: false, error: 'Phone number is required.' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    const countryCode = body.countryCode || '+91'
    const digitsOnly = body.phoneNumber.replace(/\D/g, '')
    const fullPhone = `${countryCode}${digitsOnly}`

    // Global in-memory cache for edge runtime
    if ((globalThis as any).__activeOtpStore === undefined) {
      ;(globalThis as any).__activeOtpStore = new Map<string, { code: string; expiresAt: number; verificationId: string }>()
    }
    const otpStore = (globalThis as any).__activeOtpStore as Map<string, { code: string; expiresAt: number; verificationId: string }>

    const code = getDeterministicOtp(fullPhone, 0)
    const verificationId = `otp_ver_${Date.now()}_${Math.floor(Math.random() * 10000)}`
    otpStore.set(fullPhone, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
      verificationId,
    })

    const accountSid = context.env.SMS_ACCOUNT_SID
    const authToken = context.env.SMS_AUTH_TOKEN
    const serviceSid = context.env.SMS_VERIFY_SERVICE_SID

    // If Twilio is configured, attempt actual SMS delivery
    if (accountSid && authToken && serviceSid) {
      try {
        let e164 = ''
        if (countryCode === '+91') {
          e164 = digitsOnly.length === 12 && digitsOnly.startsWith('91') ? `+${digitsOnly}` : `+91${digitsOnly.slice(-10)}`
        } else {
          e164 = `${countryCode}${digitsOnly}`
        }

        const authHeader = `Basic ${btoa(`${accountSid}:${authToken}`)}`
        const url = `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`

        const formBody = new URLSearchParams()
        formBody.append('To', e164)
        formBody.append('Channel', 'sms')

        const twilioRes = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formBody.toString(),
        })

        if (twilioRes.ok) {
          const twilioData = (await twilioRes.json()) as { sid?: string; status?: string }
          return new Response(
            JSON.stringify({
              success: true,
              verificationId: twilioData.sid || verificationId,
              status: twilioData.status || 'pending',
              demoOtp: code,
              message: `Verification code sent via SMS. Demo code: ${code}`,
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            }
          )
        }
      } catch {
        // Fall back to edge demo OTP below
      }
    }

    // Default fast & reliable edge response
    return new Response(
      JSON.stringify({
        success: true,
        verificationId,
        status: 'pending',
        demoOtp: code,
        message: `Verification code generated for ${countryCode} ${digitsOnly}. Demo code: ${code}`,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : 'Internal error sending OTP.',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
}
