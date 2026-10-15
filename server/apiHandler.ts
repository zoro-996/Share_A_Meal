import { SMSVerificationService } from './otpProvider.ts'
import { donationStore } from './donationStore.ts'
import type { IncomingMessage, ServerResponse } from 'node:http'

const smsService = new SMSVerificationService()

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
  const pathname = url.pathname

  if (!pathname.startsWith('/api/')) {
    return false
  }

  // Helper to read JSON body
  const readJsonBody = async <T>(): Promise<T> => {
    return new Promise((resolve, reject) => {
      let body = ''
      req.on('data', (chunk) => {
        body += chunk
      })
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {})
        } catch (e) {
          reject(e)
        }
      })
      req.on('error', reject)
    })
  }

  // Helper to send JSON response
  const sendJson = (statusCode: number, data: unknown) => {
    res.statusCode = statusCode
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(data))
  }

  // 1. GET /api/otp/status
  if (pathname === '/api/otp/status' && req.method === 'GET') {
    const status = smsService.isConfigured()
    sendJson(200, {
      provider: 'twilio',
      isConfigured: status.configured,
      missingVariables: status.missingVars,
    })
    return true
  }

  // 2. POST /api/otp/send
  if (pathname === '/api/otp/send' && req.method === 'POST') {
    try {
      const body = await readJsonBody<{ countryCode?: string; phoneNumber?: string }>()
      if (!body.phoneNumber) {
        sendJson(400, { success: false, error: 'Phone number is required.' })
        return true
      }

      const result = await smsService.sendOTP(body.countryCode || '+91', body.phoneNumber)
      if (result.success) {
        sendJson(200, {
          success: true,
          verificationId: result.verificationId,
          status: result.status,
          message: 'Verification code requested via SMS.',
        })
      } else {
        const statusCode = result.errorCode === 'CONFIGURATION_ERROR' ? 503 : 400
        sendJson(statusCode, result)
      }
    } catch {
      sendJson(500, { success: false, error: 'Internal server error processing OTP send request.' })
    }
    return true
  }

  // 3. POST /api/otp/verify
  if (pathname === '/api/otp/verify' && req.method === 'POST') {
    try {
      const body = await readJsonBody<{
        countryCode?: string
        phoneNumber?: string
        code?: string
        verificationId?: string
      }>()

      if (!body.phoneNumber || !body.code) {
        sendJson(400, { success: false, error: 'Phone number and verification code are required.' })
        return true
      }

      const result = await smsService.verifyOTP(
        body.countryCode || '+91',
        body.phoneNumber,
        body.code,
        body.verificationId
      )

      if (result.success) {
        sendJson(200, {
          success: true,
          status: 'approved',
          verificationToken: result.verificationToken,
          message: 'Phone number successfully verified.',
        })
      } else {
        sendJson(400, result)
      }
    } catch {
      sendJson(500, { success: false, error: 'Internal server error verifying OTP.' })
    }
    return true
  }

  // 4. POST /api/otp/resend
  if (pathname === '/api/otp/resend' && req.method === 'POST') {
    try {
      const body = await readJsonBody<{ countryCode?: string; phoneNumber?: string }>()
      if (!body.phoneNumber) {
        sendJson(400, { success: false, error: 'Phone number is required for resend.' })
        return true
      }

      const result = await smsService.sendOTP(body.countryCode || '+91', body.phoneNumber)
      if (result.success) {
        sendJson(200, {
          success: true,
          verificationId: result.verificationId,
          status: result.status,
          message: 'New verification code requested via SMS.',
        })
      } else {
        const statusCode = result.errorCode === 'CONFIGURATION_ERROR' ? 503 : 400
        sendJson(statusCode, result)
      }
    } catch {
      sendJson(500, { success: false, error: 'Internal server error resending OTP.' })
    }
    return true
  }

  // 5. GET /api/geocode/reverse?lat=...&lon=...
  if (pathname === '/api/geocode/reverse' && req.method === 'GET') {
    const lat = url.searchParams.get('lat')
    const lon = url.searchParams.get('lon')

    if (!lat || !lon) {
      sendJson(400, { error: 'lat and lon query parameters are required.' })
      return true
    }

    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        lat
      )}&lon=${encodeURIComponent(lon)}&addressdetails=1`

      const nominatimRes = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'ShareAMealApp/1.0 (contact@shareameal.local)',
          'Accept': 'application/json',
          'Accept-Language': 'en',
        },
      })

      if (!nominatimRes.ok) {
        sendJson(nominatimRes.status, { error: 'Reverse geocode provider error' })
        return true
      }

      const data = await nominatimRes.json()
      sendJson(200, data)
    } catch (err) {
      sendJson(500, {
        error: err instanceof Error ? err.message : 'Failed to reverse geocode coordinates.',
      })
    }
    return true
  }

  // ========================================================
  // 6. DONATION API ENDPOINTS
  // ========================================================

  // GET /api/donations
  if (pathname === '/api/donations' && req.method === 'GET') {
    const role = url.searchParams.get('role') as 'donor' | 'volunteer' | 'admin' | null
    const userId = url.searchParams.get('userId') || undefined
    const status = url.searchParams.get('status') || undefined
    const locality = url.searchParams.get('locality') || undefined

    const list = donationStore.getAllDonations({
      role: role || undefined,
      userId,
      status,
      locality,
    })
    sendJson(200, { success: true, donations: list })
    return true
  }

  // POST /api/donations/create
  if (pathname === '/api/donations/create' && req.method === 'POST') {
    try {
      const body = await readJsonBody<any>()
      if (!body.donorName || !body.items || body.items.length === 0) {
        sendJson(400, { success: false, error: 'Donor name and at least one food item are required.' })
        return true
      }

      const newDonation = donationStore.createDonation(body)
      sendJson(201, { success: true, donation: newDonation })
    } catch (err) {
      sendJson(500, { success: false, error: err instanceof Error ? err.message : 'Failed to create donation.' })
    }
    return true
  }

  // Match /api/donations/:id and sub-actions
  const donationMatch = pathname.match(/^\/api\/donations\/([^/]+)(?:\/([^/]+))?$/)
  if (donationMatch && donationMatch[1] !== 'create') {
    const donationId = donationMatch[1]
    const action = donationMatch[2]

    // GET /api/donations/:id
    if (!action && req.method === 'GET') {
      const role = url.searchParams.get('role') as 'donor' | 'volunteer' | 'admin' | null
      const userId = url.searchParams.get('userId') || undefined
      const donation = donationStore.getDonationById(donationId, role || undefined, userId)

      if (!donation) {
        sendJson(404, { success: false, error: 'Donation not found.' })
        return true
      }
      sendJson(200, { success: true, donation })
      return true
    }

    // POST /api/donations/:id/claim
    if (action === 'claim' && req.method === 'POST') {
      try {
        const body = await readJsonBody<{
          volunteerId: string
          volunteerName: string
          volunteerPhone: string
          volunteerVehicle?: string
          volunteerRole?: 'individual' | 'ngo_member'
          ngoName?: string
        }>()

        if (!body.volunteerId || !body.volunteerName || !body.volunteerPhone) {
          sendJson(400, { success: false, error: 'Volunteer id, name, and phone are required to claim.' })
          return true
        }

        const result = donationStore.claimDonation(donationId, {
          id: body.volunteerId,
          name: body.volunteerName,
          phone: body.volunteerPhone,
          vehicle: body.volunteerVehicle,
          role: body.volunteerRole,
          ngoName: body.ngoName,
        })

        if (!result.success) {
          sendJson(409, result)
          return true
        }

        sendJson(200, result)
      } catch {
        sendJson(500, { success: false, error: 'Failed to process claim.' })
      }
      return true
    }

    // POST /api/donations/:id/status
    if (action === 'status' && req.method === 'POST') {
      try {
        const body = await readJsonBody<{
          status: any
          volunteerId: string
          note?: string
          coordinates?: { latitude: number; longitude: number }
          estimatedArrivalMinutes?: number
        }>()

        if (!body.status || !body.volunteerId) {
          sendJson(400, { success: false, error: 'Status and volunteerId are required.' })
          return true
        }

        const result = donationStore.updatePickupStatus(donationId, body.status, body.volunteerId, {
          note: body.note,
          coordinates: body.coordinates,
          estimatedArrivalMinutes: body.estimatedArrivalMinutes,
        })

        if (!result.success) {
          sendJson(400, result)
          return true
        }

        sendJson(200, result)
      } catch {
        sendJson(500, { success: false, error: 'Failed to update pickup status.' })
      }
      return true
    }

    // POST /api/donations/:id/verify-handover
    if (action === 'verify-handover' && req.method === 'POST') {
      try {
        const body = await readJsonBody<{
          code: string
          volunteerId: string
        }>()

        if (!body.code || !body.volunteerId) {
          sendJson(400, { success: false, error: 'Verification code and volunteerId are required.' })
          return true
        }

        const result = donationStore.verifyHandoverOtp(donationId, body.code, body.volunteerId)
        if (!result.success) {
          sendJson(400, result)
          return true
        }

        sendJson(200, result)
      } catch {
        sendJson(500, { success: false, error: 'Failed to verify handover OTP.' })
      }
      return true
    }

    // POST /api/donations/:id/cancel
    if (action === 'cancel' && req.method === 'POST') {
      try {
        const body = await readJsonBody<{ donorId: string; reason?: string }>()
        const result = donationStore.cancelDonation(donationId, body.donorId || 'donor', body.reason)
        if (!result.success) {
          sendJson(400, result)
          return true
        }
        sendJson(200, result)
      } catch {
        sendJson(500, { success: false, error: 'Failed to cancel donation.' })
      }
      return true
    }

    // POST /api/donations/:id/volunteer-location
    if (action === 'volunteer-location' && req.method === 'POST') {
      try {
        const body = await readJsonBody<{
          volunteerId: string
          coordinates: { latitude: number; longitude: number }
        }>()
        if (!body.volunteerId || !body.coordinates) {
          sendJson(400, { success: false, error: 'volunteerId and coordinates are required.' })
          return true
        }
        const result = donationStore.updateVolunteerLocation(donationId, body.volunteerId, body.coordinates)
        if (!result.success) {
          sendJson(400, result)
          return true
        }
        sendJson(200, result)
      } catch {
        sendJson(500, { success: false, error: 'Failed to update volunteer location.' })
      }
      return true
    }
  }

  // ========================================================
  // 7. USER PROFILE API
  // ========================================================

  // GET /api/profile/donor
  if (pathname === '/api/profile/donor' && req.method === 'GET') {
    const id = url.searchParams.get('id') || 'donor_taj_bengaluru'
    const profile = donationStore.getDonorProfile(id)
    sendJson(200, { success: true, profile })
    return true
  }

  // POST /api/profile/donor
  if (pathname === '/api/profile/donor' && req.method === 'POST') {
    try {
      const body = await readJsonBody<any>()
      const updated = donationStore.updateDonorProfile(body)
      sendJson(200, { success: true, profile: updated })
    } catch {
      sendJson(500, { success: false, error: 'Failed to update donor profile.' })
    }
    return true
  }

  // GET /api/profile/volunteer
  if (pathname === '/api/profile/volunteer' && req.method === 'GET') {
    const id = url.searchParams.get('id') || 'vol_vikram_01'
    const profile = donationStore.getVolunteerProfile(id)
    sendJson(200, { success: true, profile })
    return true
  }

  // POST /api/profile/volunteer
  if (pathname === '/api/profile/volunteer' && req.method === 'POST') {
    try {
      const body = await readJsonBody<any>()
      const updated = donationStore.updateVolunteerProfile(body)
      sendJson(200, { success: true, profile: updated })
    } catch {
      sendJson(500, { success: false, error: 'Failed to update volunteer profile.' })
    }
    return true
  }

  // ========================================================
  // 8. NOTIFICATIONS API
  // ========================================================

  // GET /api/notifications
  if (pathname === '/api/notifications' && req.method === 'GET') {
    const role = url.searchParams.get('role') || undefined
    const userId = url.searchParams.get('userId') || undefined
    const notifs = donationStore.getNotifications(role, userId)
    sendJson(200, { success: true, notifications: notifs })
    return true
  }

  // POST /api/notifications/:id/read
  const notifReadMatch = pathname.match(/^\/api\/notifications\/([^/]+)\/read$/)
  if (notifReadMatch && req.method === 'POST') {
    const notifId = notifReadMatch[1]
    const updated = donationStore.markNotificationRead(notifId)
    sendJson(200, { success: updated })
    return true
  }

  return false
}
