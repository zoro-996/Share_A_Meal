// Cloudflare Pages Function: /api/otp/send
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
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const accountSid = context.env.SMS_ACCOUNT_SID
    const authToken = context.env.SMS_AUTH_TOKEN
    const serviceSid = context.env.SMS_VERIFY_SERVICE_SID

    if (!accountSid || !authToken || !serviceSid) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            'Production SMS verification service is not yet configured. Missing environment variables: SMS_ACCOUNT_SID, SMS_AUTH_TOKEN, SMS_VERIFY_SERVICE_SID.',
          errorCode: 'CONFIGURATION_ERROR',
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
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
    const url = `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`

    const formBody = new URLSearchParams()
    formBody.append('To', e164)
    formBody.append('Channel', 'sms')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody.toString(),
    })

    const data = (await response.json()) as { message?: string; sid?: string; status?: string }

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: data.message || `SMS delivery provider error (Status ${response.status}).`,
          errorCode: 'PROVIDER_ERROR',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        verificationId: data.sid,
        status: data.status,
        message: 'Verification code requested via SMS.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : 'Internal error sending SMS verification.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
